package auth

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"paytm/internal/jwt"
	"paytm/internal/models"
)

func GenerateUserTokens(user *models.User) (*jwt.TokenPair, error) {
	return jwt.GenerateTokenPair(user.ID, user.Email, user.Name)
}

func ValidateEmailPassword(db *gorm.DB, email, password string) (*models.User, bool) {
	var user models.User
	if err := db.Where("email = ?", email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			bcrypt.CompareHashAndPassword(
				[]byte("$2a$14$dummySaltStringToEqualiseTiming............."), []byte(password))
			return nil, false
		}
		log.Printf("Error finding user by email: %v", err)
		return nil, false
	}

	if len(user.Password) == 0 {
		return nil, false
	}

	err := bcrypt.CompareHashAndPassword(user.Password, []byte(password))
	return &user, err == nil
}

func GetUserByEmail(db *gorm.DB, email string) (*models.User, error) {
	var user models.User
	err := db.Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func SignupWithEmail(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			User   string `json:"user"`
			Passwd string `json:"passwd"`
			Name   string `json:"name,omitempty"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}

		if req.User == "" || req.Passwd == "" {
			http.Error(w, "Email and password are required", http.StatusBadRequest)
			return
		}

		_, err := GetUserByEmail(db, req.User)
		if err == nil {
			http.Error(w, "User already exists", http.StatusConflict)
			return
		}
		if err != gorm.ErrRecordNotFound {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Passwd), bcrypt.DefaultCost)
		if err != nil {
			http.Error(w, "Error hashing password", http.StatusInternalServerError)
			return
		}

		name := req.Name
		if name == "" {
			name = req.User
			if atIndex := strings.Index(req.User, "@"); atIndex > 0 {
				name = req.User[:atIndex]
			}
		}

		user := models.User{
			Name:         name,
			Email:        req.User,
			Password:     hashedPassword,
			AuthProvider: "email",
			Balance:      0,
			Currency:     "USD",
		}

		if err := db.Create(&user).Error; err != nil {
			http.Error(w, "Error creating user", http.StatusInternalServerError)
			return
		}

		tokens, err := GenerateUserTokens(&user)
		if err != nil {
			log.Printf("Error generating tokens for new user: %v", err)
			http.Error(w, "Could not generate authentication tokens", http.StatusInternalServerError)
			return
		}

		SetTokenCookies(w, tokens)

		log.Printf("✅ New user created and logged in: %s (ID: %d)", user.Email, user.ID)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message":      "User created and logged in successfully",
			"access_token": tokens.AccessToken,
			"expires_in":   tokens.ExpiresIn,
		})
	}
}

func LoginWithEmail(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			User   string `json:"user"`
			Passwd string `json:"passwd"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}

		user, ok := ValidateEmailPassword(db, req.User, req.Passwd)
		if !ok {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}

		tokens, err := GenerateUserTokens(user)
		if err != nil {
			log.Printf("Error generating tokens: %v", err)
			http.Error(w, "Could not generate authentication tokens", http.StatusInternalServerError)
			return
		}

		SetTokenCookies(w, tokens)

		log.Printf("✅ Email login successful for user: %s (ID: %d)", user.Email, user.ID)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message":      "Logged in successfully",
			"access_token": tokens.AccessToken,
			"expires_in":   tokens.ExpiresIn,
		})
	}
}

func Logout(w http.ResponseWriter, r *http.Request) {
	ClearTokenCookies(w)

	log.Printf("✅ User logged out successfully")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Logged out successfully"})
}

func RefreshTokenHandler(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("refresh_token")
		if err != nil {
			http.Error(w, "No refresh token provided", http.StatusUnauthorized)
			return
		}

		refreshClaims, err := jwt.ValidateRefreshToken(cookie.Value)
		if err != nil {
			log.Printf("Invalid refresh token: %v", err)
			http.Error(w, "Invalid refresh token", http.StatusUnauthorized)
			return
		}

		var user models.User
		if err := db.First(&user, refreshClaims.UserID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				http.Error(w, "User not found", http.StatusUnauthorized)
				return
			}
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		tokens, err := GenerateUserTokens(&user)
		if err != nil {
			log.Printf("Error generating new tokens: %v", err)
			http.Error(w, "Could not generate new tokens", http.StatusInternalServerError)
			return
		}

		SetTokenCookies(w, tokens)

		log.Printf("✅ Tokens refreshed for user: %s (ID: %d)", user.Email, user.ID)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message":      "Tokens refreshed successfully",
			"access_token": tokens.AccessToken,
			"expires_in":   tokens.ExpiresIn,
		})
	}
}
