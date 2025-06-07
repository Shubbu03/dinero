package auth

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/go-pkgz/auth/v2"
	"github.com/go-pkgz/auth/v2/avatar"
	"github.com/go-pkgz/auth/v2/provider"
	"github.com/go-pkgz/auth/v2/token"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"paytm/internal/models"
)

type EnhancedAuthService struct {
	*auth.Service
	db *gorm.DB
}

func NewEnhancedAuth(db *gorm.DB) (*EnhancedAuthService, error) {
	avatarDir := "./avatars"
	if err := os.MkdirAll(avatarDir, 0755); err != nil {
		log.Printf("Warning: Could not create avatar directory: %v", err)
	}

	opts := auth.Opts{
		SecretReader: token.SecretFunc(func(id string) (string, error) {
			secret := os.Getenv("JWT_SECRET")
			if secret == "" {
				return "", fmt.Errorf("JWT_SECRET not found")
			}
			return secret, nil
		}),
		TokenDuration:  time.Hour * 24,
		CookieDuration: time.Hour * 24,
		Issuer:         "paytm-backend",
		URL:            getBaseURL(),
		AvatarStore:    avatar.NewLocalFS(avatarDir),
		DisableXSRF:    isDevelopment(),
		SecureCookies:  !isDevelopment(),
		ClaimsUpd: token.ClaimsUpdFunc(func(claims token.Claims) token.Claims {
			return claims
		}),
	}

	service := auth.NewService(opts)

	if err := addGoogleProvider(service); err != nil {
		log.Printf("Warning: Google OAuth2 not configured: %v", err)
	}

	enhancedService := &EnhancedAuthService{
		Service: service,
		db:      db,
	}

	if err := enhancedService.addEmailProvider(); err != nil {
		return nil, fmt.Errorf("failed to add email provider: %v", err)
	}

	return enhancedService, nil
}

func addGoogleProvider(service *auth.Service) error {
	googleClientID := os.Getenv("GOOGLE_CLIENT_ID")
	googleClientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")

	if googleClientID == "" || googleClientSecret == "" {
		return fmt.Errorf("google OAuth2 credentials not found")
	}

	service.AddProvider("google", googleClientID, googleClientSecret)
	log.Println("✅ Google OAuth2 provider added")
	return nil
}

func (eas *EnhancedAuthService) addEmailProvider() error {
	credChecker := provider.CredCheckerFunc(func(user, password string) (bool, error) {
		return eas.validateEmailPassword(user, password)
	})

	eas.Service.AddDirectProvider("email", credChecker)
	log.Println("✅ Email/Password provider added")
	return nil
}

func (eas *EnhancedAuthService) validateEmailPassword(email, password string) (bool, error) {
	var user models.User
	if err := eas.db.Where("email = ?", email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return false, nil
		}
		return false, err 
	}

	if len(user.Password) == 0 {
		_ = bcrypt.CompareHashAndPassword(
			[]byte("$2a$14$dummySaltStringToEqualiseTiming............."), []byte(password))
		return false, nil
	}
	err := bcrypt.CompareHashAndPassword(user.Password, []byte(password))
	return err == nil, nil
}

func (eas *EnhancedAuthService) createEmailUser(email, password string) (bool, error) {
	var existingUser models.User
	if err := eas.db.Where("email = ?", email).First(&existingUser).Error; err == nil {
		return false, fmt.Errorf("user already exists")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return false, err
	}

	name := email
	if atIndex := len(email); atIndex > 0 {
		for i, char := range email {
			if char == '@' {
				name = email[:i]
				break
			}
		}
	}


	user := models.User{
		Name:     name,
		Email:    email,
		Password: hashedPassword,
		Balance:  0,
	}

	if err := eas.db.Create(&user).Error; err != nil {
		return false, err
	}

	log.Printf("✅ New user created: %s", email)
	return true, nil
}

func (eas *EnhancedAuthService) SyncUserInfo(claims token.Claims) error {
	var user models.User
	err := eas.db.Where("email = ?", claims.User.Email).First(&user).Error

	if err == gorm.ErrRecordNotFound {
		user = models.User{
			Name:     claims.User.Name,
			Email:    claims.User.Email,
			Password: nil,
			Balance:  0,
		}

		if err := eas.db.Create(&user).Error; err != nil {
			return fmt.Errorf("failed to create OAuth2 user: %v", err)
		}
		log.Printf("✅ New OAuth2 user created: %s", claims.User.Email)
	} else if err != nil {
		return fmt.Errorf("database error: %v", err)
	}

	return nil
}

func (eas *EnhancedAuthService) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	err := eas.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func getBaseURL() string {
	if url := os.Getenv("BASE_URL"); url != "" {
		return url
	}
	if isDevelopment() {
		return "http://localhost:8080"
	}
	return "https://your-domain.com"
}

func isDevelopment() bool {
	return os.Getenv("ENV") != "production"
}
