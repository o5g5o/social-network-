package groups

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"social-network/internal/database"
	"social-network/internal/models"
	"social-network/internal/queries"
	"social-network/internal/utils"

	"github.com/gofrs/uuid"
)

func CreateGroup(w http.ResponseWriter, r *http.Request) {
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "Could not parse multipart form", http.StatusBadRequest)
		return
	}
	title := r.FormValue("title")
	description := r.FormValue("description")
	creator_id := r.FormValue("creator_id")

	var filename string

	file, header, err := r.FormFile("image")

	if err == nil {

		defer file.Close()
		// Create unique filename
		ext := filepath.Ext(header.Filename)
		filename = uuid.Must(uuid.NewV4()).String() + ext
		savedPath := "./uploads/" + filename

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

	result, err := database.DB.Exec(queries.InsertGroupQuery, title, description, creator_id, filename)
	if err != nil {
		http.Error(w, "Failed to insert group", http.StatusBadRequest)
		fmt.Println("Error executing InsertGroupQuery in CreateGroup:", err)
		return
	}

	groupID, err := result.LastInsertId()
	if err != nil {
		http.Error(w, "Failed to retrieve group ID", http.StatusInternalServerError)
		fmt.Println("Error getting last insert ID in CreateGroup:", err)
		return
	}

	_, err = database.DB.Exec(queries.InsertGroupMemberQuery, creator_id, groupID)
	if err != nil {
		http.Error(w, "Failed to insert group admin", http.StatusInternalServerError)
		fmt.Println("Error inserting creator into group_members in CreateGroup:", err)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, map[string]interface{}{
		"message":  "Group Created",
		"group_id": groupID,
	})
}

func GetUserGroups(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		http.Error(w, "Missing user_id", http.StatusBadRequest)
		fmt.Println("Missing user_id in GetUserGroups")
		return
	}

	rows, err := database.DB.Query(queries.GetGroupMembersQuery, userID)
	if err != nil {
		http.Error(w, "Error fetching groups", http.StatusInternalServerError)
		fmt.Println("Error executing GetGroupMembersQuery in GetUserGroups:", err)
		return
	}
	defer rows.Close()

	var groups []models.GroupDetails
	for rows.Next() {
		var g models.GroupDetails
		if err := rows.Scan(&g.ID, &g.Title, &g.Description, &g.Image); err != nil {
			http.Error(w, "Error scanning group", http.StatusInternalServerError)
			fmt.Println("Error scanning row in GetUserGroups:", err)
			return
		}
		groups = append(groups, g)
	}

	utils.SendJSONResponse(w, http.StatusOK, groups)
}

func SearchUsers(w http.ResponseWriter, r *http.Request) {
	searchquery := r.URL.Query().Get("q")
	userquery := r.URL.Query().Get("user_id")
	groupquery := r.URL.Query().Get("group_id")

	if searchquery == "" {
		http.Error(w, "Missing search query", http.StatusBadRequest)
		fmt.Println("Missing search query in SearchUsers")
		return
	}
	if userquery == "" {
		http.Error(w, "Missing user_id query param", http.StatusBadRequest)
		fmt.Println("Missing user_id in SearchUsers")
		return
	}
	if groupquery == "" {
		http.Error(w, "Missing group_id query param", http.StatusBadRequest)
		fmt.Println("Missing group_id in SearchUsers")
		return
	}

	searchPattern := "%" + searchquery + "%"

	rows, err := database.DB.Query(
		queries.SearchUsersQuery,
		userquery, searchPattern, searchPattern, searchPattern, searchPattern,
		groupquery, groupquery,
	)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		fmt.Println("Error executing SearchUsersQuery in SearchUsers:", err)
		return
	}
	defer rows.Close()

	var users []models.RegisterUser
	for rows.Next() {
		var u models.RegisterUser
		if err := rows.Scan(&u.ID, &u.Email, &u.Nickname, &u.Image); err != nil {
			fmt.Println("Error scanning user row in SearchUsers:", err)
			continue
		}
		users = append(users, u)
	}

	utils.SendJSONResponse(w, http.StatusOK, users)
}
