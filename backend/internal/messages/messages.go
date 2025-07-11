package messages

import (
	"social-network/internal/database"
	"social-network/internal/models"
	"social-network/internal/queries"
)

func SaveMessage(msg models.Message) error {
	_, err := database.DB.Exec(queries.InsertMessage,
		msg.Content, msg.SenderID, msg.ReceiverID,
	)
	return err
}
