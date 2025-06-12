package card

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strconv"
	"time"

	"gorm.io/gorm"

	"paytm/internal/encryption"
	"paytm/internal/middleware"
	"paytm/internal/models"
)

type CardService struct {
	db         *gorm.DB
	encryption *encryption.EncryptionService
}

type CardRequest struct {
	CardNumber  string `json:"card_number"`
	ExpiryMonth string `json:"expiry_month"`
	ExpiryYear  string `json:"expiry_year"`
	CVV         string `json:"cvv"`
	HolderName  string `json:"holder_name"`
}

type CardResponse struct {
	ID           uint   `json:"id"`
	MaskedNumber string `json:"masked_number"`
	CardType     string `json:"card_type"`
	HolderName   string `json:"holder_name"`
	ExpiryMonth  string `json:"expiry_month"`
	ExpiryYear   string `json:"expiry_year"`
	IsActive     bool   `json:"is_active"`
	CreatedAt    string `json:"created_at"`
	LastUsedAt   string `json:"last_used_at,omitempty"`
}

type AddMoneyWithCardRequest struct {
	Amount      int64        `json:"amount"`
	Description string       `json:"description"`
	CardID      *uint        `json:"card_id,omitempty"`
	CardData    *CardRequest `json:"card_data,omitempty"`
}

type AddMoneyResponse struct {
	Message       string `json:"message"`
	Amount        int64  `json:"amount"`
	Fee           int64  `json:"fee"`
	NewBalance    int64  `json:"new_balance"`
	TransactionID uint   `json:"transaction_id"`
}

func NewCardService(db *gorm.DB) (*CardService, error) {
	encService, err := encryption.NewEncryptionService()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize encryption service: %w", err)
	}
	return &CardService{db: db, encryption: encService}, nil
}

func (cs *CardService) detectCardType(number string) models.CardType {
	cleaned := regexp.MustCompile(`\D`).ReplaceAllString(number, "")

	if regexp.MustCompile(`^4`).MatchString(cleaned) {
		return models.CardTypeVISA
	}
	if regexp.MustCompile(`^5[1-5]|^2[2-7]`).MatchString(cleaned) {
		return models.CardTypeMasterCard
	}
	if regexp.MustCompile(`^3[47]`).MatchString(cleaned) {
		return models.CardTypeAmex
	}
	if regexp.MustCompile(`^6011|^622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[01][0-9]|92[0-5])|^64[4-9]|^65`).MatchString(cleaned) {
		return models.CardTypeDiscover
	}

	return models.CardTypeVISA
}

func (cs *CardService) generateMaskedNumber(cardNumber string, cardType models.CardType) string {
	cleaned := regexp.MustCompile(`\D`).ReplaceAllString(cardNumber, "")
	if len(cleaned) < 7 {
		return ""
	}

	first4 := cleaned[:4]
	last3 := cleaned[len(cleaned)-3:]

	return fmt.Sprintf("%s%sxxxx%s", cardType, first4, last3)
}

func (cs *CardService) validateCardData(req CardRequest) error {
	cleaned := regexp.MustCompile(`\D`).ReplaceAllString(req.CardNumber, "")

	if len(cleaned) < 13 || len(cleaned) > 19 {
		return fmt.Errorf("card number must be between 13 and 19 digits")
	}

	month, err := strconv.Atoi(req.ExpiryMonth)
	if err != nil || month < 1 || month > 12 {
		return fmt.Errorf("expiry month must be between 1 and 12")
	}

	year, err := strconv.Atoi(req.ExpiryYear)
	if err != nil || year < 0 || year > 99 {
		return fmt.Errorf("expiry year must be between 00 and 99")
	}

	if len(req.CVV) < 3 || len(req.CVV) > 4 {
		return fmt.Errorf("CVV must be 3 or 4 digits")
	}

	if _, err := strconv.Atoi(req.CVV); err != nil {
		return fmt.Errorf("CVV must contain only digits")
	}

	if len(req.HolderName) < 2 || len(req.HolderName) > 50 {
		return fmt.Errorf("cardholder name must be between 2 and 50 characters")
	}

	return nil
}

