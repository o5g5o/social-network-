package main

import (
	"log"
	"net/http"
	"os"
	"social-network/internal/routes"
	"social-network/internal/sessions"
	"social-network/internal/database"
	"social-network/internal/websocket"
	"time"
)

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == "http://localhost:5173" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		}

		// Handle preflight requests
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	// Ensure uploads directory exists
	if err := os.MkdirAll("./uploads", os.ModePerm); err != nil {
		log.Fatal("Failed to create uploads directory:", err)
	}

	database.ConnectAndMigrate("internal/database/social.db", "file://internal/database/migrations/sqlite")

	// Start periodic cleanup of expired sessions
	go func() {
		ticker := time.NewTicker(1 * time.Hour)
		for range ticker.C {
			sessions.CleanupExpiredSessions()
		}
	}()

	mux := http.NewServeMux()
	manager := websocket.NewManager()
	routes.RegisterRoutes(mux,manager)

	log.Println("Server running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", enableCORS(mux)))
}
