package websocket

import (
	"log"
	"net/http"
	"social-network/internal/sessions"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool { // must change later
		return true
	},
}

func WebSocketHandler(manager *Manager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("WebSocket upgrade failed: %v", err)
			return
		}

		userID, username, err := sessions.GetUserFromSession(r)
		if err != nil {
			log.Printf("Error getting user: %v", err)
			conn.Close()
			return
		}
		client := NewClient(conn, manager, userID, username)
		log.Printf("User %d (%s) connected via WebSocket", userID, username)
		
		manager.AddClient(client)
		log.Printf("Total clients: %d", len(manager.clients))
		
		go client.ReadMessages()
		go client.WriteMessages()
	}
}
