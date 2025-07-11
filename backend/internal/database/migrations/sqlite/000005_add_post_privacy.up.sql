-- Add privacy column to posts table
ALTER TABLE posts ADD COLUMN privacy TEXT NOT NULL DEFAULT 'public' CHECK(privacy IN ('public', 'followers', 'private'));

-- Create table for private post viewers
CREATE TABLE IF NOT EXISTS post_viewers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(post_id, user_id)
);