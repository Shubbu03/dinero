package routes

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"gorm.io/gorm"

	"paytm/internal/auth"
	enhancedMiddleware "paytm/internal/middleware"
	"paytm/internal/transaction"
	"paytm/internal/user"
)

func RegisterEnhancedRoutes(r chi.Router, db *gorm.DB) error {
	authService, err := auth.NewEnhancedAuth(db)
	if err != nil {
		return err
	}

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-JWT"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)

	enhancedMw := enhancedMiddleware.NewEnhancedAuthMiddleware(db)

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"message": "👋 Welcome to Enhanced Paytm API", "status": "healthy"}`))
	})

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status": "healthy"}`))
	})

	authRoutes, avatarRoutes := authService.Handlers()
	r.Mount("/auth", authRoutes)
	r.Mount("/avatar", avatarRoutes)

	r.Get("/auth/info", func(w http.ResponseWriter, r *http.Request) {
		providers := []map[string]string{
			{"name": "google", "url": "/auth/google/login"},
			{"name": "email", "url": "/auth/email/login"},
		}

		response := map[string]any{
			"providers": providers,
			"status":    "available",
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	})

	r.Route("/api", func(r chi.Router) {
		authMw := authService.Middleware()
		r.Use(authMw.Auth)
		r.Use(enhancedMw.UserFromAuth)

		r.Route("/user", func(r chi.Router) {
			r.Get("/me", getUserProfileHandler)
			r.Get("/balance", transaction.GetBalanceHandler(db))
			r.Get("/{userID}", user.GetUserByIDHandler(db))
		})

		r.Route("/users", func(r chi.Router) {
			r.Get("/search", user.SearchUsersHandler(db))
		})

		r.Route("/friends", func(r chi.Router) {
			r.Get("/", user.GetFriendsHandler(db))
			r.Post("/add", user.AddFriendHandler(db))
			r.Delete("/{friendID}", user.RemoveFriendHandler(db))
		})

		r.Route("/transactions", func(r chi.Router) {
			r.Post("/send", transaction.SendMoneyHandler(db))
			r.Get("/history", transaction.GetTransactionHistoryHandler(db))
			r.Get("/{transactionID}", transaction.GetTransactionByIDHandler(db))
		})

		r.Route("/wallet", func(r chi.Router) {
			r.Get("/balance", transaction.GetBalanceHandler(db))
			r.Post("/balance", transaction.AddBalanceHandler(db))
		})
	})

	return nil
}

func getUserProfileHandler(w http.ResponseWriter, r *http.Request) {
	usr, ok := enhancedMiddleware.GetUserFromContext(r)
	if !ok {
		http.Error(w, "User not found in context", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"id":            usr.ID,
		"name":          usr.Name,
		"email":         usr.Email,
		"balance":       usr.Balance,
		"auth_provider": usr.AuthProvider,
		"avatar":        usr.Avatar,
		"created_at":    usr.CreatedAt,
		"updated_at":    usr.UpdatedAt,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
