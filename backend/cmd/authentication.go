package cmd

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"regexp"
	"strings"

	"github.com/gofrs/uuid"
	"golang.org/x/crypto/bcrypt"
)

func sendJSONResponse(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

func (app *App) HandleRegister(w http.ResponseWriter, r *http.Request) {
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
	if err != nil {
		fmt.Println(err, "in registration")
		http.Error(w, "error in date of birth", http.StatusBadRequest)
	}

	file, header, err := r.FormFile("profileImage")
	if err != nil {
		fmt.Println(err, "in registration")
		http.Error(w, "Error retrieving the file", http.StatusBadRequest)
		return
	}
	defer file.Close()
	savedPath := "./uploads/" + header.Filename
	savedImage, err := os.Create(savedPath)
	if err != nil {
		fmt.Println(err, "in registration")
		http.Error(w, "Could not save file", http.StatusInternalServerError)
		return
	}
	defer savedImage.Close()

	_, err2 := app.DB.Exec(InsertUserQuery, email, hashedPassword, nickname, firstName, lastName, dateOfBirth, savedPath)
	if err2 != nil {
		fmt.Println("DB insert error:", err2, "in registration")
		http.Error(w, err2.Error(), http.StatusInternalServerError)
		return
	}

	sendJSONResponse(w, http.StatusOK, map[string]string{"message": "Login successful"})
}

func (app *App) HandleLogin(w http.ResponseWriter, r *http.Request) {
	var loggedInUser LoginUser
	err := json.NewDecoder(r.Body).Decode(&loggedInUser)
	if err != nil {
		fmt.Println("error in authentication login : ", err)
		return
	}
	id, name, err := app.Authentication(loggedInUser.Username, loggedInUser.Password)
	if err != nil {
		fmt.Println(err, "in handle login")
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	sessionID := uuid.Must(uuid.NewV4()).String()
	SetCookie(w, sessionID)
	sendJSONResponse(w, http.StatusOK, UserInfo{
	Name: name,
	ID:   id,
})
}


func EmailValidation(email string) bool {
	var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(email)
}

func (app *App) Authentication(email, password string) (int, string, error) {
	var id int
	var name string
	var passwordHash []byte

	row := app.DB.QueryRow(AuthenticateUserQuery, email, email)
	err := row.Scan(&id,&passwordHash, &name)
	if err != nil {
		return 0, "", err
	}
	err = bcrypt.CompareHashAndPassword(passwordHash, []byte(password))
	if err != nil {
		return 0, "", err
	}
	return id, name, nil
}
