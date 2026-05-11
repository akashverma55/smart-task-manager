from flask import Flask
from extensions import db, login_manager, socketio
from config import Config
from models import User
from api import register_blueprints
from websocket import register_events


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    login_manager.init_app(app)
    socketio.init_app(app)

    login_manager.login_view = 'auth.login'
    login_manager.login_message = "Please log in to continue"
    login_manager.login_message_category = "info"


    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    register_blueprints(app)
    register_events(socketio)

    with app.app_context():
        db.create_all()

    return app

if __name__ == '__main__':
    app = create_app()
    socketio.run(app, debug=True, host="0.0.0.0", port=5000)