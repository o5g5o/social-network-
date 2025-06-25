package cmd

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
)

// HandleGetProfile retrieves a user's profile
func (app *App) HandleGetProfile(w http.ResponseWriter, r *http.Request) {
	// Get current user from session (for privacy check)
	currentUserID, _ := app.GetUserFromSession(r)
	
	// Get user ID from query parameter
	userIDStr := r.URL.Query().Get("userId")
	var targetUserID int
	var err error
	
	if userIDStr == "" || userIDStr == "me" {
		// If no userId provided or "me", return current user's profile
		if currentUserID == 0 {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		targetUserID = currentUserID
	} else {
		targetUserID, err = strconv.Atoi(userIDStr)
		if err != nil {
			http.Error(w, "Invalid user ID", http.StatusBadRequest)
			return
		}
	}
	
	// Get user info
	var profile UserProfile
	var profilePic sql.NullString
	var aboutMe sql.NullString
	var isPrivate bool
	
	err = app.DB.QueryRow(GetUserProfileQuery, targetUserID).Scan(
		&profile.ID,
		&profile.Email,
		&profile.FirstName,
		&profile.LastName,
		&profile.Nickname,
		&profile.DateOfBirth,
		&profilePic,
		&aboutMe,
		&isPrivate,
		&profile.CreatedAt,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
		fmt.Println("Error getting profile:", err)
		http.Error(w, "Could not retrieve profile", http.StatusInternalServerError)
		return
	}
	
	// Set nullable fields
	if profilePic.Valid && profilePic.String != "" {
		profile.ProfilePic = strings.Replace(profilePic.String, "./uploads/", "/uploads/", 1)
	}
	if aboutMe.Valid {
		profile.AboutMe = aboutMe.String
	}
	profile.IsPrivate = isPrivate
	profile.IsOwnProfile = (currentUserID == targetUserID)
	
	// Check if current user can view this profile
	canView := !isPrivate || profile.IsOwnProfile
	
	if !canView && currentUserID > 0 {
		// Check if current user is following target user
		var isFollowing bool
		err = app.DB.QueryRow(CheckFollowingQuery, currentUserID, targetUserID).Scan(&isFollowing)
		if err == nil && isFollowing {
			canView = true
		}
	}
	
	if !canView {
		// Return limited info for private profiles
		sendJSONResponse(w, http.StatusOK, map[string]interface{}{
			"id": profile.ID,
			"firstName": profile.FirstName,
			"lastName": profile.LastName,
			"nickname": profile.Nickname,
			"profilePic": profile.ProfilePic,
			"isPrivate": true,
			"canViewFullProfile": false,
			"isFollowing": false,
		})
		return
	}
	
	// Get follower/following counts
	err = app.DB.QueryRow(GetFollowerCountQuery, targetUserID).Scan(&profile.FollowersCount)
	if err != nil {
		profile.FollowersCount = 0
	}
	
	err = app.DB.QueryRow(GetFollowingCountQuery, targetUserID).Scan(&profile.FollowingCount)
	if err != nil {
		profile.FollowingCount = 0
	}
	
	// Get user's posts
	posts, err := app.GetUserPosts(targetUserID, currentUserID)
	if err != nil {
		fmt.Println("Error getting user posts:", err)
		posts = []Post{}
	}
	profile.Posts = posts
	
	// Check if current user is following target user
	if currentUserID > 0 && currentUserID != targetUserID {
		err = app.DB.QueryRow(CheckFollowingQuery, currentUserID, targetUserID).Scan(&profile.IsFollowing)
		if err != nil {
			profile.IsFollowing = false
		}
		
		// Check if there's a pending follow request
		err = app.DB.QueryRow(CheckPendingFollowQuery, currentUserID, targetUserID).Scan(&profile.HasPendingRequest)
		if err != nil {
			profile.HasPendingRequest = false
		}
	}
	
	sendJSONResponse(w, http.StatusOK, profile)
}

// HandleUpdateProfile updates user's profile information
func (app *App) HandleUpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID, err := app.GetUserFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	
	var req UpdateProfileRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	
	// Update profile
	_, err = app.DB.Exec(UpdateProfileQuery, 
		req.Nickname,
		req.AboutMe,
		req.IsPrivate,
		userID,
	)
	
	if err != nil {
		fmt.Println("Error updating profile:", err)
		http.Error(w, "Could not update profile", http.StatusInternalServerError)
		return
	}
	
	sendJSONResponse(w, http.StatusOK, map[string]string{"message": "Profile updated successfully"})
}

