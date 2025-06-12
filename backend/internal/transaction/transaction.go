package transaction

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"gorm.io/gorm"

	"paytm/internal/middleware"
	"paytm/internal/models"
)

type TransferRequest struct {
	ReceiverID  uint   `json:"receiver_id"`
	Amount      int64  `json:"amount"`
	Description string `json:"description"`
}

type AddBalanceRequest struct {
	Amount      int64  `json:"amount"`
	Description string `json:"description"`
}

type TransactionResponse struct {
	ID          uint             `json:"id"`
	SenderID    uint             `json:"sender_id"`
	ReceiverID  uint             `json:"receiver_id"`
	Amount      int64            `json:"amount"`
	Description string           `json:"description"`
	Type        string           `json:"type"`
	Timestamp   time.Time        `json:"timestamp"`
	Sender      *TransactionUser `json:"sender"`
	Receiver    TransactionUser  `json:"receiver"`
}

type TransactionUser struct {
	ID    uint   `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

type TransactionHistoryResponse struct {
	Transactions []TransactionResponse `json:"transactions"`
	Total        int64                 `json:"total"`
	Page         int                   `json:"page"`
	Limit        int                   `json:"limit"`
}

type BalanceResponse struct {
	Balance int64 `json:"balance"`
}

func SendMoneyHandler(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req TransferRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}

		currentUser, ok := middleware.GetUserFromContext(r)
		if !ok {
			http.Error(w, "User not found in context", http.StatusUnauthorized)
			return
		}

		if req.Amount <= 0 {
			http.Error(w, "Amount must be greater than 0", http.StatusBadRequest)
			return
		}

		if req.ReceiverID == currentUser.ID {
			http.Error(w, "Cannot send money to yourself", http.StatusBadRequest)
			return
		}

		tx := db.Begin()
		defer func() {
			if r := recover(); r != nil {
				tx.Rollback()
			}
		}()

		var sender models.User
		if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&sender, currentUser.ID).Error; err != nil {
			tx.Rollback()
			http.Error(w, "Sender not found", http.StatusNotFound)
			return
		}

		if sender.Balance < req.Amount {
			tx.Rollback()
			http.Error(w, "Insufficient balance", http.StatusBadRequest)
			return
		}

		var receiver models.User
		if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&receiver, req.ReceiverID).Error; err != nil {
			tx.Rollback()
			http.Error(w, "Receiver not found", http.StatusNotFound)
			return
		}

		sender.Balance -= req.Amount
		receiver.Balance += req.Amount

		if err := tx.Save(&sender).Error; err != nil {
			tx.Rollback()
			http.Error(w, "Error updating sender balance", http.StatusInternalServerError)
			return
		}

		if err := tx.Save(&receiver).Error; err != nil {
			tx.Rollback()
			http.Error(w, "Error updating receiver balance", http.StatusInternalServerError)
			return
		}

		var transactionType models.TransactionType
		if currentUser.ID == sender.ID {
			transactionType = models.TransactionSent
		} else {
			transactionType = models.TransactionReceived
		}

		transaction := models.Transaction{
			SenderID:    sender.ID,
			ReceiverID:  receiver.ID,
			Amount:      req.Amount,
			Description: req.Description,
			Type:        transactionType,
			Timestamp:   time.Now(),
		}

		if err := tx.Create(&transaction).Error; err != nil {
			tx.Rollback()
			http.Error(w, "Error creating transaction", http.StatusInternalServerError)
			return
		}

		if err := tx.Commit().Error; err != nil {
			http.Error(w, "Error completing transaction", http.StatusInternalServerError)
			return
		}

		response := TransactionResponse{
			ID:          transaction.ID,
			SenderID:    transaction.SenderID,
			ReceiverID:  transaction.ReceiverID,
			Amount:      transaction.Amount,
			Description: transaction.Description,
			Timestamp:   transaction.Timestamp,
			Sender: &TransactionUser{
				ID:    sender.ID,
				Name:  sender.Name,
				Email: sender.Email,
			},
			Receiver: TransactionUser{
				ID:    receiver.ID,
				Name:  receiver.Name,
				Email: receiver.Email,
			},
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}

func GetTransactionHistoryHandler(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		currentUser, ok := middleware.GetUserFromContext(r)
		if !ok {
			http.Error(w, "User not found in context", http.StatusUnauthorized)
			return
		}

		page := 1
		if pageStr := r.URL.Query().Get("page"); pageStr != "" {
			if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
				page = p
			}
		}

		limit := 10
		if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
			if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
				limit = l
			}
		}

		offset := (page - 1) * limit

		var transactions []models.Transaction
		var total int64

		db.Model(&models.Transaction{}).
			Where("sender_id = ? OR receiver_id = ? OR (sender_id IS NULL AND receiver_id = ?)", currentUser.ID, currentUser.ID, currentUser.ID).
			Count(&total)

		if err := db.Preload("Sender").Preload("Receiver").
			Where("sender_id = ? OR receiver_id = ? OR (sender_id IS NULL AND receiver_id = ?)", currentUser.ID, currentUser.ID, currentUser.ID).
			Order("timestamp DESC").
			Limit(limit).
			Offset(offset).
			Find(&transactions).Error; err != nil {
			http.Error(w, "Error fetching transactions", http.StatusInternalServerError)
			return
		}

		var transactionResponses []TransactionResponse
		for _, transaction := range transactions {
			var senderInfo *TransactionUser
			if transaction.Sender != nil && transaction.Sender.ID != 0 {
				senderInfo = &TransactionUser{
					ID:    transaction.Sender.ID,
					Name:  transaction.Sender.Name,
					Email: transaction.Sender.Email,
				}
			}

			response := TransactionResponse{
				ID:          transaction.ID,
				SenderID:    transaction.SenderID,
				ReceiverID:  transaction.ReceiverID,
				Amount:      transaction.Amount,
				Description: transaction.Description,
				Type:        string(transaction.Type),
				Timestamp:   transaction.Timestamp,
				Sender:      senderInfo,
				Receiver: TransactionUser{
					ID:    transaction.Receiver.ID,
					Name:  transaction.Receiver.Name,
					Email: transaction.Receiver.Email,
				},
			}
			transactionResponses = append(transactionResponses, response)
		}

		response := TransactionHistoryResponse{
			Transactions: transactionResponses,
			Total:        total,
			Page:         page,
			Limit:        limit,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}

func GetBalanceHandler(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		currentUser, ok := middleware.GetUserFromContext(r)
		if !ok {
			http.Error(w, "User not found in context", http.StatusUnauthorized)
			return
		}

		var user models.User
		if err := db.First(&user, currentUser.ID).Error; err != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		response := BalanceResponse{
			Balance: user.Balance,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}

func AddBalanceHandler(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req AddBalanceRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}

		currentUser, ok := middleware.GetUserFromContext(r)
		if !ok {
			http.Error(w, "User not found in context", http.StatusUnauthorized)
			return
		}

		if req.Amount <= 0 {
			http.Error(w, "Amount must be greater than 0", http.StatusBadRequest)
			return
		}

		tx := db.Begin()
		defer func() {
			if r := recover(); r != nil {
				tx.Rollback()
			}
		}()

		var user models.User
		if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&user, currentUser.ID).Error; err != nil {
			tx.Rollback()
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		user.Balance += req.Amount

		if err := tx.Save(&user).Error; err != nil {
			tx.Rollback()
			http.Error(w, "Error updating balance", http.StatusInternalServerError)
			return
		}

		transaction := models.Transaction{
			SenderID:    user.ID,
			ReceiverID:  user.ID,
			Amount:      req.Amount,
			Type:        "self",
			Description: "Balance added: " + req.Description,
			Timestamp:   time.Now(),
		}

		if err := tx.Create(&transaction).Error; err != nil {
			tx.Rollback()
			http.Error(w, "Error creating transaction record", http.StatusInternalServerError)
			return
		}

		if err := tx.Commit().Error; err != nil {
			http.Error(w, "Error completing balance addition", http.StatusInternalServerError)
			return
		}

		response := BalanceResponse{
			Balance: user.Balance,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}
