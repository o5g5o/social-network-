package models

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
	ID          int    `json:"id"`
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
	ID         int       `json:"id"`
	UserID     int       `json:"userId"`
	Username   string    `json:"username"`
	ProfilePic string    `json:"profilePic"`
	Content    string    `json:"content"`
	Image      string    `json:"image,omitempty"`
	Time       string    `json:"time"`
	Comments   int       `json:"comments"`
	Likes      int       `json:"likes"`
	IsLiked    bool      `json:"isLiked"`
	Privacy    string    `json:"privacy"`
	CreatedAt  time.Time `json:"createdAt"`
}

type CreatePostRequest struct {
	Content         string `json:"content"`
	Image           string `json:"image,omitempty"`
	Privacy         string `json:"privacy"`
	SelectedViewers []int  `json:"selectedViewers,omitempty"`
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

type UserProfile struct {
	ID                int       `json:"id"`
	Email             string    `json:"email"`
	FirstName         string    `json:"firstName"`
	LastName          string    `json:"lastName"`
	Nickname          string    `json:"nickname"`
	DateOfBirth       string    `json:"dateOfBirth"`
	ProfilePic        string    `json:"profilePic"`
	AboutMe           string    `json:"aboutMe"`
	IsPrivate         bool      `json:"isPrivate"`
	CreatedAt         time.Time `json:"createdAt"`
	Posts             []Post    `json:"posts"`
	FollowersCount    int       `json:"followersCount"`
	FollowingCount    int       `json:"followingCount"`
	IsFollowing       bool      `json:"isFollowing"`
	IsOwnProfile      bool      `json:"isOwnProfile"`
	HasPendingRequest bool      `json:"hasPendingRequest"`
}

type UpdateProfileRequest struct {
	Nickname  string `json:"nickname"`
	AboutMe   string `json:"aboutMe"`
	IsPrivate bool   `json:"isPrivate"`
}

type FollowUser struct {
	ID         int    `json:"id"`
	Nickname   string `json:"nickname"`
	FirstName  string `json:"firstName"`
	LastName   string `json:"lastName"`
	ProfilePic string `json:"profilePic"`
}

type UserListItem struct {
	ID          int    `json:"id"`
	Nickname    string `json:"nickname"`
	FirstName   string `json:"firstName"`
	LastName    string `json:"lastName"`
	ProfilePic  string `json:"profilePic"`
	IsPrivate   bool   `json:"isPrivate"`
	IsFollowing bool   `json:"isFollowing"`
}

type GroupDetails struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	CreatorID   int    `json:"creator_id"`
	Image       string `json:"image"`
	Description string `json:"description"`
}

type Invitation struct {
	GroupID    int `json:"group_id"`
	TargetedID int `json:"target_user_id"`
	InviterID  int `json:"inviter_id"`
}

type GroupInvitation struct {
	InvitationID int    `json:"invitation_id"`
	GroupID      int    `json:"group_id"`
	Image        string `json:"image"`
	Title        string `json:"title"`
	InvitorName  string `json:"invitor_name"`
	Description  string `json:"description"`
	Status       string `json:"status"`
}

type Response struct {
	UserID       int    `json:"user_id"`
	InvitationID int    `json:"invitation_id"`
	GroupID      int    `json:"group_id"`
	Action       string `json:"action"`
}

type GroupRequest struct {
	GroupID int `json:"group_id"`
	UserID  int `json:"user_id"`
}

type JoinRequest struct {
	RequestID int    `json:"id"`
	UserID    int    `json:"user_id"`
	Nickname  string `json:"nickname"`
	GroupID   int    `json:"group_id"`
	Title     string `json:"title"`
	Image     string `json:"image"`
}

type WSMessage struct {
	Type string      `json:"type"`
	Data any `json:"data"`
}

type Message struct {
	Type       string `json:"type"`
	SenderID   int    `json:"sender_id"`
	ReceiverID  int    `json:"receiver_id"`
	Content    string `json:"content"`
	Timestamp  string `json:"timestamp"`
}

type GroupMessage struct {
	Type       string `json:"type"`
	SenderID   int    `json:"sender_id"`
	ChatID     int    `json:"chat_id"`
	Content    string `json:"content"`
	Timestamp  string `json:"timestamp"`
}

type Event struct {
	ID          int    `json:"id"`
	GroupID     int    `json:"group_id"`
	CreatorID   int    `json:"creator_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Age         string `json:"age"`
	EventTime   string `json:"event_time"`
}

type EventResponseInput struct {
	EventID  int    `json:"event_id"`
	UserID   int    `json:"user_id"`
	GroupID  int    `json:"group_id"`
	Response string `json:"response"`
}