package main

import (
	"log"
	"os"
	"path/filepath"

	"paytm/internal/db"
	"paytm/internal/models"

	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load(filepath.Join("..", "..", ".env"))
	if err != nil {
		log.Printf("Warning: Error loading .env file: %v", err)
	}

	database, err := db.InitDB(os.Getenv("DB_URL"))
	if err != nil {
		log.Fatalf("failed to connect to DB: %v", err)
	}
	defer db.CloseDB(database)

	log.Println("Running database migrations...")
	err = database.AutoMigrate(
		&models.User{},
		&models.Card{},
		&models.Transaction{},
	)
	if err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	log.Println("Database migrations completed successfully!")
}
