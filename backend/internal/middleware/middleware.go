package middleware

import (
	"context"
	"log"
	"net/http"
	"strings"

	"gorm.io/gorm"

	"paytm/internal/jwt"
	"paytm/internal/models"
)

type contextKey string

const UserContextKey = contextKey("user")

func JWTAuthMiddleware(db *gorm.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var tokenString string

			authHeader := r.Header.Get("Authorization")
			if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
				tokenString = strings.TrimPrefix(authHeader, "Bearer ")
			} else {
				cookie, err := r.Cookie("access_token")
				if err == nil {
					tokenString = cookie.Value
				}
			}

			if tokenString == "" {
				log.Printf("No access token found in request")
				http.Error(w, "Unauthorized: No access token provided", http.StatusUnauthorized)
				return
			}

			claims, err := jwt.ValidateAccessToken(tokenString)
			if err != nil {
				log.Printf("Invalid access token: %v", err)
				http.Error(w, "Unauthorized: Invalid access token", http.StatusUnauthorized)
				return
			}

			var user models.User
			if err := db.First(&user, claims.UserID).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					log.Printf("User not found in database: %d", claims.UserID)
					http.Error(w, "Unauthorized: User not found", http.StatusUnauthorized)
					return
				}
				log.Printf("Database error while fetching user: %v", err)
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				return
			}

			log.Printf("✅ Authenticated user: %s (ID: %d)", user.Email, user.ID)

			ctx := context.WithValue(r.Context(), UserContextKey, &user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetUserFromContext(r *http.Request) (*models.User, bool) {
	user, ok := r.Context().Value(UserContextKey).(*models.User)
	return user, ok
}
