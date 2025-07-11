package groups

import (
	"encoding/json"
	"fmt"
	"net/http"
	"social-network/internal/database"
	"social-network/internal/models"
	"social-network/internal/queries"
	"social-network/internal/utils"
)

func CreateGroupEvent(w http.ResponseWriter, r *http.Request) {
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "Could not parse multipart form", http.StatusBadRequest)
		return
	}

	title := r.FormValue("title")
	description := r.FormValue("description")
	age := r.FormValue("restrictedAge")
	dayTime := r.FormValue("datetime")
	group_id := r.FormValue("groupid")
	user_id := r.FormValue("userid")

	// Insert event
	result, err := database.DB.Exec(queries.InsertEventQuery, group_id, user_id, title, description, dayTime, age)
	if err != nil {
		http.Error(w, "Failed to insert event", http.StatusBadRequest)
		fmt.Println("Insert error:", err)
		return
	}

	eventID, err := result.LastInsertId()
	if err != nil {
		http.Error(w, "Failed to get event ID", http.StatusInternalServerError)
		fmt.Println("LastInsertId error:", err)
		return
	}

	_, err = database.DB.Exec(queries.EventResponseQuery, eventID, user_id, group_id, "going")

	if err != nil {
		http.Error(w, "Failed to mark user as going", http.StatusInternalServerError)
		fmt.Println("Event response insert error:", err)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, map[string]string{"message": "Event Created and Joined"})
}

func GetGroupEvents(w http.ResponseWriter, r *http.Request) {
	user_id := r.URL.Query().Get("user_id")
	group_id := r.URL.Query().Get("group_id")

	rows, err := database.DB.Query(queries.GetGroupEventsQuery, group_id, user_id)
	if err != nil {
		http.Error(w, "Failed to query events", http.StatusInternalServerError)
		fmt.Println("Get event query error:", err)
		return
	}
	defer rows.Close()

	var events []models.Event

	for rows.Next() {
		var ev models.Event
		err := rows.Scan(
			&ev.ID, &ev.GroupID, &ev.CreatorID,
			&ev.Title, &ev.Description, &ev.Age,
			&ev.EventTime,
		)
		if err != nil {
			http.Error(w, "Failed to scan event", http.StatusInternalServerError)
			fmt.Println("Scan error:", err)
			return
		}
		events = append(events, ev)
	}

	utils.SendJSONResponse(w, http.StatusOK, events)
}

func GetGoingEvents(w http.ResponseWriter, r *http.Request) {
	user_id := r.URL.Query().Get("user_id")
	group_id := r.URL.Query().Get("group_id")
	rows, err := database.DB.Query(queries.GetGoingEventQuery, group_id, user_id)
	if err != nil {
		http.Error(w, "Failed to query events", http.StatusInternalServerError)
		fmt.Println("Get event query error:", err)
		return
	}
	defer rows.Close()

	var goingEvents []models.Event

	for rows.Next() {
		var ev models.Event
		err := rows.Scan(
			&ev.ID, &ev.GroupID, &ev.CreatorID,
			&ev.Title, &ev.Description, &ev.Age,
			&ev.EventTime,
		)
		if err != nil {
			http.Error(w, "Failed to scan event", http.StatusInternalServerError)
			fmt.Println("Scan error:", err)
			return
		}
		goingEvents = append(goingEvents, ev)
	}

	utils.SendJSONResponse(w, http.StatusOK, goingEvents)

}

func EventResponse(w http.ResponseWriter, r *http.Request) {
	var input models.EventResponseInput

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		fmt.Println("Decode error:", err)
		return
	}

	if input.Response != "going" && input.Response != "not_going" {
		http.Error(w, "Response must be 'going' or 'not_going'", http.StatusBadRequest)
		fmt.Println("only going ornot_going valid answers error")
		return
	}

	
	_, err := database.DB.Exec(`
		INSERT INTO event_responses (event_id, user_id, group_id, response)
		VALUES (?, ?, ?, ?)
	`, input.EventID, input.UserID, input.GroupID, input.Response)
	if err != nil {
		http.Error(w, "Failed to save response", http.StatusInternalServerError)
		fmt.Println("Insert error:", err)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, map[string]string{
		"message": "Response recorded successfully",
	})
}
