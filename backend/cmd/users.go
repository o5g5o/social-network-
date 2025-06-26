package cmd

import (
	"database/sql"
	"net/http"
	"strings"
)

// HandleGetUsers retrieves all users except the current user
func (app *App) HandleGetUsers(w http.ResponseWriter, r *http.Request) {
	currentUserID, _ := app.GetUserFromSession(r)
	
	// Get search query if provided
	searchQuery := r.URL.Query().Get("search")
	
	var query string
	var args []interface{}
	
	if searchQuery != "" {
		query = `
			SELECT u.id, u.nickname, u.first_name, u.last_name, u.image, u.is_private,
			       EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id AND status = 'accepted') as is_following
			FROM users u
			WHERE u.id != ? 
			AND (u.nickname LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)
			ORDER BY u.created_at DESC
			LIMIT 20`
		searchPattern := "%" + searchQuery + "%"
		args = []interface{}{currentUserID, currentUserID, searchPattern, searchPattern, searchPattern, searchPattern}
	} else {
		query = `
			SELECT u.id, u.nickname, u.first_name, u.last_name, u.image, u.is_private,
			       EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id AND status = 'accepted') as is_following
			FROM users u
			WHERE u.id != ?
			ORDER BY u.created_at DESC
			LIMIT 20`
		args = []interface{}{currentUserID, currentUserID}
	}
	
	rows, err := app.DB.Query(query, args...)
	if err != nil {
		http.Error(w, "Could not retrieve users", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	
	var users []UserListItem
	for rows.Next() {
		var user UserListItem
		var profilePic sql.NullString
		
		err := rows.Scan(&user.ID, &user.Nickname, &user.FirstName, &user.LastName, &profilePic, &user.IsPrivate, &user.IsFollowing)
		if err != nil {
			continue
		}
		
		if profilePic.Valid && profilePic.String != "" {
			user.ProfilePic = strings.Replace(profilePic.String, "./uploads/", "/uploads/", 1)
		}
		
		users = append(users, user)
	}
	
	sendJSONResponse(w, http.StatusOK, users)
}