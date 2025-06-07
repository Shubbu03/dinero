package user

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"

	"paytm/internal/models"
)

type AddFriendRequest struct {
	FriendID uint `json:"friend_id"`
}

type SearchResponse struct {
	Users []UserProfile `json:"users"`
}

type UserProfile struct {
	ID    uint   `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

func SearchUsersHandler(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query().Get("q")
		if query == "" {
			http.Error(w, "Search query is required", http.StatusBadRequest)
			return
		}

		currentUser := r.Context().Value("user").(*models.User)

		var users []models.User
		searchTerm := "%" + strings.ToLower(query) + "%"

		if err := db.Where("(LOWER(name) LIKE ? OR LOWER(email) LIKE ?) AND id != ?",
			searchTerm, searchTerm, currentUser.ID).Find(&users).Error; err != nil {
			http.Error(w, "Error searching users", http.StatusInternalServerError)
			return
		}

		var userProfiles []UserProfile
		for _, user := range users {
			userProfiles = append(userProfiles, UserProfile{
				ID:    user.ID,
				Name:  user.Name,
				Email: user.Email,
			})
		}

		response := SearchResponse{Users: userProfiles}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}

func AddFriendHandler(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req AddFriendRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}

		currentUser := r.Context().Value("user").(*models.User)

		if req.FriendID == currentUser.ID {
			http.Error(w, "Cannot add yourself as friend", http.StatusBadRequest)
			return
		}

		var friend models.User
		if err := db.First(&friend, req.FriendID).Error; err != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		var existingFriendship models.User
		if err := db.Model(currentUser).Association("Friends").Find(&existingFriendship, req.FriendID); err == nil && existingFriendship.ID != 0 {
			http.Error(w, "Already friends", http.StatusConflict)
			return
		}

		if err := db.Model(currentUser).Association("Friends").Append(&friend); err != nil {
			http.Error(w, "Error adding friend", http.StatusInternalServerError)
			return
		}

		if err := db.Model(&friend).Association("Friends").Append(currentUser); err != nil {
			http.Error(w, "Error adding friend", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Friend added successfully"})
	}
}

func GetFriendsHandler(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		currentUser := r.Context().Value("user").(*models.User)

		var user models.User
		if err := db.Preload("Friends").First(&user, currentUser.ID).Error; err != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		var friends []UserProfile
		for _, friend := range user.Friends {
			friends = append(friends, UserProfile{
				ID:    friend.ID,
				Name:  friend.Name,
				Email: friend.Email,
			})
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string][]UserProfile{"friends": friends})
	}
}

func RemoveFriendHandler(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		friendIDStr := chi.URLParam(r, "friendID")
		friendID, err := strconv.ParseUint(friendIDStr, 10, 32)
		if err != nil {
			http.Error(w, "Invalid friend ID", http.StatusBadRequest)
			return
		}

		currentUser := r.Context().Value("user").(*models.User)

		var friend models.User
		if err := db.First(&friend, uint(friendID)).Error; err != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		if err := db.Model(currentUser).Association("Friends").Delete(&friend); err != nil {
			http.Error(w, "Error removing friend", http.StatusInternalServerError)
			return
		}

		if err := db.Model(&friend).Association("Friends").Delete(currentUser); err != nil {
			http.Error(w, "Error removing friend", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Friend removed successfully"})
	}
}

func GetUserByIDHandler(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userIDStr := chi.URLParam(r, "userID")
		userID, err := strconv.ParseUint(userIDStr, 10, 32)
		if err != nil {
			http.Error(w, "Invalid user ID", http.StatusBadRequest)
			return
		}

		var user models.User
		if err := db.First(&user, uint(userID)).Error; err != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		userProfile := UserProfile{
			ID:    user.ID,
			Name:  user.Name,
			Email: user.Email,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(userProfile)
	}
}
