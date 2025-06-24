package cmd

import (
	"database/sql"
	"fmt"
	"net/http"
	"strings"
	"time"
	
	"github.com/gofrs/uuid"
)

const (
	SessionCookieName = "SN-session"
	SessionDuration   = 24 * time.Hour
)

func (app *App) Authorization(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie(SessionCookieName)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	
	// Check session in database
	var userID int
	var expiresAt time.Time
	
	err = app.DB.QueryRow(GetSessionQuery, cookie.Value).Scan(&userID, &expiresAt)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Invalid session", http.StatusUnauthorized)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	
	// Check if session is expired
	if time.Now().After(expiresAt) {
		app.DB.Exec(DeleteSessionQuery, cookie.Value)
		ClearCookie(w)
		http.Error(w, "Session expired", http.StatusUnauthorized)
		return
	}
	
	// Get user info including profile picture
	var nickname, firstName, lastName string
	var profilePic sql.NullString
	err = app.DB.QueryRow("SELECT nickname, first_name, last_name, image FROM users WHERE id = ?", userID).Scan(&nickname, &firstName, &lastName, &profilePic)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	
	name := nickname
	if name == "" {
		name = firstName + " " + lastName
	}
	
	// Convert profile pic path if it exists
	var profilePicURL string
	if profilePic.Valid && profilePic.String != "" {
		profilePicURL = strings.Replace(profilePic.String, "./uploads/", "/uploads/", 1)
	}
	
	sendJSONResponse(w, http.StatusOK, map[string]interface{}{
		"name": name,
		"id":   userID,
		"profilePic": profilePicURL,
	})
}

func (app *App) CreateSession(userID int) (string, error) {
	sessionID := uuid.Must(uuid.NewV4()).String()
	expiresAt := time.Now().Add(SessionDuration)
	
	_, err := app.DB.Exec(InsertSessionQuery, sessionID, userID, expiresAt)
	if err != nil {
		return "", err
	}
	
	return sessionID, nil
}

func (app *App) GetUserFromSession(r *http.Request) (int, error) {
	cookie, err := r.Cookie(SessionCookieName)
	if err != nil {
		return 0, fmt.Errorf("no session cookie")
	}
	
	var userID int
	var expiresAt time.Time
	
	err = app.DB.QueryRow(GetSessionQuery, cookie.Value).Scan(&userID, &expiresAt)
	if err != nil {
		return 0, fmt.Errorf("invalid session")
	}
	
	if time.Now().After(expiresAt) {
		return 0, fmt.Errorf("session expired")
	}
	
	return userID, nil
}

func (app *App) HandleLogout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie(SessionCookieName)
	if err == nil {
		app.DB.Exec(DeleteSessionQuery, cookie.Value)
	}
	
	ClearCookie(w)
	sendJSONResponse(w, http.StatusOK, map[string]string{"message": "Logged out successfully"})
}

func SetCookie(w http.ResponseWriter, sessionID string) {
	http.SetCookie(w, &http.Cookie{
		Name:     SessionCookieName,
		Value:    sessionID,
		Path:     "/",
		Expires:  time.Now().Add(SessionDuration),
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
	})
}

func ClearCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     SessionCookieName,
		Value:    "",
		Path:     "/",
		Expires:  time.Now().Add(-1 * time.Hour),
		HttpOnly: true,
		Secure:   true,
		MaxAge:   -1,
		SameSite: http.SameSiteNoneMode,
	})
}

// Cleanup expired sessions (should be called periodically)
func (app *App) CleanupExpiredSessions() {
	app.DB.Exec(CleanupExpiredSessionsQuery)
}