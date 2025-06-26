package cmd

import (
	"database/sql"
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

	// Check if there's a declined request and update it
	result, err := app.DB.Exec(
		"UPDATE follows SET status = ? WHERE follower_id = ? AND following_id = ? AND status = 'declined'",
		status, followerID, req.UserID,
	)
	
	rowsAffected, _ := result.RowsAffected()
	
	// If no declined request to update, insert new one
	if rowsAffected == 0 {
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

	// Update status to declined instead of deleting
	result, err := app.DB.Exec(
		"UPDATE follows SET status = 'declined' WHERE follower_id = ? AND following_id = ? AND status = 'pending'",
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

// HandleGetFollowRequests retrieves pending follow requests for a user
func (app *App) HandleGetFollowRequests(w http.ResponseWriter, r *http.Request) {
	userID, err := app.GetUserFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	rows, err := app.DB.Query(`
		SELECT u.id, u.nickname, u.first_name, u.last_name, u.image
		FROM users u
		INNER JOIN follows f ON u.id = f.follower_id
		WHERE f.following_id = ? AND f.status = 'pending'
		ORDER BY f.created_at DESC
	`, userID)
	
	if err != nil {
		http.Error(w, "Could not retrieve follow requests", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var requests []FollowUser
	for rows.Next() {
		var request FollowUser
		var profilePic sql.NullString
		
		err := rows.Scan(&request.ID, &request.Nickname, &request.FirstName, &request.LastName, &profilePic)
		if err != nil {
			continue
		}
		
		if profilePic.Valid && profilePic.String != "" {
			request.ProfilePic = strings.Replace(profilePic.String, "./uploads/", "/uploads/", 1)
		}
		
		requests = append(requests, request)
	}
	
	sendJSONResponse(w, http.StatusOK, requests)
}

// HandleCancelFollowRequest cancels a pending follow request
func (app *App) HandleCancelFollowRequest(w http.ResponseWriter, r *http.Request) {
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

	// Delete pending follow request
	result, err := app.DB.Exec(
		"DELETE FROM follows WHERE follower_id = ? AND following_id = ? AND status = 'pending'",
		followerID, req.UserID,
	)

	if err != nil {
		http.Error(w, "Could not cancel follow request", http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "No pending follow request found", http.StatusBadRequest)
		return
	}

	sendJSONResponse(w, http.StatusOK, map[string]string{
		"message": "Follow request cancelled",
	})
}