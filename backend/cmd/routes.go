package cmd

import (
	"net/http"
)

func (app *App) RegisterRoutes(mux *http.ServeMux) {
	// Authentication routes
	mux.HandleFunc("/register", app.HandleRegister)
	mux.HandleFunc("/login", app.HandleLogin)
	mux.HandleFunc("/logout", app.HandleLogout)
	mux.HandleFunc("/authorization", app.Authorization)
	
	// Post routes
	mux.HandleFunc("/posts", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			app.HandleGetPosts(w, r)
		case http.MethodPost:
			app.HandleCreatePost(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	
	// Like/Unlike routes
	mux.HandleFunc("/posts/like", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			app.HandleLikePost(w, r)
		case http.MethodDelete:
			app.HandleLikePost(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	
	// Comment routes
	mux.HandleFunc("/comments", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			app.HandleGetComments(w, r)
		case http.MethodPost:
			app.HandleCreateComment(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	
	// Static file server for uploaded images
	fileServer := http.FileServer(http.Dir("./uploads"))
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", fileServer))
	
	// Profile routes
	mux.HandleFunc("/profile", app.HandleGetProfile)
	mux.HandleFunc("/profile/update", app.HandleUpdateProfile)
	mux.HandleFunc("/profile/privacy", app.HandleTogglePrivacy)
	mux.HandleFunc("/profile/followers", app.HandleGetFollowers)
	mux.HandleFunc("/profile/following", app.HandleGetFollowing)
	
	// Follow routes
	mux.HandleFunc("/follow/request", app.HandleFollowRequest)
	mux.HandleFunc("/follow/unfollow", app.HandleUnfollow)
	mux.HandleFunc("/follow/cancel", app.HandleCancelFollowRequest)
	mux.HandleFunc("/follow/accept", app.HandleAcceptFollow)
	mux.HandleFunc("/follow/decline", app.HandleDeclineFollow)
	mux.HandleFunc("/follow/requests", app.HandleGetFollowRequests)
	
	// Users routes
	mux.HandleFunc("/users", app.HandleGetUsers)
}