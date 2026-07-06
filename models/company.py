from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Company(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    # Basic Info
    company_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(100), nullable=True)
    ctc = db.Column(db.Float, nullable=True)
    location = db.Column(db.String(100), nullable=True)
    apply_link = db.Column(db.String(255), nullable=True)

    # Eligibility
    cgpa_criteria = db.Column(db.Float, nullable=True)
    tenth_criteria = db.Column(db.Float, nullable=True)
    twelfth_criteria = db.Column(db.Float, nullable=True)
    backlog_allowed = db.Column(db.Boolean, default=True)
    eligibility_notes = db.Column(db.Text, nullable=True)

    # Important Dates
    deadline = db.Column(db.Date, nullable=True)
    test_date = db.Column(db.Date, nullable=True)
    interview_date = db.Column(db.Date, nullable=True)
    applied_date = db.Column(db.Date, default=datetime.utcnow)

    # Status & Notes
    status = db.Column(db.String(50), default="Applied")
    notes = db.Column(db.Text, nullable=True)
    required_skills = db.Column(db.Text, nullable=True)
    # User ownership
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    # Timestamps (નવું ઉમેરો)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


    def to_dict(self, profile=None):
        from utils.matching import calculate_matching_score
        return {
            "id": self.id,
            "user_id": self.user_id,
            "company_name": self.company_name,
            "role": self.role,
            "ctc": self.ctc,
            "location": self.location,
            "apply_link": self.apply_link,
            "cgpa_criteria": self.cgpa_criteria,
            "tenth_criteria": self.tenth_criteria,
            "twelfth_criteria": self.twelfth_criteria,
            "backlog_allowed": self.backlog_allowed,
            "eligibility_notes": self.eligibility_notes,
            "required_skills": self.required_skills,
            "deadline": self.deadline.strftime("%Y-%m-%d") if self.deadline else None,
            "test_date": self.test_date.strftime("%Y-%m-%d") if self.test_date else None,
            "interview_date": self.interview_date.strftime("%Y-%m-%d") if self.interview_date else None,
            "applied_date": self.applied_date.strftime("%Y-%m-%d") if self.applied_date else None,
            "status": self.status,
            "notes": self.notes,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M") if self.created_at else None,
            "updated_at": self.updated_at.strftime("%Y-%m-%d %H:%M") if self.updated_at else None,
            "matching_score": calculate_matching_score(profile, self) if profile else None
        }