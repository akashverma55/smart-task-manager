// ── State ──
let allTasks = [];
let currentFilter = "all";

// ── WebSocket Connection ──
const socket = io();

socket.on("connected", (data) => {
    showNotification("🟢 " + data.message, 3000);
});

socket.on("task_added", (task) => {
    allTasks.unshift(task);
    renderTasks();
    showNotification(`✦ New task added: "${task.title}"`);
});

socket.on("task_updated", (task) => {
    const idx = allTasks.findIndex((t) => t.id === task.id);
    if (idx !== -1) allTasks[idx] = task;
    renderTasks();
    showNotification(`↻ Task updated: "${task.title}"`);
});

socket.on("task_deleted", (data) => {
    allTasks = allTasks.filter((t) => t.id !== data.id);
    renderTasks();
    showNotification("✕ Task deleted");
});


// ── Notification Bar ──
function showNotification(msg, duration = 4000) {
    const bar = document.getElementById("notification-bar");
    bar.textContent = msg;
    bar.classList.remove("hidden");
    clearTimeout(bar._timer);
    bar._timer = setTimeout(() => bar.classList.add("hidden"), duration);
}


// ── Section Switching ──
function showSection(name, el) {
    document.querySelectorAll(".content-section").forEach((s) => {
        s.classList.add("hidden");
    });

    document.querySelectorAll(".nav-item").forEach((n) => {
        n.classList.remove("active");
    });

    document.getElementById("section-" + name).classList.remove("hidden");
    el.classList.add("active");

    if (name === "analytics") loadAnalytics();
}


// ── Load Tasks from API ──
async function loadTasks() {
    try {
        const res  = await fetch("/api/tasks/");
        const data = await res.json();
        allTasks   = data.tasks || [];
        renderTasks();
    } catch (err) {
        document.getElementById("task-list").innerHTML =
            '<p class="loading">Failed to load tasks.</p>';
    }
}


// ── Filter Tasks ──
function filterTasks(status, btn) {
    currentFilter = status;
    document.querySelectorAll(".filter-btn").forEach((b) => {
        b.classList.remove("active");
    });
    btn.classList.add("active");
    renderTasks();
}