func (cs *CardService) AddCard(userID uint, req CardRequest) (*models.Card, error) {

	if err := cs.validateCardData(req); err != nil {
		log.Printf("❌ Card validation failed for user %d: %v", userID, err)
		return nil, err
	}

	cardType := cs.detectCardType(req.CardNumber)
	maskedNumber := cs.generateMaskedNumber(req.CardNumber, cardType)

	var existingCard models.Card
	err := cs.db.Where("user_id = ? AND masked_number = ? AND is_active = ?",
		userID, maskedNumber, true).First(&existingCard).Error
	if err == nil {
		return nil, fmt.Errorf("this card is already added to your account")
	}

	cardDataJSON, _ := json.Marshal(req)
	encryptedData, err := cs.encryption.Encrypt(string(cardDataJSON))
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt card data: %w", err)
	}

	card := &models.Card{
		UserID:       userID,
		CardToken:    encryptedData,
		MaskedNumber: maskedNumber,
		CardType:     cardType,
		HolderName:   req.HolderName,
		ExpiryMonth:  req.ExpiryMonth,
		ExpiryYear:   req.ExpiryYear,
		IsActive:     true,
	}

	if err := cs.db.Create(card).Error; err != nil {
		return nil, fmt.Errorf("failed to save card: %w", err)
	}

	log.Printf("✅ Card added for user %d: %s", userID, maskedNumber)
	return card, nil
}

func (cs *CardService) calculateFee(amount int64) int64 {
	return int64(float64(amount) * 0.014)
}

func GetCardsHandler(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		currentUser, ok := middleware.GetUserFromContext(r)
		if !ok {
			http.Error(w, "User not found in context", http.StatusUnauthorized)
			return
		}

		var cards []models.Card
		if err := db.Where("user_id = ? AND is_active = ?", currentUser.ID, true).
			Order("created_at DESC").Find(&cards).Error; err != nil {
			log.Printf("Error fetching cards for user %d: %v", currentUser.ID, err)
			http.Error(w, "Error fetching cards", http.StatusInternalServerError)
			return
		}

		var cardResponses []CardResponse
		for _, card := range cards {
			response := CardResponse{
				ID:           card.ID,
				MaskedNumber: card.MaskedNumber,
				CardType:     string(card.CardType),
				HolderName:   card.HolderName,
				ExpiryMonth:  card.ExpiryMonth,
				ExpiryYear:   card.ExpiryYear,
				IsActive:     card.IsActive,
				CreatedAt:    card.CreatedAt.Format(time.RFC3339),
			}

			if card.LastUsedAt != nil {
				response.LastUsedAt = card.LastUsedAt.Format(time.RFC3339)
			}

			cardResponses = append(cardResponses, response)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string][]CardResponse{"cards": cardResponses})
	}
}

