package routes

import (
	"net/http"
	"social-network/internal/auth"
	"social-network/internal/groups"
	"social-network/internal/posts"
	"social-network/internal/sessions"
	"social-network/internal/users"
	"social-network/internal/websocket"
)



func RegisterRoutes(mux *http.ServeMux, manager *websocket.Manager) {

	mux.HandleFunc("/ws", websocket.WebSocketHandler(manager))
	// Authentication routes
	mux.HandleFunc("/register", auth.HandleRegister)
	mux.HandleFunc("/login", auth.HandleLogin)
	mux.HandleFunc("/logout", sessions.HandleLogout)
	mux.HandleFunc("/authorization", sessions.Authorization)

	// Post routes
	mux.HandleFunc("/posts", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			posts.HandleGetPosts(w, r)
		case http.MethodPost:
			posts.HandleCreatePost(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Like/Unlike routes
	mux.HandleFunc("/posts/like", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			posts.HandleLikePost(w, r)
		case http.MethodDelete:
			posts.HandleLikePost(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Comment routes
	mux.HandleFunc("/comments", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			posts.HandleGetComments(w, r)
		case http.MethodPost:
			posts.HandleCreateComment(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Static file server for uploaded images
	fileServer := http.FileServer(http.Dir("./uploads"))
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", fileServer))

	// Profile routes
	mux.HandleFunc("/profile", users.HandleGetProfile)
	mux.HandleFunc("/profile/update", users.HandleUpdateProfile)
	mux.HandleFunc("/profile/privacy", users.HandleTogglePrivacy)
	mux.HandleFunc("/profile/followers", users.HandleGetFollowers)
	mux.HandleFunc("/profile/following", users.HandleGetFollowing)

	// Follow routes
	mux.HandleFunc("/follow/request", users.HandleFollowRequest)
	mux.HandleFunc("/follow/unfollow", users.HandleUnfollow)
	mux.HandleFunc("/follow/cancel", users.HandleCancelFollowRequest)
	mux.HandleFunc("/follow/accept", users.HandleAcceptFollow)
	mux.HandleFunc("/follow/decline", users.HandleDeclineFollow)
	mux.HandleFunc("/follow/requests", users.HandleGetFollowRequests)

// Group Routes
	mux.HandleFunc("/groups/creategroups", groups.CreateGroup)
	mux.HandleFunc("/groups/user-groups", groups.GetUserGroups)
	mux.HandleFunc("/groups/search-users", groups.SearchUsers)
	mux.HandleFunc("/groups/invite-to-group", groups.GroupInvitation)
	mux.HandleFunc("/groups/user-invitations", groups.GetUserInvitations)
	mux.HandleFunc("/groups/respond-invitation", groups.InvitationResponse)
	mux.HandleFunc("/groups/public", groups.GetPublicGroupsHandler)
	mux.HandleFunc("/groups/request-join", groups.InsertGroupRequests)
	mux.HandleFunc("/groups/get-join-requests", groups.GetJoinRequestsToCreator)
	mux.HandleFunc("/groups/respond-requests", groups.RequestResponse)
	mux.HandleFunc("/groups/groups-event", groups.CreateGroupEvent)
	mux.HandleFunc("/groups/events", groups.GetGroupEvents)
	mux.HandleFunc("/groups/going_events", groups.GetGoingEvents)
	mux.HandleFunc("/groups/event-response", groups.EventResponse)

	// Users routes
	mux.HandleFunc("/users", users.HandleGetUsers)

	// New route for getting current user's followers (for post creation)
	mux.HandleFunc("/my-followers", users.HandleGetMyFollowers)
}
