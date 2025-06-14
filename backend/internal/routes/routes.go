package routes

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"gorm.io/gorm"

	"paytm/internal/auth"
	"paytm/internal/card"
	customMiddleware "paytm/internal/middleware"
	"paytm/internal/transaction"
	"paytm/internal/user"
)

func RegisterEnhancedRoutes(r chi.Router, db *gorm.DB) error {
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:5173", "https://dinero.shubbu.dev"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "Cookie"},
		ExposedHeaders:   []string{"Link", "Set-Cookie"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"message": "👋 Welcome to Enhanced Paytm API", "status": "healthy"}`))
	})

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status": "healthy"}`))
	})

	r.Route("/auth", func(r chi.Router) {
		r.Post("/email/signup", auth.SignupWithEmail(db))
		r.Post("/email/login", auth.LoginWithEmail(db))
		r.Post("/refresh", auth.RefreshTokenHandler(db))
		r.Post("/logout", auth.Logout)
	})

	r.Route("/api", func(r chi.Router) {
		r.Use(customMiddleware.JWTAuthMiddleware(db))

		r.Get("/me", user.GetUserProfileHandler)

		r.Route("/user", func(r chi.Router) {
			r.Get("/balance", transaction.GetBalanceHandler(db))
			r.Get("/{userID}", user.GetUserByIDHandler(db))
			r.Put("/currency", user.UpdateUserCurrencyHandler(db))
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
		})
		r.Route("/wallet", func(r chi.Router) {
			r.Get("/balance", transaction.GetBalanceHandler(db))
			r.Post("/balance", transaction.AddBalanceHandler(db))
		})
		r.Route("/cards", func(r chi.Router) {
			r.Get("/", card.GetCardsHandler(db))
			r.Post("/", card.AddCardHandler(db))
			r.Post("/add-money", card.AddMoneyWithCardHandler(db))
		})
	})

	return nil
}
