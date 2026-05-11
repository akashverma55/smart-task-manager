from .auth import auth_bp
from .tasks import tasks_bp
from .analytics import analytics_bp
from .views import views_bp

def register_blueprints(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(views_bp)