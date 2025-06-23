package cmd

import (
	"net/http"
	
)

func (app *App) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/register", app.HandleRegister)
	mux.HandleFunc("/login", app.HandleLogin)
	mux.HandleFunc("/authorization" , app.Authorization)
}
