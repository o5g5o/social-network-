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

func GroupInvitation(w http.ResponseWriter, r *http.Request) {
	var invitation models.Invitation

	err := json.NewDecoder(r.Body).Decode(&invitation)
	if err != nil {
		http.Error(w, "Failed to decode request body", http.StatusInternalServerError)
		fmt.Println("Error decoding request body in GroupInvitation:", err)
		return
	}

	_, err2 := database.DB.Exec(queries.InsertInvitationQuery, invitation.GroupID, invitation.TargetedID, invitation.InviterID)
	if err2 != nil {
		http.Error(w, "Database error: "+err2.Error(), http.StatusInternalServerError)
		fmt.Println("Error executing InsertInvitationQuery in GroupInvitation:", err2)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, map[string]string{"message": "Invitation successful"})
}

func  GetUserInvitations(w http.ResponseWriter, r *http.Request) {
	userquery := r.URL.Query().Get("user_id")
	if userquery == "" {
		http.Error(w, "Missing user_id parameter", http.StatusBadRequest)
		fmt.Println("Missing user_id in GetUserInvitations")
		return
	}

	rows, err := database.DB.Query(queries.GetUserInvitationsQuery, userquery)
	if err != nil {
		http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
		fmt.Println("Error executing GetUserInvitationsQuery:", err)
		return
	}
	defer rows.Close()

	var invitations []models.GroupInvitation
	for rows.Next() {
		var i models.GroupInvitation
		if err := rows.Scan(&i.InvitationID, &i.GroupID, &i.Title, &i.Description, &i.Image, &i.InvitorName, &i.Status); err != nil {
			fmt.Println("Error scanning row in GetUserInvitations:", err)
			continue
		}
		invitations = append(invitations, i)
	}

	utils.SendJSONResponse(w, http.StatusOK, invitations)
}

func  InvitationResponse(w http.ResponseWriter, r *http.Request) {
	var res models.Response
	if err := json.NewDecoder(r.Body).Decode(&res); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		fmt.Println("Error decoding body in InvitationResponse:", err)
		return
	}

	if res.Action != "accept" && res.Action != "decline" {
		http.Error(w, "Invalid action", http.StatusBadRequest)
		fmt.Println("Invalid action value in InvitationResponse:", res.Action)
		return
	}

	_, err := database.DB.Exec(queries.UpdateInvitationQuery, res.Action, res.InvitationID)
	if err != nil {
		http.Error(w, "Failed to update invitation", http.StatusInternalServerError)
		fmt.Println("Error executing UpdateInvitationQuery in InvitationResponse:", err)
		return
	}

	if res.Action == "accept" {
		fmt.Println(res.UserID)
		_, err = database.DB.Exec(queries.InsertGroupMemberQuery, res.UserID, res.GroupID)
		if err != nil {
			http.Error(w, "Failed to add user to group", http.StatusInternalServerError)
			fmt.Println("Error executing InsertGroupMemberQuery in InvitationResponse:", err)
			return
		}
	}

	utils.SendJSONResponse(w, http.StatusOK, map[string]string{
		"message": "Action processed successfully",
	})
}

func  RequestResponse(w http.ResponseWriter, r *http.Request) {
	var res models.Response
	if err := json.NewDecoder(r.Body).Decode(&res); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		fmt.Println("Error decoding body in InvitationResponse:", err)
		return
	}

	if res.Action != "accept" && res.Action != "decline" {
		http.Error(w, "Invalid action", http.StatusBadRequest)
		fmt.Println("Invalid action value in InvitationResponse:", res.Action)
		return
	}

	_, err := database.DB.Exec(queries.UpdateRequestQuery, res.Action, res.InvitationID)
	if err != nil {
		http.Error(w, "Failed to update invitation", http.StatusInternalServerError)
		fmt.Println("Error executing UpdateInvitationQuery in InvitationResponse:", err)
		return
	}

	if res.Action == "accept" {
		fmt.Println(res.UserID)
		_, err = database.DB.Exec(queries.InsertGroupMemberQuery, res.UserID, res.GroupID)
		if err != nil {
			http.Error(w, "Failed to add user to group", http.StatusInternalServerError)
			fmt.Println("Error executing InsertGroupMemberQuery in InvitationResponse:", err)
			return
		}
	}

	utils.SendJSONResponse(w, http.StatusOK, map[string]string{
		"message": "Action processed successfully",
	})
}

func  GetPublicGroupsHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("user")
	if userID == "" {
		http.Error(w, "Missing user ID", http.StatusBadRequest)
		fmt.Println("failed 1")
		return
	}
	rows, err := database.DB.Query(queries.GetPublicGroupQuery, userID, userID)
	if err != nil {
		http.Error(w, "Query error", http.StatusInternalServerError)
		fmt.Println("failed 2 ", err)
		return
	}
	defer rows.Close()

	var groups []models.GroupDetails
	for rows.Next() {
		var g models.GroupDetails
		if err := rows.Scan(&g.ID, &g.CreatorID, &g.Title, &g.Description, &g.Image); err != nil {
			http.Error(w, "Scan error", http.StatusInternalServerError)
			fmt.Println("failed 3 ", err)
			return
		}
		groups = append(groups, g)
	}
	utils.SendJSONResponse(w, http.StatusOK, groups)

}

func InsertGroupRequests(w http.ResponseWriter, r *http.Request) {
	var request models.GroupRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		fmt.Println(err, "in GetGroupRequests")
		return
	}
	_, err := database.DB.Exec(queries.InsertGroupRequestQuery, request.UserID, request.GroupID)
	if err != nil {
		http.Error(w, "Failed to save join request", http.StatusInternalServerError)
		fmt.Println(err, "in RequestJoinGroup")
		return
	}
	utils.SendJSONResponse(w, http.StatusOK, map[string]string{"message": "success"})
}

func  GetJoinRequestsToCreator(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		http.Error(w, "Missing user_id", http.StatusBadRequest)
		return
	}

	rows, err := database.DB.Query(queries.GetAdminGroupRequestsQuery, userID)

	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		fmt.Println("Query error:", err)
		return
	}
	defer rows.Close()

	var requests []models.JoinRequest

	for rows.Next() {
		var req models.JoinRequest
		if err := rows.Scan(&req.RequestID, &req.UserID, &req.Nickname, &req.Title, &req.GroupID, &req.Image); err != nil {
			http.Error(w, "Failed to read rows", http.StatusInternalServerError)
			fmt.Println("Row scan error:", err)
			return
		}
		fmt.Println(req.RequestID)
		requests = append(requests, req)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "Row iteration error", http.StatusInternalServerError)
		fmt.Println("Row error:", err)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, requests)
}
