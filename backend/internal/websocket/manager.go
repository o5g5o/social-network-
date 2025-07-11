package websocket

import "sync"

type Manager struct {
	clients map[*Client]bool
	sync.RWMutex
}

func NewManager() *Manager {
	return &Manager{
		clients: make(map[*Client]bool),
	}
}

func (m *Manager) AddClient(c *Client) {
	m.Lock()
	m.clients[c] = true
	m.Unlock()
}

func (m *Manager) RemoveClient(c *Client) {
	m.Lock()
	delete(m.clients, c)
	m.Unlock()
}

func (m *Manager) Broadcast(msg []byte) {
	m.RLock()
	defer m.RUnlock()
	for c := range m.clients {
		select {
		case c.egress <- msg:
		default:
			c.conn.Close()
			delete(m.clients, c)
		}
	}
}

