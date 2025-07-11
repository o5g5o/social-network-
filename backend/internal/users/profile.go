package users

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"social-network/internal/database"
	"social-network/internal/models"
	"social-network/internal/queries"
	"social-network/internal/sessions"
	"social-network/internal/utils"
	"strconv"
	"strings"
	"time"
)

// HandleGetProfile retrieves a user's profile
func HandleGetProfile(w http.ResponseWriter, r *http.Request) {
	// Get current user from session (for privacy check)
	currentUserID, _, _ := sessions.GetUserFromSession(r)

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
	var profile models.UserProfile
	var profilePic sql.NullString
	var aboutMe sql.NullString
	var isPrivate bool

	err = database.DB.QueryRow(queries.GetUserProfileQuery, targetUserID).Scan(
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

	// Get follower/following counts - always get these regardless of privacy
	err = database.DB.QueryRow(queries.GetFollowerCountQuery, targetUserID).Scan(&profile.FollowersCount)
	if err != nil {
		profile.FollowersCount = 0
	}

	err = database.DB.QueryRow(queries.GetFollowingCountQuery, targetUserID).Scan(&profile.FollowingCount)
	if err != nil {
		profile.FollowingCount = 0
	}

	// Check if current user can view full profile
	canView := !isPrivate || profile.IsOwnProfile

	if !canView && currentUserID > 0 {
		// Check if current user is following target user
		var isFollowing bool
		err = database.DB.QueryRow(queries.CheckFollowingQuery, currentUserID, targetUserID).Scan(&isFollowing)
		if err == nil && isFollowing {
			canView = true
		}
	}

	if !canView {
		// Return limited info for private profiles but include counts
		utils.SendJSONResponse(w, http.StatusOK, map[string]interface{}{
			"id":                 profile.ID,
			"firstName":          profile.FirstName,
			"lastName":           profile.LastName,
			"nickname":           profile.Nickname,
			"profilePic":         profile.ProfilePic,
			"isPrivate":          true,
			"canViewFullProfile": false,
			"isFollowing":        false,
			"followersCount":     profile.FollowersCount,
			"followingCount":     profile.FollowingCount,
			"posts":              []models.Post{},
		})
		return
	}

	// Get user's posts with proper privacy filtering
	posts, err := GetUserPosts(targetUserID, currentUserID)
	if err != nil {
		fmt.Println("Error getting user posts:", err)
		posts = []models.Post{}
	}
	profile.Posts = posts

	// Check if current user is following target user
	if currentUserID > 0 && currentUserID != targetUserID {
		err = database.DB.QueryRow(queries.CheckFollowingQuery, currentUserID, targetUserID).Scan(&profile.IsFollowing)
		if err != nil {
			profile.IsFollowing = false
		}

		// Check if there's a pending follow request
		err = database.DB.QueryRow(queries.CheckPendingFollowQuery, currentUserID, targetUserID).Scan(&profile.HasPendingRequest)
		if err != nil {
			profile.HasPendingRequest = false
		}
	}

	utils.SendJSONResponse(w, http.StatusOK, profile)
}

// HandleUpdateProfile updates user's profile information
func HandleUpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID, _, err := sessions.GetUserFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req models.UpdateProfileRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Update profile
	_, err = database.DB.Exec(queries.UpdateProfileQuery,
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

	utils.SendJSONResponse(w, http.StatusOK, map[string]string{"message": "Profile updated successfully"})
}

// HandleTogglePrivacy toggles profile privacy
func HandleTogglePrivacy(w http.ResponseWriter, r *http.Request) {
	userID, _, err := sessions.GetUserFromSession(r)
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

	// Start transaction
	tx, err := database.DB.Begin()
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Update privacy setting
	_, err = tx.Exec("UPDATE users SET is_private = ? WHERE id = ?", req.IsPrivate, userID)
	if err != nil {
		http.Error(w, "Could not update privacy setting", http.StatusInternalServerError)
		return
	}

	// If switching from private to public, accept all pending follow requests
	if !req.IsPrivate {
		_, err = tx.Exec(
			"UPDATE follows SET status = 'accepted' WHERE following_id = ? AND status = 'pending'",
			userID,
		)
		if err != nil {
			http.Error(w, "Could not update follow requests", http.StatusInternalServerError)
			return
		}
	}

	// Commit transaction
	err = tx.Commit()
	if err != nil {
		http.Error(w, "Could not save changes", http.StatusInternalServerError)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, map[string]bool{"isPrivate": req.IsPrivate})
}

// GetUserPosts retrieves posts for a specific user with proper privacy filtering
func GetUserPosts(userID, currentUserID int) ([]models.Post, error) {
	// Updated query to include privacy filtering for individual posts
	query := queries.GetUserPostsQuery

	rows, err := database.DB.Query(query, currentUserID, userID, currentUserID, currentUserID, currentUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []models.Post
	for rows.Next() {
		var post models.Post
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
			&post.Privacy,
		)
		if err != nil {
			continue
		}

		if profilePic.Valid && profilePic.String != "" {
			post.ProfilePic = strings.Replace(profilePic.String, "./uploads/", "/uploads/", 1)
		}
		if image.Valid && image.String != "" {
			post.Image = strings.Replace(image.String, "./uploads/", "/uploads/", 1)
		}

		post.Time = formatTimeAgo(post.CreatedAt)

		posts = append(posts, post)
	}

	return posts, nil
}

// HandleGetFollowers retrieves followers list
func HandleGetFollowers(w http.ResponseWriter, r *http.Request) {
	currentUserID, _, _ := sessions.GetUserFromSession(r)

	userIDStr := r.URL.Query().Get("userId")
	var userID int
	var err error

	if userIDStr == "me" {
		if currentUserID == 0 {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		userID = currentUserID
	} else {
		userID, err = strconv.Atoi(userIDStr)
		if err != nil {
			http.Error(w, "Invalid user ID", http.StatusBadRequest)
			return
		}
	}

	// Check if profile is private and user has permission to view
	var isPrivate bool
	err = database.DB.QueryRow(queries.IsPrivateUserQuery, userID).Scan(&isPrivate)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	canView := !isPrivate || userID == currentUserID
	if !canView && currentUserID > 0 {
		var isFollowing bool
		err = database.DB.QueryRow(queries.CheckFollowingQuery, currentUserID, userID).Scan(&isFollowing)
		canView = (err == nil && isFollowing)
	}

	if !canView {
		http.Error(w, "Cannot view private profile", http.StatusForbidden)
		return
	}

	rows, err := database.DB.Query(queries.GetFollowersQuery, userID)
	if err != nil {
		http.Error(w, "Could not retrieve followers", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var followers []models.FollowUser
	for rows.Next() {
		var follower models.FollowUser
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

	utils.SendJSONResponse(w, http.StatusOK, followers)
}

// HandleGetFollowing retrieves following list
func HandleGetFollowing(w http.ResponseWriter, r *http.Request) {
	currentUserID, _, _ := sessions.GetUserFromSession(r)

	userIDStr := r.URL.Query().Get("userId")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	// Check if profile is private and user has permission to view
	var isPrivate bool
	err = database.DB.QueryRow("SELECT is_private FROM users WHERE id = ?", userID).Scan(&isPrivate)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	canView := !isPrivate || userID == currentUserID
	if !canView && currentUserID > 0 {
		var isFollowing bool
		err = database.DB.QueryRow(queries.CheckFollowingQuery, currentUserID, userID).Scan(&isFollowing)
		canView = (err == nil && isFollowing)
	}

	if !canView {
		http.Error(w, "Cannot view private profile", http.StatusForbidden)
		return
	}

	rows, err := database.DB.Query(queries.GetFollowingQuery, userID)
	if err != nil {
		http.Error(w, "Could not retrieve following", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var following []models.FollowUser
	for rows.Next() {
		var user models.FollowUser
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

	utils.SendJSONResponse(w, http.StatusOK, following)
}

// HandleGetMyFollowers retrieves current user's followers for post creation
func HandleGetMyFollowers(w http.ResponseWriter, r *http.Request) {
	userID, _, err := sessions.GetUserFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	rows, err := database.DB.Query(queries.GetFollowersQuery, userID)
	if err != nil {
		http.Error(w, "Could not retrieve followers", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var followers []models.FollowUser
	for rows.Next() {
		var follower models.FollowUser
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

	utils.SendJSONResponse(w, http.StatusOK, followers)
}

func formatTimeAgo(t time.Time) string {
	duration := time.Since(t)

	if duration.Seconds() < 60 {
		return "just now"
	} else if duration.Minutes() < 60 {
		return fmt.Sprintf("%.0fm ago", duration.Minutes())
	} else if duration.Hours() < 24 {
		return fmt.Sprintf("%.0fh ago", duration.Hours())
	} else if duration.Hours() < 168 { // 7 days
		days := int(duration.Hours() / 24)
		if days == 1 {
			return "1d ago"
		}
		return fmt.Sprintf("%dd ago", days)
	} else {
		return t.Format("Jan 2, 2006")
	}
}
