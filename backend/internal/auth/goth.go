package auth

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/sessions"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/google"
)

func InitGoth() {
	sessionSecret := os.Getenv("SESSION_SECRET")
	if sessionSecret == "" {
		log.Println("Warning: SESSION_SECRET not set, using a default value. This is not secure for production.")
		sessionSecret = "a-very-secret-string"
	}

	store := sessions.NewCookieStore([]byte(sessionSecret))
	store.MaxAge(3600)
	store.Options.Path = "/auth"
	store.Options.HttpOnly = true

	if os.Getenv("ENV") == "production" {
		store.Options.Secure = true
		store.Options.SameSite = http.SameSiteLaxMode
		if domain := os.Getenv("COOKIE_DOMAIN"); domain != "" {
			store.Options.Domain = domain
		}
	} else {
		store.Options.Secure = false
		store.Options.SameSite = http.SameSiteLaxMode
	}

	gothic.Store = store

	googleClientID := os.Getenv("GOOGLE_CLIENT_ID")
	googleClientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
	baseURL := getBaseURL()

	if googleClientID != "" && googleClientSecret != "" {
		goth.UseProviders(
			google.New(googleClientID, googleClientSecret, fmt.Sprintf("%s/auth/google/callback", baseURL), "email", "profile"),
		)
		log.Println("✅ Google OAuth2 provider configured")
	} else {
		log.Println("Warning: Google OAuth2 credentials not found. Google login will not be available.")
	}
}
