import os
import datetime as dt
from functools import wraps

import jwt
from bson import ObjectId
from bson.errors import InvalidId
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient, DESCENDING, ASCENDING
from werkzeug.security import generate_password_hash, check_password_hash

load_dotenv()

app = Flask(__name__)
CORS(app)

JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret")
JWT_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", "24"))

client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017"))
db = client[os.getenv("DB_NAME", "taskmanager")]
users = db["users"]
tasks = db["tasks"]

STATUSES = ["Pending", "In Progress", "Completed"]
PRIORITIES = {"Low": 1, "Medium": 2, "High": 3}


# ---------- helpers ----------
def error(message, code=400, error_code=None):
    body = {"error": message}
    if error_code:
        body["code"] = error_code
    return jsonify(body), code


def seed_user():
    """Create the pre-seeded test account if it does not exist."""
    users.create_index("email", unique=True)
    if not users.find_one({"email": "test@factree.com"}):
        users.insert_one({
            "email": "test@factree.com",
            "password_hash": generate_password_hash("Test@1234"),
            "name": "Test User",
            "created_at": dt.datetime.utcnow(),
        })
    tasks.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])


def serialize(task):
    return {
        "id": str(task["_id"]),
        "title": task["title"],
        "description": task.get("description", ""),
        "status": task["status"],
        "priority": task["priority"],
        "due_date": task.get("due_date"),
        "created_at": task["created_at"].isoformat() + "Z",
    }


def parse_object_id(value):
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        return None


def validate_task(data, partial=False):
    """Return (clean_data, error_message)."""
    clean = {}
    if not partial or "title" in data:
        title = (data.get("title") or "").strip()
        if not title:
            return None, "Title is required"
        if len(title) > 100:
            return None, "Title must be 100 characters or less"
        clean["title"] = title
    if "description" in data:
        clean["description"] = (data.get("description") or "").strip()
    if "status" in data:
        if data["status"] not in STATUSES:
            return None, "Status must be Pending, In Progress or Completed"
        clean["status"] = data["status"]
    if "priority" in data:
        if data["priority"] not in PRIORITIES:
            return None, "Priority must be Low, Medium or High"
        clean["priority"] = data["priority"]
        clean["priority_rank"] = PRIORITIES[data["priority"]]
    if "due_date" in data:
        due = data.get("due_date")
        if due in (None, ""):
            clean["due_date"] = None
        else:
            try:
                dt.datetime.strptime(due, "%Y-%m-%d")
            except (ValueError, TypeError):
                return None, "Due date must be in YYYY-MM-DD format"
            clean["due_date"] = due
    return clean, None


