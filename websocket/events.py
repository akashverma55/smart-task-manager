from flask_socketio import join_room, emit
from flask_login import current_user


def register_events(socketio):

    @socketio.on("connect")
    def on_connect():
        if current_user.is_authenticated:
            join_room(str(current_user.id))
            emit("connected", {
                "message": f"Welcome {current_user.username}! Live updates are enabled."
            })

    @socketio.on("disconnect")
    def on_disconnect():
        pass

    @socketio.on("ping_server")
    def on_ping():
        emit("pong_server", {"status": "ok"})