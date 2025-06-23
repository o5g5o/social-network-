package cmd

const (
	InsertUserQuery = `INSERT INTO users (email, password, nickname, first_name, last_name, date_of_birth, image) values (?, ?, ?, ?, ?, ?, ?)`
	AuthenticateUserQuery  = `SELECT  id, password, nickname FROM users WHERE email = ? OR nickname = ?`
)