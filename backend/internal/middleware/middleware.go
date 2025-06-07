package middleware

import (
	"context"
	"net/http"

	"github.com/go-pkgz/auth/v2/token"
	"gorm.io/gorm"

	"paytm/internal/models"
)

type EnhancedAuthMiddleware struct {
	db *gorm.DB
}

func NewEnhancedAuthMiddleware(db *gorm.DB) *EnhancedAuthMiddleware {
	return &EnhancedAuthMiddleware{db: db}
}

func (m *EnhancedAuthMiddleware) UserFromAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, err := token.GetUserInfo(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		var dbUser models.User
		if err := m.db.Where("email = ?", user.Email).First(&dbUser).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				authProvider := "email"
				if user.ID != "" && user.Email != "" {
					authProvider = "google"
				}

				dbUser = models.User{
					Name:         user.Name,
					Email:        user.Email,
					AuthProvider: authProvider,
					ExternalID:   user.ID,
					Balance:      0,
					Avatar:       user.Picture,
				}
				if err := m.db.Create(&dbUser).Error; err != nil {
					http.Error(w, "Error creating user", http.StatusInternalServerError)
					return
				}
			} else {
				http.Error(w, "Database error", http.StatusInternalServerError)
				return
			}
		}

		type contextKey string

		const userContextKey contextKey = "user"

		ctx := context.WithValue(r.Context(), userContextKey, &dbUser)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func GetUserFromContext(r *http.Request) (*models.User, bool) {
	user, ok := r.Context().Value("user").(*models.User)
	return user, ok
}
