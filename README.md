# Task Management App (React Native + Flask + MongoDB)

A mobile task manager. The React Native app talks to a Flask REST API, and all data is saved in MongoDB.

## Architecture

```
React Native (Expo)  --HTTP + JWT-->  Flask REST API  --PyMongo-->  MongoDB
   5 screens                          /api/...                      users, tasks
```

- **Mobile (`/mobile`)**: Expo + React Native, React Navigation, Axios.
- **Backend (`/backend`)**: Flask, PyJWT, PyMongo, Flask-CORS.
- **Database**: MongoDB (collections: `users`, `tasks`). See `MONGODB_STRUCTURE.md`.

## Screens

Login, Dashboard (stats, filter, sort, task list, New Task button), Create Task, Task Details (change status, edit, delete), Edit Task.

## Setup and run

### 1. Requirements
- Python 3.10+
- Node.js 18+
- MongoDB running locally (`mongodb://localhost:27017`) or a free MongoDB Atlas URI
- Android Studio emulator, or the **Expo Go** app on your phone

### 2. Backend
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate     Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # Windows: copy .env.example .env
python app.py
```
The server starts at `http://localhost:5000`. On start it creates the test account:

- Email: `test@factree.com`
- Password: `Test@1234`

Check it works: open `http://localhost:5000/api/health` in a browser. You should see `{"status":"ok"}`.

### 3. Mobile app
```bash
cd mobile
npm install
```
Open `src/config.js` and set `API_URL`:
- Android emulator: `http://10.0.2.2:5000/api`
- Real phone on the same Wi-Fi: `http://YOUR_COMPUTER_IP:5000/api`

Then run:
```bash
npx expo start
```
Scan the QR code with Expo Go, or press `a` for the Android emulator.

## Implementation decisions

- **JWT auth**: login returns a signed token valid for 24 hours. Flask checks it on every protected route with a decorator (`auth_required`).
- **Secure storage**: the token is saved with `expo-secure-store` (Android Keystore / iOS Keychain), not plain AsyncStorage.
- **Expired token handling**: an Axios interceptor catches any 401 from a protected route, clears the token and returns the user to Login with a message.
- **Password safety**: passwords are hashed (Werkzeug) and never stored as plain text.
- **User isolation**: every task has a `user_id`; all queries filter by it, so users only see their own tasks.
- **Validation**: done on both sides (form validation in the app, and again in Flask).
- **Filtering and sorting on the server**: `GET /api/tasks?status=...&sort_by=...`. Priority is stored as `priority_rank` (1-3) so sorting is correct.
- **Dashboard refresh**: screens reload data with `useFocusEffect`, so counts update after create, edit or delete.
- **One form for create and edit**: `TaskForm` is reused by both screens.
- **Error states**: loading spinners, empty lists, no-internet, server errors, invalid input, login failure, and delete confirmation.

## Known limitations

- Only a pre-seeded test user; no registration screen.
- Due date is typed as `YYYY-MM-DD` (no calendar picker).
- No offline mode; the app needs internet to work.
- No refresh tokens; after 24 hours the user logs in again.
- No pagination on the task list.
- No automated tests.
- Flask runs in debug mode; use a production server (e.g. gunicorn) and a strong `JWT_SECRET` for real deployment.