def auth_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return error("Missing token", 401, "token_missing")
        token = header.split(" ", 1)[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return error("Session expired. Please log in again.", 401, "token_expired")
        except jwt.InvalidTokenError:
            return error("Invalid token. Please log in again.", 401, "token_invalid")
        request.user_id = payload["sub"]
        return fn(*args, **kwargs)
    return wrapper


# ---------- auth ----------
@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not email or not password:
        return error("Email and password are required", 400)
    user = users.find_one({"email": email})
    if not user or not check_password_hash(user["password_hash"], password):
        return error("Invalid email or password", 401, "invalid_credentials")
    token = jwt.encode(
        {
            "sub": str(user["_id"]),
            "exp": dt.datetime.utcnow() + dt.timedelta(hours=JWT_HOURS),
            "iat": dt.datetime.utcnow(),
        },
        JWT_SECRET,
        algorithm="HS256",
    )
    return jsonify({"access_token": token, "user": {"email": user["email"], "name": user.get("name", "")}})


# ---------- tasks ----------
@app.post("/api/tasks")
@auth_required
def create_task():
    data = request.get_json(silent=True) or {}
    data.setdefault("status", "Pending")
    data.setdefault("priority", "Medium")
    clean, err = validate_task(data)
    if err:
        return error(err, 400)
    clean.setdefault("description", "")
    clean.setdefault("due_date", None)
    clean["user_id"] = request.user_id
    clean["created_at"] = dt.datetime.utcnow()
    result = tasks.insert_one(clean)
    return jsonify(serialize(tasks.find_one({"_id": result.inserted_id}))), 201


@app.get("/api/tasks")
@auth_required
def list_tasks():
    query = {"user_id": request.user_id}
    status = request.args.get("status")
    if status:
        if status not in STATUSES:
            return error("Invalid status filter", 400)
        query["status"] = status
    sort_by = request.args.get("sort_by", "created_at")
    order = request.args.get("order", "desc")
    direction = ASCENDING if order == "asc" else DESCENDING
    if sort_by == "priority":
        sort = [("priority_rank", direction), ("created_at", DESCENDING)]
    elif sort_by == "created_at":
        sort = [("created_at", direction)]
    else:
        return error("sort_by must be created_at or priority", 400)
    items = [serialize(t) for t in tasks.find(query).sort(sort)]
    return jsonify({"tasks": items, "count": len(items)})


@app.get("/api/tasks/<task_id>")
@auth_required
def get_task(task_id):
    oid = parse_object_id(task_id)
    if not oid:
        return error("Invalid task id", 400)
    task = tasks.find_one({"_id": oid, "user_id": request.user_id})
    if not task:
        return error("Task not found", 404)
    return jsonify(serialize(task))


@app.put("/api/tasks/<task_id>")
@auth_required
def update_task(task_id):
    oid = parse_object_id(task_id)
    if not oid:
        return error("Invalid task id", 400)
    data = request.get_json(silent=True) or {}
    clean, err = validate_task(data, partial=True)
    if err:
        return error(err, 400)
    if not clean:
        return error("Nothing to update", 400)
    result = tasks.find_one_and_update(
        {"_id": oid, "user_id": request.user_id},
        {"$set": clean},
        return_document=True,
    )
    if not result:
        return error("Task not found", 404)
    return jsonify(serialize(result))


@app.patch("/api/tasks/<task_id>/status")
@auth_required
def update_status(task_id):
    oid = parse_object_id(task_id)
    if not oid:
        return error("Invalid task id", 400)
    data = request.get_json(silent=True) or {}
    if data.get("status") not in STATUSES:
        return error("Status must be Pending, In Progress or Completed", 400)
    result = tasks.find_one_and_update(
        {"_id": oid, "user_id": request.user_id},
        {"$set": {"status": data["status"]}},
        return_document=True,
    )
    if not result:
        return error("Task not found", 404)
    return jsonify(serialize(result))


@app.delete("/api/tasks/<task_id>")
@auth_required
def delete_task(task_id):
    oid = parse_object_id(task_id)
    if not oid:
        return error("Invalid task id", 400)
    result = tasks.delete_one({"_id": oid, "user_id": request.user_id})
    if result.deleted_count == 0:
        return error("Task not found", 404)
    return jsonify({"message": "Task deleted"})


# ---------- dashboard ----------
@app.get("/api/dashboard/stats")
@auth_required
def dashboard_stats():
    uid = request.user_id
    counts = {s: tasks.count_documents({"user_id": uid, "status": s}) for s in STATUSES}
    recent = [serialize(t) for t in tasks.find({"user_id": uid}).sort("created_at", DESCENDING).limit(5)]
    return jsonify({
        "total": sum(counts.values()),
        "pending": counts["Pending"],
        "in_progress": counts["In Progress"],
        "completed": counts["Completed"],
        "recent_tasks": recent,
    })


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.errorhandler(404)
def not_found(_):
    return error("Route not found", 404)


@app.errorhandler(500)
def server_error(_):
    return error("Something went wrong on the server", 500)


if __name__ == "__main__":
    seed_user()
    app.run(host="0.0.0.0", port=5000, debug=True)
