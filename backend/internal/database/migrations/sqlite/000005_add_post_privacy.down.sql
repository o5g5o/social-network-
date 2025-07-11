DROP TABLE IF EXISTS post_viewers;

-- SQLite doesn't support dropping columns directly, so we need to recreate the table
CREATE TABLE posts_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL CHECK (length(content) <= 1000),
    image TEXT CHECK (length(image) <= 500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO posts_new SELECT id, user_id, content, image, created_at, updated_at FROM posts;
DROP TABLE posts;
ALTER TABLE posts_new RENAME TO posts;