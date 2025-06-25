package cmd

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

// HandleFollowRequest sends a follow request
func (app *App) HandleFollowRequest(w http.ResponseWriter, r *http.Request) {
	followerID, err := app.GetUserFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		UserID int `json:"userId"`
	}

	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if followerID == req.UserID {
		http.Error(w, "Cannot follow yourself", http.StatusBadRequest)
		return
	}

	// Check if target user has private profile
	var isPrivate bool
	err = app.DB.QueryRow("SELECT is_private FROM users WHERE id = ?", req.UserID).Scan(&isPrivate)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// If profile is public, auto-accept
	status := "pending"
	if !isPrivate {
		status = "accepted"
	}

	// Insert follow relationship
	_, err = app.DB.Exec(
		"INSERT INTO follows (follower_id, following_id, status) VALUES (?, ?, ?)",
		followerID, req.UserID, status,
	)

	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			http.Error(w, "Already following or request pending", http.StatusConflict)
			return
		}
		fmt.Println("Error creating follow:", err)
		http.Error(w, "Could not create follow request", http.StatusInternalServerError)
		return
	}

	message := "Follow request sent"
	if status == "accepted" {
		message = "Now following"
	}

	sendJSONResponse(w, http.StatusOK, map[string]string{
		"message": message,
		"status":  status,
	})
}

// HandleUnfollow removes a follow relationship
func (app *App) HandleUnfollow(w http.ResponseWriter, r *http.Request) {
	followerID, err := app.GetUserFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		UserID int `json:"userId"`
	}

	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Delete follow relationship
	result, err := app.DB.Exec(
		"DELETE FROM follows WHERE follower_id = ? AND following_id = ?",
		followerID, req.UserID,
	)

	if err != nil {
		http.Error(w, "Could not unfollow", http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "Not following this user", http.StatusBadRequest)
		return
	}

	sendJSONResponse(w, http.StatusOK, map[string]string{
		"message": "Unfollowed successfully",
	})
}

// HandleAcceptFollow accepts a follow request
func (app *App) HandleAcceptFollow(w http.ResponseWriter, r *http.Request) {
	userID, err := app.GetUserFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		FollowerID int `json:"followerId"`
	}

	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Update follow status
	result, err := app.DB.Exec(
		"UPDATE follows SET status = 'accepted' WHERE follower_id = ? AND following_id = ? AND status = 'pending'",
		req.FollowerID, userID,
	)

	if err != nil {
		http.Error(w, "Could not accept follow request", http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "No pending follow request found", http.StatusBadRequest)
		return
	}

	sendJSONResponse(w, http.StatusOK, map[string]string{
		"message": "Follow request accepted",
	})
}

// HandleDeclineFollow declines a follow request
func (app *App) HandleDeclineFollow(w http.ResponseWriter, r *http.Request) {
	userID, err := app.GetUserFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		FollowerID int `json:"followerId"`
	}

	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Delete follow request
	result, err := app.DB.Exec(
		"DELETE FROM follows WHERE follower_id = ? AND following_id = ? AND status = 'pending'",
		req.FollowerID, userID,
	)

	if err != nil {
		http.Error(w, "Could not decline follow request", http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "No pending follow request found", http.StatusBadRequest)
		return
	}

	sendJSONResponse(w, http.StatusOK, map[string]string{
		"message": "Follow request declined",
	})
}