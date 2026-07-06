from flask import Flask
from flask_login import LoginManager
from routes.api_companies import api_companies
from config import Config
from models.company import db
from models.user import User
from flask_migrate import Migrate
from routes.views import views

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
migrate = Migrate(app , db)

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.login_view = 'views.login'
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

app.register_blueprint(api_companies)
app.register_blueprint(views)

if __name__ == '__main__':
    app.run(debug=True)


