from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from models.company import db

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    profile = db.relationship('StudentProfile', backref='user', uselist=False, cascade="all, delete-orphan")
    companies = db.relationship('Company', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class StudentProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True, nullable=False)
    
    # Profile Fields
    full_name = db.Column(db.String(100), nullable=True)
    cgpa = db.Column(db.Float, nullable=True)
    tenth_percentage = db.Column(db.Float, nullable=True)
    twelfth_percentage = db.Column(db.Float, nullable=True)
    backlog_count = db.Column(db.Integer, default=0)
    skills = db.Column(db.Text, nullable=True)  # Store as comma-separated text
    preferred_roles = db.Column(db.String(255), nullable=True)
    location_preference = db.Column(db.String(255), nullable=True)
