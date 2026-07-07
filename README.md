# PlaceFlow

### Your Personal Placement Tracker

Track applications, monitor interview progress, analyze company matches, and stay placement-ready from a single dashboard.

---

## Overview

PlaceFlow is a Flask-based placement management platform that helps students organize and track their placement journey.

The platform enables students to:

* Manage company applications
* Track interview progress
* Monitor placement status
* Analyze profile-company compatibility
* Prepare for interviews using AI-assisted guidance
* Keep placement-related information centralized

---

## Features

### Authentication

* Secure student registration
* Login and logout functionality
* Protected routes

### Placement Tracking

* Add company applications
* View all applications
* Edit company details
* Delete applications
* Track application status

### Company Management

* Company information storage
* Role and package tracking
* Deadline management
* Required skills tracking

### Profile Matching

* Profile-company compatibility analysis
* Match score generation
* Skill gap identification

### Dashboard

* Placement statistics
* Application tracking
* Interview progress overview
* Placement insights

### AI Interview Assistant

* Interview preparation support
* Company-specific guidance
* Placement readiness assistance

---

## Technology Stack

### Backend

* Flask
* Flask-SQLAlchemy
* Flask-Migrate
* Flask-Login

### Database

* SQLite

### Frontend

* HTML5
* CSS3
* JavaScript
* Bootstrap

### Other Tools

* Alembic Migrations

---

## Project Structure

```text
app.py
config.py

models/
├── company.py
├── user.py

routes/
├── views.py
├── api_companies.py

utils/
├── matching.py
├── validation.py

templates/
static/

migrations/
```

---

## Installation

### Clone Repository

```bash
git clone <repository-url>
cd placeflow
```

### Create Virtual Environment

```bash
python -m venv venv
```

### Activate Environment

Windows:

```bash
venv\Scripts\activate
```

Linux/Mac:

```bash
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run Migrations

```bash
flask db upgrade
```

### Start Application

```bash
flask run
```

---

## Author

Built as a placement management platform using Flask and SQLite.