func AddCardHandler(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		currentUser, ok := middleware.GetUserFromContext(r)
		if !ok {
			http.Error(w, "User not found in context", http.StatusUnauthorized)
			return
		}

		var req CardRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON format", http.StatusBadRequest)
			return
		}

		cardService, err := NewCardService(db)
		if err != nil {
			log.Printf("Failed to initialize card service: %v", err)
			http.Error(w, "Service initialization failed", http.StatusInternalServerError)
			return
		}

		card, err := cardService.AddCard(currentUser.ID, req)
		if err != nil {
			log.Printf("Failed to add card for user %d: %v", currentUser.ID, err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		response := CardResponse{
			ID:           card.ID,
			MaskedNumber: card.MaskedNumber,
			CardType:     string(card.CardType),
			HolderName:   card.HolderName,
			ExpiryMonth:  card.ExpiryMonth,
			ExpiryYear:   card.ExpiryYear,
			IsActive:     card.IsActive,
			CreatedAt:    card.CreatedAt.Format(time.RFC3339),
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(response)
	}
}

func AddMoneyWithCardHandler(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		currentUser, ok := middleware.GetUserFromContext(r)
		if !ok {
			http.Error(w, "User not found in context", http.StatusUnauthorized)
			return
		}

		var req AddMoneyWithCardRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON format", http.StatusBadRequest)
			return
		}

		if req.Amount <= 0 {
			http.Error(w, "Amount must be greater than 0", http.StatusBadRequest)
			return
		}

		if req.Amount > 100000 {
			http.Error(w, "Amount cannot exceed 1000 per transaction", http.StatusBadRequest)
			return
		}

		if req.CardID == nil && req.CardData == nil {
			http.Error(w, "Either card_id or card_data must be provided", http.StatusBadRequest)
			return
		}

		cardService, err := NewCardService(db)
		if err != nil {
			log.Printf("Failed to initialize card service: %v", err)
			http.Error(w, "Service initialization failed", http.StatusInternalServerError)
			return
		}

		tx := db.Begin()
		defer func() {
			if r := recover(); r != nil {
				tx.Rollback()
			}
		}()

		var cardID uint

		if req.CardData != nil {
			card, err := cardService.AddCard(currentUser.ID, *req.CardData)
			if err != nil {
				tx.Rollback()
				log.Printf("Error adding new card for user %d: %v", currentUser.ID, err)
				http.Error(w, fmt.Sprintf("Error adding card: %v", err), http.StatusBadRequest)
				return
			}
			cardID = card.ID
		} else {
			var card models.Card
			if err := tx.Where("id = ? AND user_id = ? AND is_active = ?",
				*req.CardID, currentUser.ID, true).First(&card).Error; err != nil {
				tx.Rollback()
				if err == gorm.ErrRecordNotFound {
					http.Error(w, "Card not found or inactive", http.StatusNotFound)
				} else {
					log.Printf("Error fetching card %d for user %d: %v", *req.CardID, currentUser.ID, err)
					http.Error(w, "Error fetching card", http.StatusInternalServerError)
				}
				return
			}
			cardID = card.ID
		}

		fee := cardService.calculateFee(req.Amount)

		var user models.User
		if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&user, currentUser.ID).Error; err != nil {
			tx.Rollback()
			log.Printf("Error fetching user %d for balance update: %v", currentUser.ID, err)
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		user.Balance += req.Amount

		if err := tx.Save(&user).Error; err != nil {
			tx.Rollback()
			log.Printf("Error updating balance for user %d: %v", currentUser.ID, err)
			http.Error(w, "Error updating balance", http.StatusInternalServerError)
			return
		}

		transaction := models.Transaction{
			SenderID:      user.ID,
			ReceiverID:    user.ID,
			Amount:        req.Amount,
			Fee:           fee,
			Type:          models.TransactionSelf,
			PaymentMethod: models.PaymentMethodCard,
			CardID:        &cardID,
			Status:        "completed",
			Description:   fmt.Sprintf("Added money via card: %s", req.Description),
			Timestamp:     time.Now(),
		}

		if err := tx.Create(&transaction).Error; err != nil {
			tx.Rollback()
			log.Printf("Error creating transaction for user %d: %v", currentUser.ID, err)
			http.Error(w, "Error creating transaction record", http.StatusInternalServerError)
			return
		}

		if err := tx.Model(&models.Card{}).Where("id = ?", cardID).
			Update("last_used_at", time.Now()).Error; err != nil {
			log.Printf("Warning: Failed to update card last used time: %v", err)
		}

		if err := tx.Commit().Error; err != nil {
			log.Printf("Error committing transaction for user %d: %v", currentUser.ID, err)
			http.Error(w, "Error completing transaction", http.StatusInternalServerError)
			return
		}

		log.Printf("✅ Money added successfully for user %d: Amount=%d, Fee=%d",
			currentUser.ID, req.Amount, fee)

		response := AddMoneyResponse{
			Message:       "Money added successfully",
			Amount:        req.Amount,
			Fee:           fee,
			NewBalance:    user.Balance,
			TransactionID: transaction.ID,
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(response)
	}
}