// HandleTogglePrivacy toggles profile privacy
func (app *App) HandleTogglePrivacy(w http.ResponseWriter, r *http.Request) {
	userID, err := app.GetUserFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	
	var req struct {
		IsPrivate bool `json:"isPrivate"`
	}
	
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	
	_, err = app.DB.Exec("UPDATE users SET is_private = ? WHERE id = ?", req.IsPrivate, userID)
	if err != nil {
		http.Error(w, "Could not update privacy setting", http.StatusInternalServerError)
		return
	}
	
	sendJSONResponse(w, http.StatusOK, map[string]bool{"isPrivate": req.IsPrivate})
}

// GetUserPosts retrieves posts for a specific user
func (app *App) GetUserPosts(userID, currentUserID int) ([]Post, error) {
	rows, err := app.DB.Query(GetUserPostsQuery, currentUserID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var posts []Post
	for rows.Next() {
		var post Post
		var profilePic sql.NullString
		var image sql.NullString
		
		err := rows.Scan(
			&post.ID,
			&post.UserID,
			&post.Content,
			&image,
			&post.CreatedAt,
			&post.Username,
			&profilePic,
			&post.Comments,
			&post.Likes,
			&post.IsLiked,
		)
		if err != nil {
			continue
		}
		
		// Set nullable fields
		if profilePic.Valid && profilePic.String != "" {
			post.ProfilePic = strings.Replace(profilePic.String, "./uploads/", "/uploads/", 1)
		}
		if image.Valid && image.String != "" {
			post.Image = strings.Replace(image.String, "./uploads/", "/uploads/", 1)
		}
		
		// Format time
		post.Time = formatTimeAgo(post.CreatedAt)
		
		posts = append(posts, post)
	}
	
	return posts, nil
}

// HandleGetFollowers retrieves followers list
func (app *App) HandleGetFollowers(w http.ResponseWriter, r *http.Request) {
	currentUserID, _ := app.GetUserFromSession(r)
	
	userIDStr := r.URL.Query().Get("userId")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}
	
	// Check if profile is private and user has permission to view
	var isPrivate bool
	err = app.DB.QueryRow("SELECT is_private FROM users WHERE id = ?", userID).Scan(&isPrivate)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	
	canView := !isPrivate || userID == currentUserID
	if !canView && currentUserID > 0 {
		var isFollowing bool
		err = app.DB.QueryRow(CheckFollowingQuery, currentUserID, userID).Scan(&isFollowing)
		canView = (err == nil && isFollowing)
	}
	
	if !canView {
		http.Error(w, "Cannot view private profile", http.StatusForbidden)
		return
	}
	
	rows, err := app.DB.Query(GetFollowersQuery, userID)
	if err != nil {
		http.Error(w, "Could not retrieve followers", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	
	var followers []FollowUser
	for rows.Next() {
		var follower FollowUser
		var profilePic sql.NullString
		
		err := rows.Scan(&follower.ID, &follower.Nickname, &follower.FirstName, &follower.LastName, &profilePic)
		if err != nil {
			continue
		}
		
		if profilePic.Valid && profilePic.String != "" {
			follower.ProfilePic = strings.Replace(profilePic.String, "./uploads/", "/uploads/", 1)
		}
		
		followers = append(followers, follower)
	}
	
	sendJSONResponse(w, http.StatusOK, followers)
}

// HandleGetFollowing retrieves following list
func (app *App) HandleGetFollowing(w http.ResponseWriter, r *http.Request) {
	currentUserID, _ := app.GetUserFromSession(r)
	
	userIDStr := r.URL.Query().Get("userId")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}
	
	// Check if profile is private and user has permission to view
	var isPrivate bool
	err = app.DB.QueryRow("SELECT is_private FROM users WHERE id = ?", userID).Scan(&isPrivate)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	
	canView := !isPrivate || userID == currentUserID
	if !canView && currentUserID > 0 {
		var isFollowing bool
		err = app.DB.QueryRow(CheckFollowingQuery, currentUserID, userID).Scan(&isFollowing)
		canView = (err == nil && isFollowing)
	}
	
	if !canView {
		http.Error(w, "Cannot view private profile", http.StatusForbidden)
		return
	}
	
	rows, err := app.DB.Query(GetFollowingQuery, userID)
	if err != nil {
		http.Error(w, "Could not retrieve following", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	
	var following []FollowUser
	for rows.Next() {
		var user FollowUser
		var profilePic sql.NullString
		
		err := rows.Scan(&user.ID, &user.Nickname, &user.FirstName, &user.LastName, &profilePic)
		if err != nil {
			continue
		}
		
		if profilePic.Valid && profilePic.String != "" {
			user.ProfilePic = strings.Replace(profilePic.String, "./uploads/", "/uploads/", 1)
		}
		
		following = append(following, user)
	}
	
	sendJSONResponse(w, http.StatusOK, following)
}