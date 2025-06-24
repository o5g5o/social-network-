package cmd

import (
	"database/sql"
	"time"
)

type App struct {
	DB *sql.DB
}

type LoginUser struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type RegisterUser struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	FirstName   string `json:"firstName"`
	LastName    string `json:"lastName"`
	DateOfBirth string `json:"dateOfBirth"`
	Image       string `json:"image"`
	Nickname    string `json:"nickname"`
}

type UserInfo struct {
	Name string `json:"name"`
	ID   int    `json:"id"`
}

type Post struct {
	ID          int       `json:"id"`
	UserID      int       `json:"userId"`
	Username    string    `json:"username"`
	ProfilePic  string    `json:"profilePic"`
	Content     string    `json:"content"`
	Image       string    `json:"image,omitempty"`
	Time        string    `json:"time"`
	Comments    int       `json:"comments"`
	Likes       int       `json:"likes"`
	IsLiked     bool      `json:"isLiked"`
	CreatedAt   time.Time `json:"createdAt"`
}

type CreatePostRequest struct {
	Content string `json:"content"`
	Image   string `json:"image,omitempty"`
}

type Comment struct {
	ID        int       `json:"id"`
	PostID    int       `json:"postId"`
	UserID    int       `json:"userId"`
	Username  string    `json:"username"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"createdAt"`
}

type Session struct {
	SessionID string
	UserID    int
	ExpiresAt time.Time
}