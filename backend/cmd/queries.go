package cmd

const (
	InsertUserQuery = `INSERT INTO users (email, password, nickname, first_name, last_name, date_of_birth, image) values (?, ?, ?, ?, ?, ?, ?)`
	AuthenticateUserQuery  = `SELECT  id, password, nickname FROM users WHERE email = ? OR nickname = ?`
	
	// Session queries
	InsertSessionQuery = `INSERT INTO sessions (session_id, user_id, expires_at) VALUES (?, ?, ?)`
	GetSessionQuery = `SELECT user_id, expires_at FROM sessions WHERE session_id = ?`
	DeleteSessionQuery = `DELETE FROM sessions WHERE session_id = ?`
	CleanupExpiredSessionsQuery = `DELETE FROM sessions WHERE expires_at < datetime('now')`
	
	// Post queries
	InsertPostQuery = `INSERT INTO posts (user_id, content, image) VALUES (?, ?, ?)`
	GetPostsQuery = `
		SELECT 
			p.id, p.user_id, p.content, p.image, p.created_at,
			COALESCE(u.nickname, u.first_name || ' ' || u.last_name) as username,
			u.image as profile_pic,
			COUNT(DISTINCT c.id) as comment_count,
			COUNT(DISTINCT l.id) as like_count,
			EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) as is_liked
		FROM posts p
		INNER JOIN users u ON p.user_id = u.id
		LEFT JOIN post_comments c ON p.id = c.post_id
		LEFT JOIN post_likes l ON p.id = l.post_id
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
			EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) as is_liked
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
	InsertCommentQuery = `INSERT INTO post_comments (post_id, user_id, content) VALUES (?, ?, ?)`
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
	
	GetFollowerCountQuery = `SELECT COUNT(*) FROM follows WHERE following_id = ? AND status = 'accepted'`
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
	
	GetUserPostsQuery = `
		SELECT 
			p.id, p.user_id, p.content, p.image, p.created_at,
			COALESCE(u.nickname, u.first_name || ' ' || u.last_name) as username,
			u.image as profile_pic,
			COUNT(DISTINCT c.id) as comment_count,
			COUNT(DISTINCT l.id) as like_count,
			EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) as is_liked
		FROM posts p
		INNER JOIN users u ON p.user_id = u.id
		LEFT JOIN post_comments c ON p.id = c.post_id
		LEFT JOIN post_likes l ON p.id = l.post_id
		WHERE p.user_id = ?
		GROUP BY p.id
		ORDER BY p.created_at DESC`
	
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
)