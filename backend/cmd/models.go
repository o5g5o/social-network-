package cmd

import "database/sql"

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
