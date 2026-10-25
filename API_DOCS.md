# API Documentation

Base URL: `http://localhost:5000/api`

All routes except `/auth/login` and `/health` need this header:
`Authorization: Bearer <access_token>`

Errors always look like: `{ "error": "message", "code": "optional_code" }`

Task object:
```json
{
  "id": "665f...",
  "title": "Submit resume",
  "description": "Send to Factree",
  "status": "Pending",
  "priority": "High",
  "due_date": "2026-10-25",
  "created_at": "2026-10-24T16:30:00.123456Z"
}
```
Status: `Pending`, `In Progress`, `Completed`. Priority: `Low`, `Medium`, `High`.

---

## POST /auth/login
Body: `{ "email": "test@factree.com", "password": "Test@1234" }`

- 200: `{ "access_token": "...", "user": { "email": "...", "name": "..." } }`
- 400: email or password missing
- 401: `{ "error": "Invalid email or password", "code": "invalid_credentials" }`

## GET /dashboard/stats
- 200: `{ "total": 4, "pending": 2, "in_progress": 1, "completed": 1, "recent_tasks": [ ...5 newest tasks ] }`
- 401: missing, invalid or expired token (`code`: `token_missing`, `token_invalid`, `token_expired`)

## GET /tasks
Query (all optional):
- `status`: Pending | In Progress | Completed
- `sort_by`: `created_at` (default) | `priority`
- `order`: `desc` (default) | `asc`

- 200: `{ "tasks": [ ... ], "count": 3 }`
- 400: invalid filter or sort value

## POST /tasks
Body: `{ "title": "Submit resume", "description": "...", "status": "Pending", "priority": "High", "due_date": "2026-10-25" }`
Only `title` is required. Defaults: status `Pending`, priority `Medium`.

- 201: the created task
- 400: validation error (e.g. `Title is required`)

## GET /tasks/{id}
- 200: the task
- 400: invalid id
- 404: `Task not found`

## PUT /tasks/{id}
Body: any task fields to change (same rules as create).
- 200: the updated task
- 400 / 404

## PATCH /tasks/{id}/status
Body: `{ "status": "Completed" }`
- 200: the updated task
- 400: invalid status
- 404: not found

## DELETE /tasks/{id}
- 200: `{ "message": "Task deleted" }`
- 404: not found

## GET /health
- 200: `{ "status": "ok" }`
