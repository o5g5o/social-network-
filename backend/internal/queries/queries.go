package queries

const (
	InsertUserQuery       = `INSERT INTO users (email, password, nickname, first_name, last_name, date_of_birth, image) values (?, ?, ?, ?, ?, ?, ?)`
	AuthenticateUserQuery = `SELECT  id, password, nickname FROM users WHERE email = ? OR nickname = ?`

	// Session queries
	InsertSessionQuery          = `INSERT INTO sessions (session_id, user_id, expires_at) VALUES (?, ?, ?)`
	GetSessionQuery             = `SELECT user_id, expires_at FROM sessions WHERE session_id = ?`
	DeleteSessionQuery          = `DELETE FROM sessions WHERE session_id = ?`
	CleanupExpiredSessionsQuery = `DELETE FROM sessions WHERE expires_at < datetime('now')`

	// Post queries with corrected privacy filtering
	InsertPostQuery = `INSERT INTO posts (user_id, content, image, privacy) VALUES (?, ?, ?, ?)`
	GetPostsQuery   = `
		SELECT 
			p.id, p.user_id, p.content, p.image, p.created_at,
			COALESCE(u.nickname, u.first_name || ' ' || u.last_name) as username,
			u.image as profile_pic,
			COUNT(DISTINCT c.id) as comment_count,
			COUNT(DISTINCT l.id) as like_count,
			EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) as is_liked,
			p.privacy
		FROM posts p
		INNER JOIN users u ON p.user_id = u.id
		LEFT JOIN post_comments c ON p.id = c.post_id
		LEFT JOIN post_likes l ON p.id = l.post_id
		WHERE (
			? = 0 OR
			p.privacy = 'public' OR
			p.user_id = ? OR
			(p.privacy = 'followers' AND EXISTS(
				SELECT 1 FROM follows 
				WHERE follower_id = ? AND following_id = p.user_id AND status = 'accepted'
			)) OR
			(p.privacy = 'private' AND EXISTS(
				SELECT 1 FROM post_viewers 
				WHERE post_id = p.id AND user_id = ?
			))
		)
		GROUP BY p.id
		ORDER BY p.created_at DESC
		LIMIT ? OFFSET ?`

	GetPostByIDQuery = `
		SELECT 
			p.id, p.user_id, p.content, p.image, p.created_at,
			COALESCE(u.nickname, u.first_name || ' ' || u.last_name) as username,
			u.image as profile_pic,
			COUNT(DISTINCT c.id) as comment_count,
			COUNT(DISTINCT l.id) as like_count,
			EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) as is_liked,
			p.privacy
		FROM posts p
		INNER JOIN users u ON p.user_id = u.id
		LEFT JOIN post_comments c ON p.id = c.post_id
		LEFT JOIN post_likes l ON p.id = l.post_id
		WHERE p.id = ?
		GROUP BY p.id`

	InsertPostViewerQuery = `INSERT INTO post_viewers (post_id, user_id) VALUES (?, ?)`

	// Like queries
	InsertLikeQuery = `INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)`
	DeleteLikeQuery = `DELETE FROM post_likes WHERE post_id = ? AND user_id = ?`

	// Comment queries
	InsertCommentQuery     = `INSERT INTO post_comments (post_id, user_id, content) VALUES (?, ?, ?)`
	GetCommentsByPostQuery = `
		SELECT 
			c.id, c.post_id, c.user_id, c.content, c.created_at,
			COALESCE(u.nickname, u.first_name || ' ' || u.last_name) as username
		FROM post_comments c
		INNER JOIN users u ON c.user_id = u.id
		WHERE c.post_id = ?
		ORDER BY c.created_at ASC`

	// Profile queries
	GetUserProfileQuery = `
		SELECT id, email, first_name, last_name, nickname, date_of_birth, 
		       image, about_me, is_private, created_at
		FROM users WHERE id = ?`

	UpdateProfileQuery = `
		UPDATE users 
		SET nickname = ?, about_me = ?, is_private = ?
		WHERE id = ?`

	GetFollowerCountQuery  = `SELECT COUNT(*) FROM follows WHERE following_id = ? AND status = 'accepted'`
	GetFollowingCountQuery = `SELECT COUNT(*) FROM follows WHERE follower_id = ? AND status = 'accepted'`

	CheckFollowingQuery = `
		SELECT EXISTS(
			SELECT 1 FROM follows 
			WHERE follower_id = ? AND following_id = ? AND status = 'accepted'
		)`

	CheckPendingFollowQuery = `
		SELECT EXISTS(
			SELECT 1 FROM follows 
			WHERE follower_id = ? AND following_id = ? AND status = 'pending'
		)`

	// GetUserPostsQuery = `
	// 	SELECT
	// 		p.id, p.user_id, p.content, p.image, p.created_at,
	// 		COALESCE(u.nickname, u.first_name || ' ' || u.last_name) as username,
	// 		u.image as profile_pic,
	// 		COUNT(DISTINCT c.id) as comment_count,
	// 		COUNT(DISTINCT l.id) as like_count,
	// 		EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) as is_liked,
	// 		p.privacy
	// 	FROM posts p
	// 	INNER JOIN users u ON p.user_id = u.id
	// 	LEFT JOIN post_comments c ON p.id = c.post_id
	// 	LEFT JOIN post_likes l ON p.id = l.post_id
	// 	WHERE p.user_id = ?
	// 	GROUP BY p.id
	// 	ORDER BY p.created_at DESC`
	// this is commented cause i think someone changed it in the backend but didnt update here so im commenting to be safe

	GetUserPostsQuery = `
		SELECT 
			p.id, p.user_id, p.content, p.image, p.created_at,
			COALESCE(u.nickname, u.first_name || ' ' || u.last_name) as username,
			u.image as profile_pic,
			COUNT(DISTINCT c.id) as comment_count,
			COUNT(DISTINCT l.id) as like_count,
			EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) as is_liked,
			p.privacy
		FROM posts p
		INNER JOIN users u ON p.user_id = u.id
		LEFT JOIN post_comments c ON p.id = c.post_id
		LEFT JOIN post_likes l ON p.id = l.post_id
		WHERE p.user_id = ? AND (
			p.privacy = 'public' OR
			p.user_id = ? OR
			(p.privacy = 'followers' AND EXISTS(
				SELECT 1 FROM follows 
				WHERE follower_id = ? AND following_id = p.user_id AND status = 'accepted'
			)) OR
			(p.privacy = 'private' AND EXISTS(
				SELECT 1 FROM post_viewers 
				WHERE post_id = p.id AND user_id = ?
			))
		)
		GROUP BY p.id
		ORDER BY p.created_at DESC`

	GetFollowRequestQuery = `
		SELECT u.id, u.nickname, u.first_name, u.last_name, u.image
		FROM users u
		INNER JOIN follows f ON u.id = f.follower_id
		WHERE f.following_id = ? AND f.status = 'pending'
		ORDER BY f.created_at DESC
	`
	GetFollowersQuery = `
		SELECT u.id, u.nickname, u.first_name, u.last_name, u.image
		FROM users u
		INNER JOIN follows f ON u.id = f.follower_id
		WHERE f.following_id = ? AND f.status = 'accepted'`

	GetFollowingQuery = `
		SELECT u.id, u.nickname, u.first_name, u.last_name, u.image
		FROM users u
		INNER JOIN follows f ON u.id = f.following_id
		WHERE f.follower_id = ? AND f.status = 'accepted'`
	DeleteFollowRequestQuery = `DELETE FROM follows WHERE follower_id = ? AND following_id = ? AND status = 'pending'`
	DeleteFollowerQuery      = `DELETE FROM follows WHERE follower_id = ? AND following_id = ?`
	InsertGroupQuery         = `INSERT INTO groups (title, description, creator_id, image) VALUES (?, ?, ?, ?)`
	InsertGroupMemberQuery   = `INSERT INTO group_members (user_id, group_id) VALUES (?, ?)`

	GetGroupMembersQuery = `
	SELECT g.id, g.title, g.description, g.image
	FROM groups g
	INNER JOIN group_members gm ON g.id = gm.group_id
	WHERE gm.user_id = ?
	`
	SearchUsersQuery = `
	SELECT id, email, nickname, image
FROM users u
WHERE u.id != ?  -- current user id to exclude self
  AND (
    u.email LIKE ? 
    OR u.nickname LIKE ? 
    OR u.first_name LIKE ? 
    OR u.last_name LIKE ?
  )
  AND NOT EXISTS (
    SELECT 1 FROM group_members gm 
    WHERE gm.user_id = u.id AND gm.group_id = ?
  )
  AND NOT EXISTS (
    SELECT 1 FROM group_invitations gi 
    WHERE gi.invited_user_id = u.id 
      AND gi.group_id = ?
      AND gi.status = 'pending'
  )
LIMIT 10;
`
	InsertInvitationQuery = `
  INSERT INTO group_invitations (
    group_id,
    invited_user_id,
    invited_by_user_id
  ) VALUES (?, ?, ?)
`

	GetUserInvitationsQuery = `SELECT
  gi.id AS invitation_id,
  g.id AS group_id,
  g.title, 
  g.description,
  g.image, 
  u.nickname AS invitor_name,
  gi.status
FROM 
  group_invitations gi
JOIN 
  groups g ON gi.group_id = g.id
JOIN 
  users u ON gi.invited_by_user_id = u.id
WHERE 
  gi.invited_user_id = ?
  AND gi.status = 'pending';
`

	UpdateInvitationQuery = `UPDATE group_invitations SET status = ? WHERE id = ?`
	UpdateRequestQuery    = `UPDATE group_join_requests SET status = ? WHERE id = ?`

	GetPublicGroupQuery = `SELECT g.id, g.creator_id, g.title, g.description, g.image
FROM groups g
LEFT JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = ?
LEFT JOIN group_join_requests gjr ON gjr.group_id = g.id AND gjr.user_id = ?
WHERE gm.user_id IS NULL AND gjr.user_id IS NULL
`

	InsertGroupRequestQuery = `INSERT INTO group_join_requests (user_id, group_id)
VALUES (?, ?);`
	GetAdminGroupRequestsQuery = `
		SELECT 
			r.id, r.user_id, u.nickname, g.title, g.id, u.image AS group_id
		FROM 
			group_join_requests r
		JOIN users u ON r.user_id = u.id
		JOIN groups g ON r.group_id = g.id
		WHERE 
			g.creator_id = ? AND r.status = 'pending'
	`
	IsPrivateUserQuery = "SELECT is_private FROM users WHERE id = ?"

	GetUserNameByID = "SELECT nickname FROM users WHERE id = ?"

	InsertMessage = `INSERT INTO MESSAGES (message_content, sender_id, receiver_id) VALUES (?, ?, ?)`

		InsertEventQuery   = `INSERT INTO group_events (group_id, creator_id, title, description, event_time, age) VALUES (?, ?, ? , ?, ?, ?) `
	EventResponseQuery = `
		INSERT INTO event_responses (event_id, user_id, group_id, response)
		VALUES (?, ?, ?, ?);
		
	`
	GetGroupEventsQuery = `SELECT e.id, e.group_id, e.creator_id, e.title, e.description, e.age, e.event_time
FROM group_events e
WHERE e.group_id = ?
  AND NOT EXISTS (
    SELECT 1 FROM event_responses r
    WHERE r.event_id = e.id AND r.user_id = ?
  )
`
	GetGoingEventQuery = `SELECT e.id, e.group_id, e.creator_id, e.title, e.description, e.age, e.event_time
FROM group_events e
JOIN event_responses r ON r.event_id = e.id
WHERE e.group_id = ?
  AND r.user_id = ?
  AND r.response = 'going'
  ORDER BY e.event_time ASC;
`
	InsertEventResponse = `
		INSERT INTO event_responses (event_id, user_id, group_id, response)
		VALUES (?, ?, ?, ?)
	`
)
