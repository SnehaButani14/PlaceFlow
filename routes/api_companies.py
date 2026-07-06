from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from models.company import db, Company
from utils.validation import validate_company_data
from datetime import datetime
import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables and configure Gemini API
load_dotenv()
gemini_key = os.getenv("GEMINI_API_KEY")
if gemini_key:
    genai.configure(api_key=gemini_key)

api_companies = Blueprint('api_companies', __name__)

@api_companies.route('/api/companies', methods=['GET'])
@login_required
def get_companies():
    status = request.args.get('status')
    search = request.args.get('search')
    min_ctc = request.args.get('min_ctc' , type=float)
    max_cgpa = request.args.get('max_cgpa' , type=float)

    query = Company.query.filter_by(user_id=current_user.id)

    if status:
        query = query.filter_by(status = status)

    if search:
        query = query.filter(
            Company.company_name.ilike(f'%{search}%')
        )

    if min_ctc:
        query = query.filter(Company.ctc >= min_ctc)
    
    if max_cgpa:
        query = query.filter(Company.ctc <= max_cgpa)

    companies = query.all()

    profile = current_user.profile
    return jsonify([c.to_dict(profile=profile) for c in companies]), 200


@api_companies.route('/api/companies', methods=['POST'])
@login_required
def add_companies():
    data = request.get_json()

    errors = validate_company_data(data)

    if errors:
        return jsonify({"errors": errors}), 400

    new_company = Company(
        user_id=current_user.id,
        company_name=data.get("company_name"),
        role=data.get("role"),
        ctc=data.get("ctc"),
        location=data.get("location"),
        apply_link=data.get("apply_link"),
        cgpa_criteria=data.get("cgpa_criteria"),
        tenth_criteria=data.get("tenth_criteria"),
        twelfth_criteria=data.get("twelfth_criteria"),
        backlog_allowed=data.get("backlog_allowed", True),
        eligibility_notes=data.get("eligibility_notes"),
        required_skills=data.get("required_skills"),
        deadline=datetime.strptime(data["deadline"], "%Y-%m-%d").date() if data.get("deadline") else None,
        test_date=datetime.strptime(data["test_date"], "%Y-%m-%d").date() if data.get("test_date") else None,
        interview_date=datetime.strptime(data["interview_date"], "%Y-%m-%d").date() if data.get("interview_date") else None,
        status=data.get("status") or "Applied",
        notes=data.get("notes")
    )
    
    db.session.add(new_company)
    db.session.commit()

    return jsonify(new_company.to_dict(profile=current_user.profile)), 201

@api_companies.route('/api/companies/<int:id>', methods=['GET'])
@login_required
def get_company(id):
    company = db.session.get(Company, id)

    if not company or company.user_id != current_user.id:
        return jsonify({"error": "Company not found!"}), 404

    return jsonify(company.to_dict(profile=current_user.profile)), 200

@api_companies.route('/api/companies/<int:id>', methods=['PUT'])
@login_required
def update_company(id):
    company = db.session.get(Company, id)

    if not company or company.user_id != current_user.id:
        return jsonify({"error": "No company found!"}), 404

    data = request.get_json()
    errors = validate_company_data(data)

    if errors:
        return jsonify({"errors": errors}), 400

    company.company_name = data.get("company_name", company.company_name)
    company.role = data.get("role", company.role)
    company.ctc = data.get("ctc", company.ctc)
    company.location = data.get("location", company.location)
    company.status = data.get("status") or company.status
    company.notes = data.get("notes", company.notes)
    company.cgpa_criteria = data.get("cgpa_criteria", company.cgpa_criteria)
    company.tenth_criteria = data.get("tenth_criteria", company.tenth_criteria)
    company.twelfth_criteria = data.get("twelfth_criteria", company.twelfth_criteria)
    company.backlog_allowed = data.get("backlog_allowed", company.backlog_allowed)
    company.eligibility_notes = data.get("eligibility_notes", company.eligibility_notes)
    company.required_skills = data.get("required_skills", company.required_skills)
    company.apply_link = data.get("apply_link", company.apply_link)
    company.deadline = datetime.strptime(data["deadline"], "%Y-%m-%d").date() if data.get("deadline") else company.deadline
    company.apply_link = data.get("apply_link", company.apply_link)
    company.test_date = datetime.strptime(data["test_date"], "%Y-%m-%d").date() if data.get("test_date") else company.test_date
    company.interview_date = datetime.strptime(data["interview_date"], "%Y-%m-%d").date() if data.get("interview_date") else company.interview_date

    db.session.commit()

    return jsonify(company.to_dict(profile=current_user.profile)), 200


