CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE CHECK (length(email) <= 255),
    password TEXT NOT NULL CHECK (length(password) <= 255),
    nickname TEXT CHECK (length(nickname) <= 50),
    first_name TEXT NOT NULL CHECK (length(first_name) <= 100),
    last_name TEXT NOT NULL CHECK (length(last_name) <= 100),
    date_of_birth DATE NOT NULL,
    image TEXT CHECK (length(image) <= 500),
    about_me TEXT CHECK (length(about_me) <= 1000),
    is_private BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);