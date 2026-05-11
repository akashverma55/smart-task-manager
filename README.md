# TaskFlow — Smart Task Management System

## Tech Stack
| Layer | Technology |
|---|---|
| Backend | Python, Flask |
| Database | PostgreSQL + SQLAlchemy |
| Auth | Flask-Login |
| REST API | Flask Blueprints |
| Analytics | Pandas + NumPy |
| WebSockets | Flask-SocketIO |
| Frontend | HTML, CSS, Vanilla JS |

---

## Setup Instructions

### 1. Clone the repository
git clone <your-repo-url>
cd taskmanager

### 2. Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

### 3. Install dependencies
pip install -r requirements.txt

### 4. Create the database
Open pgAdmin and run:
CREATE DATABASE taskmanager;

### 5. Configure environment
Copy .env.example to .env and update:
SECRET_KEY=your-random-secret-key
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/taskmanager

### 6. Run the app
python app.py

Open http://localhost:5000 in your browser.
Tables are created automatically on first run.

---

## API Endpoints

| Method | URL | Description |
|---|---|---|
| POST | /register | Register user |
| POST | /login | Login |
| GET | /logout | Logout |
| GET | /api/tasks/ | Get all tasks |
| POST | /api/tasks/ | Create task |
| PUT | /api/tasks/<id> | Update task |
| DELETE | /api/tasks/<id> | Delete task |
| GET | /api/analytics/ | Get analytics |

---

## Project Structure

```
taskmanager/
├── app.py
├── config.py
├── extensions.py
├── requirements.txt
├── schema.sql
├── .env.example
├── .gitignore
├── README.md
│
├── models/
│   ├── __init__.py
│   ├── user.py
│   └── task.py
│
├── api/
│   ├── __init__.py
│   ├── auth.py
│   ├── tasks.py
│   ├── analytics.py
│   └── views.py
│
├── websocket/
│   ├── __init__.py
│   └── events.py
│
├── templates/
│   ├── base.html
│   ├── login.html
│   ├── register.html
│   └── dashboard.html
│
└── static/
    ├── css/
    │   └── style.css
    └── js/
        └── dashboard.js
```