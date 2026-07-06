def calculate_matching_score(profile, company):
    """
    Calculates a rule-based matching score (0-100) between a student profile and a company.
    
    Academics = 50 marks
    - CGPA criteria match: 20
    - 10th percentage match: 10
    - 12th percentage match: 10
    - Backlog eligibility match: 10
    
    Skills = 40 marks
    - Compare student skills with company required skills.
    - Calculate skill match percentage.
    - Convert to 40 marks.
    
    Role Preference = 10 marks
    - If company role matches user's preferred roles, give 10.
    - Partial match can give 5.
    """
    if not profile:
        return {
            "percentage": 0,
            "level": "Low Match",
            "recommendation": "Please complete your student profile to view matching percentage.",
            "academics_score": 0,
            "skills_score": 0,
            "role_score": 0
        }

    # 1. Academics (50 marks total)
    failed_criteria = []

    # CGPA Check
    if company.cgpa_criteria is not None and company.cgpa_criteria > 0:
        if profile.cgpa is None or profile.cgpa < company.cgpa_criteria:
            failed_criteria.append("CGPA criteria")

    # 10th Percentage Check
    if company.tenth_criteria is not None and company.tenth_criteria > 0:
        if profile.tenth_percentage is None or profile.tenth_percentage < company.tenth_criteria:
            failed_criteria.append("10th % criteria")

    # 12th Percentage Check
    if company.twelfth_criteria is not None and company.twelfth_criteria > 0:
        if profile.twelfth_percentage is None or profile.twelfth_percentage < company.twelfth_criteria:
            failed_criteria.append("12th % criteria")

    # Backlog Check
    if company.backlog_allowed is False:
        if profile.backlog_count is not None and profile.backlog_count > 0:
            failed_criteria.append("No backlog criteria")

    is_eligible = len(failed_criteria) == 0
    academics_score = 50 if is_eligible else 0

    # 2. Skills (40 marks total)
    skills_score = 0
    company_skills = []
    if company.required_skills:
        company_skills = [s.strip().lower() for s in company.required_skills.split(",") if s.strip()]

    if not company_skills:
        # If company does not specify any required skills, student gets full marks (100% skill match)
        skills_score = 40
    else:
        student_skills = set()
        if profile.skills:
            student_skills = {s.strip().lower() for s in profile.skills.split(",") if s.strip()}
        
        matched_skills = [s for s in company_skills if s in student_skills]
        match_ratio = len(matched_skills) / len(company_skills)
        skills_score = int(round(40 * match_ratio))

    # 3. Role Preference (10 marks total)
    role_score = 0
    if company.role and profile.preferred_roles:
        comp_role = company.role.strip().lower()
        pref_roles = [r.strip().lower() for r in profile.preferred_roles.split(",") if r.strip()]
        
        if comp_role in pref_roles:
            role_score = 10
        else:
            # Check for partial match (substring presence)
            partial = False
            for p in pref_roles:
                if p in comp_role or comp_role in p:
                    partial = True
                    break
            if partial:
                role_score = 5

    total_score = academics_score + skills_score + role_score

    # Determine match level and recommendation
    if not is_eligible:
        level = "Not Eligible"
        recommendation = f"Not eligible to apply (Criteria mismatched: {', '.join(failed_criteria)})"
    elif total_score >= 80:
        level = "Strong Match"
        recommendation = "Apply confidently"
    elif total_score >= 60:
        level = "Good Match"
        recommendation = "Apply and revise weak areas"
    elif total_score >= 40:
        level = "Needs Preparation"
        recommendation = "Prepare before applying"
    else:
        level = "Low Match"
        recommendation = "Consider skipping unless interested"

    return {
        "percentage": total_score,
        "level": level,
        "recommendation": recommendation,
        "academics_score": academics_score,
        "skills_score": skills_score,
        "role_score": role_score
    }
