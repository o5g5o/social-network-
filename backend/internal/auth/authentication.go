package auth

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"social-network/internal/models"
	"social-network/internal/utils"
	"social-network/internal/queries"
	"social-network/internal/database"
	"social-network/internal/sessions"
	"github.com/gofrs/uuid"
	"golang.org/x/crypto/bcrypt"
)



func  HandleRegister(w http.ResponseWriter, r *http.Request) {
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "Could not parse multipart form", http.StatusBadRequest)
		return
	}

	email := strings.TrimSpace(r.FormValue("email"))
	isValid := EmailValidation(email)
	if !isValid {
		fmt.Println("Invalid Email in Registration")
		http.Error(w, "Error validating email", http.StatusInternalServerError)
		return
	}
	password := strings.TrimSpace(r.FormValue("password"))
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}
	firstName := strings.TrimSpace(r.FormValue("firstName"))
	lastName := strings.TrimSpace(r.FormValue("lastName"))
	nickname := strings.TrimSpace(r.FormValue("nickname"))
	dateOfBirth := r.FormValue("dateOfBirth")

	var savedPath string
	var filename string
	// Handle image upload
	file, header, err := r.FormFile("profileImage")
	if err == nil {
		defer file.Close()
		
		// Create unique filename
		ext := filepath.Ext(header.Filename)
		filename = uuid.Must(uuid.NewV4()).String() + ext
		savedPath = "./uploads/" + filename
		
		// Create file
		savedImage, err := os.Create(savedPath)
		if err != nil {
			fmt.Println(err, "in registration - creating file")
			http.Error(w, "Could not save file", http.StatusInternalServerError)
			return
		}
		defer savedImage.Close()
		
		// Copy file content
		_, err = io.Copy(savedImage, file)
		if err != nil {
			fmt.Println(err, "in registration - copying file")
			http.Error(w, "Could not save file", http.StatusInternalServerError)
			return
		}
		filename = "/uploads/" + filename
	} else {
		// No image uploaded, that's okay
		fmt.Println("No profile image uploaded during registration")
	}

	_, err2 := database.DB.Exec(queries.InsertUserQuery, email, hashedPassword, nickname, firstName, lastName, dateOfBirth, filename)
	if err2 != nil {
		fmt.Println("DB insert error:", err2, "in registration")
		http.Error(w, err2.Error(), http.StatusInternalServerError)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, map[string]string{"message": "Registration successful"})
}
	
func HandleLogin(w http.ResponseWriter, r *http.Request) {
	var loggedInUser models.LoginUser
	err := json.NewDecoder(r.Body).Decode(&loggedInUser)
	if err != nil {
		fmt.Println("error in authentication login : ", err)
		return
	}
	id, name, err := Authentication(loggedInUser.Username, loggedInUser.Password)
	if err != nil {
		fmt.Println(err, "in handle login")
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Get user's profile picture
	var profilePic sql.NullString
	err = database.DB.QueryRow("SELECT image FROM users WHERE id = ?", id).Scan(&profilePic)
	if err != nil {
		fmt.Println("Error getting profile pic:", err)
	}

	// Convert profile pic path if it exists
	var profilePicURL string
	if profilePic.Valid && profilePic.String != "" {
		profilePicURL = strings.Replace(profilePic.String, "./uploads/", "/uploads/", 1)
	}

	// Create session
	sessionID, err := sessions.CreateSession(id)
	if err != nil {
		fmt.Println("Error creating session:", err)
		http.Error(w, "Could not create session", http.StatusInternalServerError)
		return
	}

	sessions.SetCookie(w, sessionID)

	utils.SendJSONResponse(w, http.StatusOK, map[string]interface{}{
		"name":       name,
		"id":         id,
		"profilePic": profilePicURL,
	})
}

func EmailValidation(email string) bool {
	var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(email)
}

func Authentication(email, password string) (int, string, error) {
	var id int
	var name string
	var passwordHash []byte

	row := database.DB.QueryRow(queries.AuthenticateUserQuery, email, email)
	err := row.Scan(&id, &passwordHash, &name)
	if err != nil {
		return 0, "", err
	}
	err = bcrypt.CompareHashAndPassword(passwordHash, []byte(password))
	if err != nil {
		return 0, "", err
	}
	return id, name, nil
}
