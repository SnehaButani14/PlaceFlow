from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_user, logout_user, login_required, current_user
from models.user import User, StudentProfile
from models.company import db

views = Blueprint('views' , '__name__')

@views.route('/')
def dashboard():
    if not current_user.is_authenticated:
        return render_template('landing.html')
    return render_template('dashboard.html')

@views.route('/add')
@login_required
def add_company():
    return render_template('add.html')

@views.route('/edit/<int:id>')
@login_required
def update_company(id):
    return render_template('edit.html' , company_id = id)

@views.route('/company/<int:id>')
@login_required
def company_details(id):
    return render_template('details.html' , company_id = id)

@views.route('/signup', methods=['GET', 'POST'])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for('views.dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '').strip()
        
        # Profile fields
        full_name = request.form.get('full_name', '').strip()
        cgpa_str = request.form.get('cgpa', '').strip()
        tenth_str = request.form.get('tenth_percentage', '').strip()
        twelfth_str = request.form.get('twelfth_percentage', '').strip()
        backlog_str = request.form.get('backlog_count', '').strip()
        skills = request.form.get('skills', '').strip()
        preferred_roles = request.form.get('preferred_roles', '').strip()
        location_preference = request.form.get('location_preference', '').strip()

        if not username or not email or not password:
            flash('Username, email, and password are required!', 'danger')
            return render_template('signup.html')

        if User.query.filter_by(username=username).first():
            flash('Username already exists!', 'danger')
            return render_template('signup.html')

        if User.query.filter_by(email=email).first():
            flash('Email already registered!', 'danger')
            return render_template('signup.html')

        try:
            cgpa = float(cgpa_str) if cgpa_str else None
        except ValueError:
            flash('CGPA must be a valid number.', 'danger')
            return render_template('signup.html')

        try:
            tenth_percentage = float(tenth_str) if tenth_str else None
        except ValueError:
            flash('10th percentage must be a number.', 'danger')
            return render_template('signup.html')

        try:
            twelfth_percentage = float(twelfth_str) if twelfth_str else None
        except ValueError:
            flash('12th percentage must be a number.', 'danger')
            return render_template('signup.html')

        try:
            backlog_count = int(backlog_str) if backlog_str else 0
        except ValueError:
            flash('Backlog count must be an integer.', 'danger')
            return render_template('signup.html')

        new_user = User(username=username, email=email)
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.flush()
        
        # Create student profile
        profile = StudentProfile(
            user_id=new_user.id,
            full_name=full_name,
            cgpa=cgpa,
            tenth_percentage=tenth_percentage,
            twelfth_percentage=twelfth_percentage,
            backlog_count=backlog_count,
            skills=skills,
            preferred_roles=preferred_roles,
            location_preference=location_preference
        )
        db.session.add(profile)
        db.session.commit()
        
        login_user(new_user)
        flash('Registration successful! Welcome to PlaceFlow.', 'success')
        return redirect(url_for('views.dashboard'))
        
    return render_template('signup.html')

@views.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('views.dashboard'))
        
    if request.method == 'POST':
        username_or_email = request.form.get('username_or_email', '').strip()
        password = request.form.get('password', '').strip()
        
        if not username_or_email or not password:
            flash('Both fields are required!', 'danger')
            return render_template('login.html')
            
        user = User.query.filter((User.username == username_or_email) | (User.email == username_or_email)).first()
        
        if user and user.check_password(password):
            login_user(user)
            flash('Logged in successfully!', 'success')
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('views.dashboard'))
        else:
            flash('Invalid username/email or password.', 'danger')
            
    return render_template('login.html')

@views.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Logged out successfully.', 'info')
    return redirect(url_for('views.login'))

@views.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    profile = current_user.profile
    if not profile:
        profile = StudentProfile(user_id=current_user.id)
        db.session.add(profile)
        db.session.commit()

    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        full_name = request.form.get('full_name', '').strip()
        cgpa_str = request.form.get('cgpa', '').strip()
        tenth_str = request.form.get('tenth_percentage', '').strip()
        twelfth_str = request.form.get('twelfth_percentage', '').strip()
        backlog_str = request.form.get('backlog_count', '').strip()
        skills = request.form.get('skills', '').strip()
        preferred_roles = request.form.get('preferred_roles', '').strip()
        location_preference = request.form.get('location_preference', '').strip()

        if email != current_user.email:
            existing_email = User.query.filter_by(email=email).first()
            if existing_email:
                flash('Email already in use by another account.', 'danger')
                return render_template('profile.html', user=current_user, profile=profile)
            current_user.email = email

        try:
            profile.cgpa = float(cgpa_str) if cgpa_str else None
        except ValueError:
            flash('CGPA must be a number.', 'danger')
            return render_template('profile.html', user=current_user, profile=profile)

        try:
            profile.tenth_percentage = float(tenth_str) if tenth_str else None
        except ValueError:
            flash('10th percentage must be a number.', 'danger')
            return render_template('profile.html', user=current_user, profile=profile)

        try:
            profile.twelfth_percentage = float(twelfth_str) if twelfth_str else None
        except ValueError:
            flash('12th percentage must be a number.', 'danger')
            return render_template('profile.html', user=current_user, profile=profile)

        try:
            profile.backlog_count = int(backlog_str) if backlog_str else 0
        except ValueError:
            flash('Backlog count must be an integer.', 'danger')
            return render_template('profile.html', user=current_user, profile=profile)

        profile.full_name = full_name
        profile.skills = skills
        profile.preferred_roles = preferred_roles
        profile.location_preference = location_preference
        
        db.session.commit()
        flash('Profile updated successfully!', 'success')
        return redirect(url_for('views.profile'))

    return render_template('profile.html', user=current_user, profile=profile)







