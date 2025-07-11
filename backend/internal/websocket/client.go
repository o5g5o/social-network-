package websocket

import (
	"fmt"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

type Client struct {
	conn     *websocket.Conn
	manager  *Manager
	egress   chan []byte
	userID   int
	username string
	activeChats map[int]bool
}

func NewClient(conn *websocket.Conn, manager *Manager, userID int, username string) *Client {
	return &Client{
		conn:     conn,
		manager:  manager,
		egress:   make(chan []byte, 256),
		userID:   userID,
		username: username,
		activeChats: make(map[int]bool),
	}
}

func (c *Client) ReadMessages() {
	fmt.Println("Reading messages", c.userID, c.username)
	defer func() {
		c.manager.RemoveClient(c)
		c.conn.Close()
	}()

	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			log.Printf("Read error: %v", err)
			break
		}

		log.Printf("Received: %s", message)
	}
}

func (c *Client) WriteMessages() {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case msg, ok := <-c.egress:
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			c.conn.WriteMessage(websocket.TextMessage, msg)

		case <-ticker.C:
			c.conn.WriteMessage(websocket.PingMessage, nil)
		}
	}
}
