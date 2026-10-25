# MongoDB Collection Structure

Database name: `taskmanager`

## Collection: `users`
```json
{
  "_id": "ObjectId",
  "email": "test@factree.com",
  "password_hash": "scrypt:32768:8:1$...",
  "name": "Test User",
  "created_at": "ISODate"
}
```
Index: unique on `email`.

## Collection: `tasks`
```json
{
  "_id": "ObjectId",
  "user_id": "string (the owner's users._id)",
  "title": "Submit resume",
  "description": "Send to Factree",
  "status": "Pending | In Progress | Completed",
  "priority": "Low | Medium | High",
  "priority_rank": 3,
  "due_date": "2026-10-25 or null",
  "created_at": "ISODate"
}
```
- `_id` is the task ID (sent to the app as `id`).
- `priority_rank` (Low=1, Medium=2, High=3) exists so sorting by priority works.
- Index: `user_id` ascending + `created_at` descending, for fast per-user lists.
