from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from extensions import db, socketio
from models import Task
from datetime import datetime, timezone

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")

VALID_PRIORITIES = {"low", "medium", "high"}
VALID_STATUSES   = {"pending", "in_progress", "completed"}


@tasks_bp.route("/", methods=["GET"])
@login_required
def get_tasks():
    status_filter   = request.args.get("status")
    priority_filter = request.args.get("priority")

    query = Task.query.filter_by(user_id=current_user.id)

    if status_filter and status_filter in VALID_STATUSES:
        query = query.filter_by(status=status_filter)

    if priority_filter and priority_filter in VALID_PRIORITIES:
        query = query.filter_by(priority=priority_filter)

    tasks = query.order_by(Task.created_at.asc()).all()

    return jsonify({
        "tasks": [t.to_dict() for t in tasks],
        "total": len(tasks)
    })


@tasks_bp.route("/", methods=["POST"])
@login_required
def add_task():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided."}), 400

    title = data.get("title", "").strip()

    if not title:
        return jsonify({"error": "Title is required."}), 400

    task = Task(
        title       = title,
        description = data.get("description", ""),
        priority    = data.get("priority", "medium"),
        status      = data.get("status", "pending"),
        user_id     = current_user.id,
    )

    db.session.add(task)
    db.session.commit()

    socketio.emit("task_added", task.to_dict(), room=str(current_user.id))
    return jsonify({"message": "Task created.", "task": task.to_dict()}), 201


@tasks_bp.route("/<int:task_id>", methods=["PUT"])
@login_required
def update_task(task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()

    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided."}), 400

    if "title" in data:
        title = data["title"].strip()
        if not title:
            return jsonify({"error": "Title cannot be empty."}), 400
        task.title = title

    if "description" in data:
        task.description = data["description"]

    if "priority" in data:
        task.priority = data["priority"]

    if "status" in data:
        task.status = data["status"]

    task.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    socketio.emit("task_updated", task.to_dict(), room=str(current_user.id))

    return jsonify({"message": "Task updated.", "task": task.to_dict()})


@tasks_bp.route("/<int:task_id>", methods=["DELETE"])
@login_required
def delete_task(task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()

    db.session.delete(task)
    db.session.commit()
    socketio.emit("task_deleted", {"id": task_id}, room=str(current_user.id))
    return jsonify({"message": "Task deleted.", "id": task_id})