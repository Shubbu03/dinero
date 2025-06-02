package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi/v5"
	"github.com/joho/godotenv"

	"paytm/internal/db"
	"paytm/internal/routes"
)

func main() {
	err := godotenv.Load(filepath.Join("..", ".env"))
	if err != nil {
		log.Fatalf("Error loading .env file from %s: %v", filepath.Join("..", ".env"), err)
	}

	database, err := db.InitDB(os.Getenv("DB_URL"))
	if err != nil {
		log.Fatalf("failed to connect to DB: %v", err)
	}
	defer db.CloseDB(database)

	r := chi.NewRouter()

	routes.RegisterRoutes(r, database)

	port := os.Getenv("PORT")
	fmt.Printf("Server listening on http://localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
