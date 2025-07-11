package app

import "database/sql"

type App struct {
	DB *sql.DB
	//later will incldue usermodel and postmodel etc
}

