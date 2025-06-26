package cmd

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gofrs/uuid"
)

// HandleCreatePost creates a new post
func (app *App) HandleCreatePost(w http.ResponseWriter, r *http.Request) {
	// Get user from session
	userID, err := app.GetUserFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse multipart form for potential image upload
	err = r.ParseMultipartForm(10 << 20) // 10MB max
	if err != nil {
		http.Error(w, "Could not parse form", http.StatusBadRequest)
		return
	}

	content := strings.TrimSpace(r.FormValue("content"))
	if content == "" {
		http.Error(w, "Content is required", http.StatusBadRequest)
		return
	}

	var imagePath string
	
	// Handle image upload if present
	file, header, err := r.FormFile("image")
	if err == nil {
		defer file.Close()
		
		// Create unique filename
		ext := filepath.Ext(header.Filename)
		filename := uuid.Must(uuid.NewV4()).String() + ext
		imagePath = "./uploads/" + filename
		
		// Save file
		dst, err := os.Create(imagePath)
		if err != nil {
			fmt.Println("Error creating file:", err)
			http.Error(w, "Could not save image", http.StatusInternalServerError)
			return
		}
		defer dst.Close()
		
		_, err = io.Copy(dst, file)
		if err != nil {
			fmt.Println("Error saving file:", err)
			http.Error(w, "Could not save image", http.StatusInternalServerError)
			return
		}
	}

	// Insert post into database
	result, err := app.DB.Exec(InsertPostQuery, userID, content, imagePath)
	if err != nil {
		fmt.Println("Error inserting post:", err)
		http.Error(w, "Could not create post", http.StatusInternalServerError)
		return
	}

	postID, err := result.LastInsertId()
	if err != nil {
		http.Error(w, "Could not get post ID", http.StatusInternalServerError)
		return
	}

	// Get the created post with all details
	post, err := app.GetPostByID(int(postID), userID)
	if err != nil {
		http.Error(w, "Could not retrieve post", http.StatusInternalServerError)
		return
	}

	sendJSONResponse(w, http.StatusCreated, post)
}

// HandleGetPosts retrieves posts with pagination
func (app *App) HandleGetPosts(w http.ResponseWriter, r *http.Request) {
	// Get user from session (optional for public posts)
	userID, _ := app.GetUserFromSession(r)
	
	// Get pagination parameters
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 || limit > 50 {
		limit = 20
	}
	
	offset := (page - 1) * limit

	// Get posts from database
	rows, err := app.DB.Query(GetPostsQuery, userID, limit, offset)
	if err != nil {
		fmt.Println("Error getting posts:", err)
		http.Error(w, "Could not retrieve posts", http.StatusInternalServerError)
		return
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
			fmt.Println("Error scanning post:", err)
			continue
		}
		
		// Set nullable fields and convert to full URLs
		if profilePic.Valid && profilePic.String != "" {
			// Convert ./uploads/filename to /uploads/filename for URL access
			post.ProfilePic = strings.Replace(profilePic.String, "./uploads/", "/uploads/", 1)
		}
		if image.Valid && image.String != "" {
			// Convert ./uploads/filename to /uploads/filename for URL access
			post.Image = strings.Replace(image.String, "./uploads/", "/uploads/", 1)
		}
		
		// Format time
		post.Time = formatTimeAgo(post.CreatedAt)
		
		posts = append(posts, post)
	}

	sendJSONResponse(w, http.StatusOK, map[string]interface{}{
		"posts": posts,
		"page":  page,
		"limit": limit,
	})
}

// HandleLikePost handles liking/unliking a post
func (app *App) HandleLikePost(w http.ResponseWriter, r *http.Request) {
	userID, err := app.GetUserFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get post ID from URL
	postIDStr := r.URL.Query().Get("id")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}

	if r.Method == http.MethodPost {
		// Like the post
		_, err = app.DB.Exec(InsertLikeQuery, postID, userID)
		if err != nil {
			// Check if it's a duplicate (already liked)
			if strings.Contains(err.Error(), "UNIQUE") {
				http.Error(w, "Already liked", http.StatusConflict)
				return
			}
			http.Error(w, "Could not like post", http.StatusInternalServerError)
			return
		}
	} else if r.Method == http.MethodDelete {
		// Unlike the post
		_, err = app.DB.Exec(DeleteLikeQuery, postID, userID)
		if err != nil {
			http.Error(w, "Could not unlike post", http.StatusInternalServerError)
			return
		}
	}

	sendJSONResponse(w, http.StatusOK, map[string]string{"message": "Success"})
}

// HandleCreateComment adds a comment to a post
func (app *App) HandleCreateComment(w http.ResponseWriter, r *http.Request) {
	userID, err := app.GetUserFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		PostID  int    `json:"postId"`
		Content string `json:"content"`
	}

	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	req.Content = strings.TrimSpace(req.Content)
	if req.Content == "" {
		http.Error(w, "Content is required", http.StatusBadRequest)
		return
	}

	// Insert comment
	result, err := app.DB.Exec(InsertCommentQuery, req.PostID, userID, req.Content)
	if err != nil {
		http.Error(w, "Could not create comment", http.StatusInternalServerError)
		return
	}

	commentID, _ := result.LastInsertId()

	sendJSONResponse(w, http.StatusCreated, map[string]interface{}{
		"id":      commentID,
		"message": "Comment created successfully",
	})
}

// HandleGetComments retrieves comments for a post
func (app *App) HandleGetComments(w http.ResponseWriter, r *http.Request) {
	postIDStr := r.URL.Query().Get("postId")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}

	rows, err := app.DB.Query(GetCommentsByPostQuery, postID)
	if err != nil {
		http.Error(w, "Could not retrieve comments", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var comments []Comment
	for rows.Next() {
		var comment Comment
		err := rows.Scan(
			&comment.ID,
			&comment.PostID,
			&comment.UserID,
			&comment.Content,
			&comment.CreatedAt,
			&comment.Username,
		)
		if err != nil {
			continue
		}
		comments = append(comments, comment)
	}

	sendJSONResponse(w, http.StatusOK, comments)
}

// Helper function to get post by ID
func (app *App) GetPostByID(postID, userID int) (*Post, error) {
	var post Post
	var profilePic sql.NullString
	var image sql.NullString

	err := app.DB.QueryRow(GetPostByIDQuery, userID, postID).Scan(
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
		return nil, err
	}

	// Set nullable fields and convert to full URLs
	if profilePic.Valid && profilePic.String != "" {
		// Convert ./uploads/filename to /uploads/filename for URL access
		post.ProfilePic = strings.Replace(profilePic.String, "./uploads/", "/uploads/", 1)
	}
	if image.Valid && image.String != "" {
		// Convert ./uploads/filename to /uploads/filename for URL access
		post.Image = strings.Replace(image.String, "./uploads/", "/uploads/", 1)
	}
	
	post.Time = formatTimeAgo(post.CreatedAt)
	
	return &post, nil
}

// Helper function to format time ago
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