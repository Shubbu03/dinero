package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/joho/godotenv"
	"gorm.io/gorm"

	"paytm/internal/db"
	"paytm/internal/models"
	"paytm/internal/routes"
)

func main() {
	if err := loadEnvFile(); err != nil {
		log.Printf("Warning: %v", err)
	}

	database, err := db.InitDB(os.Getenv("DB_URL"))
	if err != nil {

	}
	defer db.CloseDB(database)

	if shouldRunMigrations() {
		log.Println("Running database migrations...")
		if err := runMigrations(database); err != nil {
			log.Fatalf("failed to run migrations: %v", err)
		}
		log.Println("Database migrations completed successfully")
	}

	r := chi.NewRouter()

	if err := routes.RegisterEnhancedRoutes(r, database); err != nil {
		log.Fatalf("failed to register enhanced routes: %v", err)
	}

	port := getPort()
	server := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		fmt.Printf("Server listening on http://localhost:%s\n", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server gracefully stopped")
}

func loadEnvFile() error {
	envPath := filepath.Join(".", ".env")
	if err := godotenv.Load(envPath); err != nil {
		if os.Getenv("ENV") == "production" {
			return fmt.Errorf(".env file not found at %s (this might be expected in production)", envPath)
		}
		return fmt.Errorf("error loading .env file from %s: %v", envPath, err)
	}
	return nil
}

func shouldRunMigrations() bool {
	runMigrations := os.Getenv("RUN_MIGRATIONS")
	env := os.Getenv("ENV")

	if runMigrations == "true" {
		return true
	}
	if runMigrations == "false" {
		return false
	}

	return env != "production"
}

func runMigrations(database *gorm.DB) error {
	return database.AutoMigrate(
		&models.User{},
		&models.Transaction{},
	)
}

func getPort() string {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	return port
}