@api_companies.route('/api/companies/<int:id>', methods=['DELETE'])
@login_required
def delete_company(id):
    company = db.session.get(Company, id)

    if not company or company.user_id != current_user.id:
        return jsonify({"error": "Company not found!"}), 404

    db.session.delete(company)
    db.session.commit()

    return jsonify({"message": "Company deleted successfully!"}), 200


@api_companies.route('/api/dashboard' , methods = ['GET'])
@login_required
def dashboard():

    total = Company.query.filter_by(user_id=current_user.id).count()
    applied = Company.query.filter_by(status = "Applied", user_id=current_user.id).count()
    interview  = Company.query.filter_by(status = "Interview", user_id=current_user.id).count()
    selected  = Company.query.filter_by(status = "Selected", user_id=current_user.id).count()
    rejected  = Company.query.filter_by(status = "Rejected", user_id=current_user.id).count()
    pending  = Company.query.filter_by(status = "Pending", user_id=current_user.id).count()

    return jsonify({
        "total" : total,
        "applied" : applied,
        "interview" : interview,
        "selected" : selected,
        "rejected" : rejected,
        "pending" : pending
    }) , 200

@api_companies.route('/api/generate-interview-questions', methods=['POST'])
@login_required
def generate_interview_questions():
    # 1. Handle missing key check
    if not os.getenv("GEMINI_API_KEY"):
        return jsonify({"error": "Gemini API key is not configured in .env file."}), 500

    data = request.get_json() or {}
    company = data.get("company", "").strip()
    role = data.get("role", "").strip()
    ctc = data.get("ctc")
    status = data.get("status", "").strip()

    # Rename "Processing" back to "Pending" for prompt if status is Processing
    if status == "Processing":
        status = "Pending"

    # Validation
    if not company:
        return jsonify({"error": "Company name is required."}), 400
    if not role:
        return jsonify({"error": "Job role is required."}), 400

    # Format CTC display string
    ctc_str = f"{ctc}" if ctc else "Not specified"

    # Format prompt to request a JSON response matching the required schema
    prompt = f"""You are an expert technical interviewer and placement mentor.
Generate realistic interview preparation questions and a candidate readiness evaluation for a student placement candidate.

Company: {company}
Role: {role}
CTC: {ctc_str} LPA
Application Status: {status}

Estimate the candidate's hypothetical readiness score (between 0 and 100) based on the application status and package requirements, and provide a list of candidate strengths and focus areas to review.

Return your response as a JSON object matching this schema:
{{
  "difficulty_level": "Easy" | "Medium" | "Hard",
  "readiness_score": integer (between 0 and 100),
  "strengths": [string],
  "focus_areas": [string],
  "technical_questions": [
    {{
      "question": "Technical question text here",
      "answer": "Detailed sample answer for this technical question"
    }}
  ],
  "hr_questions": [
    {{
      "question": "HR question text here",
      "answer": "Detailed sample answer for this HR question"
    }}
  ],
  "project_questions": [
    {{
      "question": "Project-based question text here",
      "answer": "Detailed sample answer for this project-based question"
    }}
  ],
  "topics_to_revise": [string],
  "preparation_advice": [string]
}}

Generate exactly 5 technical questions, 3 HR questions, 3 project questions, 5 revision topics, and 2 advice items. Ensure all fields are populated."""

    try:
        # Configure again in case env was loaded after blueprint import
        gemini_key = os.getenv("GEMINI_API_KEY")
        if gemini_key:
            genai.configure(api_key=gemini_key)
            
        # Use gemini-2.5-flash for question generation with application/json mime type
        model = genai.GenerativeModel(
            "gemini-2.5-flash",
            generation_config={"response_mime_type": "application/json"}
        )
        response = model.generate_content(prompt)
        
        if not response or not response.text:
            return jsonify({"error": "Gemini API returned an empty response."}), 502
            
        # Try loading the response text to verify it is valid JSON
        import json
        try:
            questions_json = json.loads(response.text)
            return jsonify({"questions": questions_json}), 200
        except json.JSONDecodeError:
            # Fallback if raw text
            return jsonify({"questions": response.text, "is_raw": True}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to generate questions: {str(e)}"}), 500


@api_companies.route('/api/explain-match', methods=['POST'])
@login_required
def explain_match():
    if not os.getenv("GEMINI_API_KEY"):
        return jsonify({"error": "Gemini API key is not configured in .env file."}), 500
        
    data = request.get_json() or {}
    company_id = data.get("company_id")
    
    if not company_id:
        return jsonify({"error": "Company ID is required."}), 400
        
    company = db.session.get(Company, company_id)
    if not company or company.user_id != current_user.id:
        return jsonify({"error": "Company not found."}), 404
        
    profile = current_user.profile
    if not profile:
        return jsonify({"error": "Please complete your student profile first."}), 400
        
    from utils.matching import calculate_matching_score
    match = calculate_matching_score(profile, company)
    
    prompt = f"""You are an AI placement preparation assistant.

Analyze this student-company match.

Student Profile:
CGPA: {profile.cgpa if profile.cgpa is not None else 'N/A'}
10th Percentage: {profile.tenth_percentage if profile.tenth_percentage is not None else 'N/A'}
12th Percentage: {profile.twelfth_percentage if profile.twelfth_percentage is not None else 'N/A'}
Backlogs: {profile.backlog_count if profile.backlog_count is not None else 0}
Skills: {profile.skills if profile.skills else 'None listed'}
Preferred Roles: {profile.preferred_roles if profile.preferred_roles else 'None listed'}

Company:
Company Name: {company.company_name}
Role: {company.role if company.role else 'N/A'}
CTC: {company.ctc if company.ctc is not None else 'N/A'} LPA
CGPA Criteria: {company.cgpa_criteria if company.cgpa_criteria is not None else 'No Criteria'}
10th Criteria: {company.tenth_criteria if company.tenth_criteria is not None else 'No Criteria'}
12th Criteria: {company.twelfth_criteria if company.twelfth_criteria is not None else 'No Criteria'}
Backlog Allowed: {"Yes" if company.backlog_allowed else "No"}
Required Skills: {company.required_skills if company.required_skills else 'None specified'}

Rule-Based Match:
Match Percentage: {match["percentage"]}%
Match Level: {match["level"]}
Recommendation: {match["recommendation"]}

IMPORTANT CONTEXT ON ELIGIBILITY:
If the Rule-Based Match Level is "Not Eligible", it means the student has FAILED one or more hard academic criteria (CGPA, 10th %, 12th %, or backlogs allowed).
You MUST clearly and explicitly declare in both the "Short Summary" and the "Final Advice" sections that the student is NOT ELIGIBLE to apply. Do not give any false hope of applying for this specific position; state clearly which criteria failed. However, keep the "Preparation Topics" and "7-Day Preparation Plan" constructive to help them prepare for similar roles elsewhere.

Return output in this format:

Short Summary:
[Write a short summary explanation here. If ineligible, explicitly state that they are not eligible to apply and list the failed criteria.]

Weak Areas:
[List any weak areas or mismatched criteria here]

Preparation Topics:
[List specific topics the student should revise/study]

7-Day Preparation Plan:
[Provide a step-by-step 7-day plan]

Final Advice:
[Give practical advice. If ineligible, clearly advise them to prepare for other roles instead of trying to apply for this one.]

Keep the answer practical, direct, and formatted in clean Markdown for a college student."""

    try:
        # Configure again in case env was loaded after blueprint import
        gemini_key = os.getenv("GEMINI_API_KEY")
        if gemini_key:
            genai.configure(api_key=gemini_key)
            
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        
        if not response or not response.text:
            return jsonify({"error": "Gemini API returned an empty response."}), 502
            
        return jsonify({"explanation": response.text}), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to generate explanation: {str(e)}"}), 500