// ── Render Task Cards ──
function renderTasks() {
    const list = document.getElementById("task-list");

    const filtered = currentFilter === "all"
        ? allTasks
        : allTasks.filter((t) => t.status === currentFilter);

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">◈</div>
                <p>No tasks found.</p>
            </div>`;
        return;
    }

    list.innerHTML = filtered.map((t) => `
        <div class="task-card ${t.status === "completed" ? "completed" : ""}">
            <div class="task-body">
                <div class="task-title">${escHtml(t.title)}</div>
                ${t.description
                    ? `<div class="task-desc">${escHtml(t.description)}</div>`
                    : ""}
                <div class="task-meta">
                    <span class="badge badge-priority-${t.priority}">
                        ${t.priority}
                    </span>
                    <span class="badge badge-status-${t.status}">
                        ${t.status.replace("_", " ")}
                    </span>
                    <span class="task-date">${formatDate(t.created_at)}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="icon-btn edit"
                    onclick="openEditModal(${t.id})" title="Edit">✎
                </button>
                <button class="icon-btn delete"
                    onclick="deleteTask(${t.id})" title="Delete">✕
                </button>
            </div>
        </div>`
    ).join("");
}


// ── Modal: Open for New Task ──
function openModal() {
    document.getElementById("modal-title").textContent = "New Task";
    document.getElementById("task-id").value           = "";
    document.getElementById("task-title").value        = "";
    document.getElementById("task-desc").value         = "";
    document.getElementById("task-priority").value     = "medium";
    document.getElementById("task-status").value       = "pending";
    document.getElementById("task-modal").classList.remove("hidden");
    document.getElementById("task-title").focus();
}


// ── Modal: Open for Editing ──
function openEditModal(id) {
    const task = allTasks.find((t) => t.id === id);
    if (!task) return;

    document.getElementById("modal-title").textContent = "Edit Task";
    document.getElementById("task-id").value           = task.id;
    document.getElementById("task-title").value        = task.title;
    document.getElementById("task-desc").value         = task.description || "";
    document.getElementById("task-priority").value     = task.priority;
    document.getElementById("task-status").value       = task.status;
    document.getElementById("task-modal").classList.remove("hidden");
}


// ── Modal: Close ──
function closeModal() {
    document.getElementById("task-modal").classList.add("hidden");
}


// ── Save Task (Add or Update) ──
async function saveTask() {
    const id    = document.getElementById("task-id").value;
    const title = document.getElementById("task-title").value.trim();

    if (!title) {
        alert("Title is required.");
        return;
    }

    const payload = {
        title,
        description: document.getElementById("task-desc").value.trim(),
        priority:    document.getElementById("task-priority").value,
        status:      document.getElementById("task-status").value,
    };

    const url    = id ? `/api/tasks/${id}` : "/api/tasks/";
    const method = id ? "PUT" : "POST";

    try {
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(payload),
        });

        if (!res.ok) {
            const err = await res.json();
            alert(err.error || "Failed to save task.");
            return;
        }

        closeModal();
        // WebSocket will update list automatically
        // Fallback reload after short delay
        setTimeout(loadTasks, 300);

    } catch (err) {
        alert("Network error. Please try again.");
    }
}


// ── Delete Task ──
async function deleteTask(id) {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
        await fetch(`/api/tasks/${id}`, { method: "DELETE" });
        // WebSocket will update list automatically
        setTimeout(loadTasks, 300);
    } catch (err) {
        alert("Failed to delete task.");
    }
}


// ── Load Analytics from API ──
async function loadAnalytics() {
    const container = document.getElementById("analytics-content");
    container.innerHTML = '<p class="loading">Loading analytics...</p>';

    try {
        const res = await fetch("/api/analytics/");
        const d   = await res.json();

        container.innerHTML = `
            <!-- Stat Cards -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Total Tasks</div>
                    <div class="stat-value accent">${d.total_tasks}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Completed</div>
                    <div class="stat-value success">${d.completed_tasks}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Pending</div>
                    <div class="stat-value warning">${d.pending_tasks}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">In Progress</div>
                    <div class="stat-value info">${d.in_progress_tasks}</div>
                </div>
            </div>

            <!-- Completion Progress Bar -->
            <div class="progress-card">
                <div class="progress-label">
                    <span>Completion Rate</span>
                    <span>${d.completion_percentage}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill"
                         style="width: ${d.completion_percentage}%">
                    </div>
                </div>
            </div>

            <!-- Priority Breakdown -->
            <h3 style="font-family:'Syne',sans-serif; margin-bottom:1rem;">
                Priority Breakdown
            </h3>
            <div class="priority-grid">
                <div class="priority-card low">
                    <div class="priority-count">${d.priority_breakdown.low}</div>
                    <div class="priority-name">Low</div>
                </div>
                <div class="priority-card med">
                    <div class="priority-count">${d.priority_breakdown.medium}</div>
                    <div class="priority-name">Medium</div>
                </div>
                <div class="priority-card high">
                    <div class="priority-count">${d.priority_breakdown.high}</div>
                    <div class="priority-name">High</div>
                </div>
            </div>

            <!-- Extra NumPy stat -->
            <p style="margin-top:1.5rem; color:var(--text-muted); font-size:.875rem;">
                Avg tasks created per day:
                <strong style="color:var(--text)">${d.avg_tasks_per_day}</strong>
            </p>`;

    } catch (err) {
        container.innerHTML = '<p class="loading">Failed to load analytics.</p>';
    }
}


// ── Helpers ──
function escHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
}

function formatDate(iso) {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day:   "numeric",
        year:  "numeric",
    });
}


// ── Event Listeners ──

// Close modal when clicking outside it
document.getElementById("task-modal").addEventListener("click", function (e) {
    if (e.target === this) closeModal();
});

// Submit on Enter key in title field
document.getElementById("task-title").addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveTask();
});


// ── Initialize ──
loadTasks();