def validate_company_data(data):
    errors = []

    if not data:
        errors.append("No data provided")
        return errors

    # Required fields
    if not data.get("company_name", "").strip():
        errors.append("company_name is required")

    # CTC validation
    if data.get("ctc") is not None:
        if not isinstance(data["ctc"], (int, float)):
            errors.append("ctc must be a number")
        elif data["ctc"] < 0:
            errors.append("ctc cannot be negative")

    # CGPA validation
    if data.get("cgpa_criteria") is not None:
        if not isinstance(data["cgpa_criteria"], (int, float)):
            errors.append("cgpa_criteria must be a number")
        elif not (0 <= data["cgpa_criteria"] <= 10):
            errors.append("cgpa_criteria must be between 0 and 10")

    # 10th criteria validation
    if data.get("tenth_criteria") is not None:
        if not isinstance(data["tenth_criteria"], (int, float)):
            errors.append("tenth_criteria must be a number")
        elif not (0 <= data["tenth_criteria"] <= 100):
            errors.append("tenth_criteria must be between 0 and 100")

    # 12th criteria validation  
    if data.get("twelfth_criteria") is not None:
        if not isinstance(data["twelfth_criteria"], (int, float)):
            errors.append("twelfth_criteria must be a number")
        elif not (0 <= data["twelfth_criteria"] <= 100):
            errors.append("twelfth_criteria must be between 0 and 100")

    # Status validation
    valid_statuses = ["Applied", "Interview", "Selected", "Rejected", "Pending"]
    if data.get("status") and data["status"] not in valid_statuses:
        errors.append(f"status must be one of {valid_statuses}")

    # Date format validation
    from datetime import datetime
    for date_field in ["deadline", "test_date", "interview_date"]:
        if data.get(date_field):
            try:
                datetime.strptime(data[date_field], "%Y-%m-%d")
            except ValueError:
                errors.append(f"{date_field} must be in YYYY-MM-DD format")

    return errors