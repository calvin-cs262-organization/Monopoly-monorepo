# Monopoly API

Base URL: `http://localhost:3000`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/Game` | List all games |
| GET | `/Players` | List all players |
| GET | `/Player/:id` | Get a player by ID |
| POST | `/Player` | Create a player (`{ name, emailAddress }`) |
| DELETE | `/Player/:id` | Delete a player by ID |
