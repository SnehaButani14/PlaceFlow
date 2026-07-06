// ===== GLOBAL STATE =====
let allCompanies = [];

// ===== DASHBOARD =====
async function loadDashboard() {
    await loadCompanies();
}

async function loadStats() {
    const response = await fetch('/api/dashboard');
    const data = await response.json();

    document.getElementById('stats-row').innerHTML = `
        <div class="col-md-2 mb-3">
            <div class="card text-center stat-card h-100 border-0 shadow-sm" 
                 onclick="filterByStatus('', this)" data-status="" title="Show All">
                <div class="card-body py-3">
                    <h3 class="fw-bold text-dark mb-1">${data.total}</h3>
                    <p class="mb-0 text-muted small fw-semibold text-uppercase" style="font-size: 0.72rem; letter-spacing: 0.05em;">Total</p>
                </div>
            </div>
        </div>
        <div class="col-md-2 mb-3">
            <div class="card text-center stat-card h-100 border-0 shadow-sm" 
                 onclick="filterByStatus('Applied', this)" data-status="Applied" title="Show Applied">
                <div class="card-body py-3">
                    <h3 class="fw-bold text-primary mb-1">${data.applied}</h3>
                    <p class="mb-0 text-muted small fw-semibold text-uppercase" style="font-size: 0.72rem; letter-spacing: 0.05em;">Applied</p>
                </div>
            </div>
        </div>
        <div class="col-md-2 mb-3">
            <div class="card text-center stat-card h-100 border-0 shadow-sm" 
                 onclick="filterByStatus('Interview', this)" data-status="Interview" title="Show Interview">
                <div class="card-body py-3">
                    <h3 class="fw-bold text-deadline-orange mb-1">${data.interview}</h3>
                    <p class="mb-0 text-muted small fw-semibold text-uppercase" style="font-size: 0.72rem; letter-spacing: 0.05em;">Interview</p>
                </div>
            </div>
        </div>
        <div class="col-md-2 mb-3">
            <div class="card text-center stat-card h-100 border-0 shadow-sm" 
                 onclick="filterByStatus('Selected', this)" data-status="Selected" title="Show Selected">
                <div class="card-body py-3">
                    <h3 class="fw-bold text-deadline-green mb-1">${data.selected}</h3>
                    <p class="mb-0 text-muted small fw-semibold text-uppercase" style="font-size: 0.72rem; letter-spacing: 0.05em;">Selected</p>
                </div>
            </div>
        </div>
        <div class="col-md-2 mb-3">
            <div class="card text-center stat-card h-100 border-0 shadow-sm" 
                 onclick="filterByStatus('Rejected', this)" data-status="Rejected" title="Show Rejected">
                <div class="card-body py-3">
                    <h3 class="fw-bold text-deadline-red mb-1">${data.rejected}</h3>
                    <p class="mb-0 text-muted small fw-semibold text-uppercase" style="font-size: 0.72rem; letter-spacing: 0.05em;">Rejected</p>
                </div>
            </div>
        </div>
        <div class="col-md-2 mb-3">
            <div class="card text-center stat-card h-100 border-0 shadow-sm" 
                 onclick="filterByStatus('Pending', this)" data-status="Pending" title="Show Processing">
                <div class="card-body py-3">
                    <h3 class="fw-bold text-secondary mb-1">${data.pending}</h3>
                    <p class="mb-0 text-muted small fw-semibold text-uppercase" style="font-size: 0.72rem; letter-spacing: 0.05em;">Processing</p>
                </div>
            </div>
        </div>
    `;

    renderInsights(data);
}

async function loadCompanies() {
    // Spinner show, table hide
    document.getElementById('loading-spinner').style.display = 'block';
    document.getElementById('table-container').style.display = 'none';

    const response = await fetch('/api/companies');
    allCompanies = await response.json();

    // Spinner hide
    document.getElementById('loading-spinner').style.display = 'none';

    const emptyState = document.getElementById('empty-state');
    const statsRow = document.getElementById('stats-row');
    const insightsCard = document.getElementById('insights-card');
    const mainContainer = document.getElementById('dashboard-main-container');

    if (emptyState) emptyState.style.display = 'none';
    if (statsRow) statsRow.style.display = 'flex';
    if (insightsCard) insightsCard.style.display = 'block';
    if (mainContainer) mainContainer.style.display = 'block';
    
    document.getElementById('table-container').style.display = 'block';

    await loadStats();
    renderTable(allCompanies);
    setupFilters();
    populateAICompanyDropdown();
    renderUpcomingInterviews();
}

// ===== ROW CLICK HANDLER =====
function handleRowClick(event, id) {
    if (event.target.closest('.dropdown') || event.target.closest('a') || event.target.closest('button')) {
        return;
    }
    showDetail(id);
}

// ===== RENDER MATCH SCORE =====
function getMatchDisplay(match) {
    if (!match) return '<span class="text-muted">-</span>';
    
    let badgeClass = 'bg-danger';
    let pBarClass = 'bg-danger';
    
    if (match.level === 'Strong Match') {
        badgeClass = 'bg-success';
        pBarClass = 'bg-success';
    } else if (match.level === 'Good Match') {
        badgeClass = 'bg-primary';
        pBarClass = 'bg-primary';
    } else if (match.level === 'Needs Preparation') {
        badgeClass = 'bg-warning text-dark';
        pBarClass = 'bg-warning';
    }
    
    return `
        <div class="d-flex flex-column" style="width: 130px;" title="${match.recommendation}">
            <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="fw-bold small text-dark" style="font-size: 0.8rem;">${match.percentage}%</span>
                <span class="badge rounded-pill ${badgeClass}" style="font-size: 0.65rem; padding: 0.25em 0.5em;">${match.level}</span>
            </div>
            <div class="progress" style="height: 6px; background-color: #E2E8F0; border-radius: 3px;">
                <div class="progress-bar ${pBarClass}" role="progressbar" style="width: ${match.percentage}%" aria-valuenow="${match.percentage}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
        </div>
    `;
}

// ===== RENDER TABLE =====
function renderTable(companies) {
    const tbody = document.getElementById('companies-table');
    const countDiv = document.getElementById('result-count');

    countDiv.textContent = `Showing ${companies.length} compan${companies.length === 1 ? 'y' : 'ies'}`;

    if (companies.length === 0) {
        const isFiltering = 
            document.getElementById('search-input').value !== '' ||
            document.getElementById('filter-status').value !== '' ||
            document.getElementById('filter-min-ctc').value !== '' ||
            document.getElementById('filter-max-ctc').value !== '' ||
            document.getElementById('filter-my-cgpa').value !== '' ||
            document.getElementById('filter-my-tenth').value !== '' ||
            document.getElementById('filter-my-twelfth').value !== '' ||
            document.getElementById('filter-backlog').value !== '';

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    ${isFiltering 
                        ? '🔍 No companies match your filters. <button class="btn btn-sm btn-outline-secondary ms-2" onclick="clearFilters()">Clear Filters</button>' 
                        : '📭 No companies added yet. <a href="/add">Add your first company!</a>'
                    }
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = companies.map(c => `
        <tr style="cursor:pointer" onclick="handleRowClick(event, ${c.id})">
            <td><strong>${c.company_name}</strong></td>
            <td>${c.role || '-'}</td>
            <td>${c.ctc ? c.ctc + ' LPA' : '-'}</td>
            <td>${getMatchDisplay(c.matching_score)}</td>
            <td>${getDeadlineDisplay(c.deadline)}</td>
            <td>${getStatusBadge(c.status)}</td>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <a href="/company/${c.id}" class="btn btn-sm btn-outline-secondary">Details</a>
                    <div class="dropdown">
                        <button class="btn-action-trigger" type="button" data-bs-toggle="dropdown" data-bs-boundary="viewport" aria-expanded="false">
                             ⋮
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">
                            <li><a class="dropdown-item py-2" href="/edit/${c.id}">✏️ Edit</a></li>
                            <li><hr class="dropdown-divider my-1"></li>
                            <li><button class="dropdown-item text-danger py-2" onclick="deleteCompany(${c.id})">🗑️ Delete</button></li>
                        </ul>
                    </div>
                </div>
            </td>
        </tr>
    `).join('');
}

// ===== DEADLINE DISPLAY =====
function getDeadlineDisplay(deadline) {
    if (!deadline) return '-';

    const parts = deadline.split('-');
    const deadlineDate = new Date(parts[0], parts[1] - 1, parts[2]);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);

    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return `<span class="text-deadline-red fw-semibold">${deadline} (Expired)</span>`;
    } else if (diffDays <= 30) {
        const daysText = diffDays === 1 ? '1 day left' : `${diffDays} days left`;
        return `<span class="text-deadline-orange fw-semibold">${deadline} (${daysText})</span>`;
    } else {
        return `<span class="text-deadline-green fw-semibold">${deadline} (${diffDays} days left)</span>`;
    }
}

// ===== INSIGHTS DISPLAY =====
function renderInsights(data) {
    const total = data.total;
    const interviewRate = total > 0 ? ((data.interview / total) * 100).toFixed(1) : '0.0';
    const successRate = total > 0 ? ((data.selected / total) * 100).toFixed(1) : '0.0';
    const selectionRate = total > 0 ? ((data.selected / total) * 100).toFixed(1) : '0.0';
    const rejectionRate = total > 0 ? ((data.rejected / total) * 100).toFixed(1) : '0.0';

    document.getElementById('insights-row').innerHTML = `
        <div class="col-lg col-md-4 col-sm-6 mb-3">
            <div class="p-3 bg-light rounded-3 h-100">
                <h4 class="fw-bold text-dark mb-1">${total}</h4>
                <p class="text-muted small mb-1">Total Applications</p>
                <div class="text-muted" style="font-size: 0.7rem;">Count of all tracked roles</div>
            </div>
        </div>
        <div class="col-lg col-md-4 col-sm-6 mb-3">
            <div class="p-3 bg-light rounded-3 h-100">
                <h4 class="fw-bold text-deadline-orange mb-1">${interviewRate}%</h4>
                <p class="text-muted small mb-1">Interview Rate</p>
                <div class="text-muted" style="font-size: 0.7rem;" title="(Interview / Total) * 100">Formula: (Interview / Total) × 100</div>
            </div>
        </div>
        <div class="col-lg col-md-4 col-sm-6 mb-3">
            <div class="p-3 bg-light rounded-3 h-100">
                <h4 class="fw-bold text-deadline-green mb-1">${successRate}%</h4>
                <p class="text-muted small mb-1">Success Rate</p>
                <div class="text-muted" style="font-size: 0.7rem;" title="(Selected / Total) * 100">Formula: (Selected / Total) × 100</div>
            </div>
        </div>
        <div class="col-lg col-md-4 col-sm-6 mb-3">
            <div class="p-3 bg-light rounded-3 h-100">
                <h4 class="fw-bold text-deadline-green mb-1">${selectionRate}%</h4>
                <p class="text-muted small mb-1">Selection Rate</p>
                <div class="text-muted" style="font-size: 0.7rem;" title="(Selected / Total) * 100">Formula: (Selected / Total) × 100</div>
            </div>
        </div>
        <div class="col-lg col-md-4 col-sm-6 mb-3">
            <div class="p-3 bg-light rounded-3 h-100">
                <h4 class="fw-bold text-deadline-red mb-1">${rejectionRate}%</h4>
                <p class="text-muted small mb-1">Rejection Rate</p>
                <div class="text-muted" style="font-size: 0.7rem;" title="(Rejected / Total) * 100">Formula: (Rejected / Total) × 100</div>
            </div>
        </div>
    `;
}

// ===== ACTIVE STAT CARD HIGHLIGHT =====
function updateActiveStatCard(status) {
    const cards = document.querySelectorAll('.stat-card');
    cards.forEach(card => {
        card.classList.remove('active-card');
        card.style.opacity = status === '' ? '1' : '0.6';
        if (card.getAttribute('data-status') === status) {
            card.classList.add('active-card');
            card.style.opacity = '1';
        }
    });
}

// ===== SEARCH + FILTER =====
function setupFilters() {
    // Real-time — search, status, backlog
    document.getElementById('search-input')
        .addEventListener('input', applyFilters);
    document.getElementById('filter-status')
        .addEventListener('change', (e) => {
            updateActiveStatCard(e.target.value);
            applyFilters();
        });
    document.getElementById('filter-backlog')
        .addEventListener('change', applyFilters);

    // Number inputs — type करो तो auto apply
    ['filter-min-ctc', 'filter-max-ctc',
        'filter-my-cgpa', 'filter-my-tenth',
        'filter-my-twelfth'].forEach(id => {
            document.getElementById(id)
                .addEventListener('input', applyFilters);
        });
}

function applyFilters() {
    const search = document.getElementById('search-input').value.toLowerCase().trim();
    const status = document.getElementById('filter-status').value;
    const minCtc = parseFloat(document.getElementById('filter-min-ctc').value) || null;
    const maxCtc = parseFloat(document.getElementById('filter-max-ctc').value) || null;
    const myCgpa = parseFloat(document.getElementById('filter-my-cgpa').value) || null;
    const myTenth = parseFloat(document.getElementById('filter-my-tenth').value) || null;
    const myTwelfth = parseFloat(document.getElementById('filter-my-twelfth').value) || null;
    const backlog = document.getElementById('filter-backlog').value;

    const filtered = allCompanies.filter(c => {

        // Search — company name या role मां
        const matchSearch = !search ||
            c.company_name.toLowerCase().includes(search) ||
            (c.role && c.role.toLowerCase().includes(search));

        // Status filter
        const matchStatus = !status || c.status === status;

        // CTC range filter
        const matchMinCtc = !minCtc || (c.ctc && c.ctc >= minCtc);
        const matchMaxCtc = !maxCtc || (c.ctc && c.ctc <= maxCtc);

        // CGPA — "मारी CGPA आटલી छे, हुं eligible छुं?"
        // Company नी required CGPA <= मारी CGPA
        const matchCgpa = !myCgpa ||
            !c.cgpa_criteria ||
            c.cgpa_criteria <= myCgpa;

        // 10th % eligibility
        const matchTenth = !myTenth ||
            !c.tenth_criteria ||
            c.tenth_criteria <= myTenth;

        // 12th % eligibility
        const matchTwelfth = !myTwelfth ||
            !c.twelfth_criteria ||
            c.twelfth_criteria <= myTwelfth;

        // Backlog filter
        const matchBacklog = !backlog ||
            String(c.backlog_allowed) === backlog;

        return matchSearch && matchStatus &&
            matchMinCtc && matchMaxCtc &&
            matchCgpa && matchTenth &&
            matchTwelfth && matchBacklog;
    });

    renderTable(filtered);

    updateFilterBadge();

}

function updateFilterBadge() {
    const activeFilters = [
        document.getElementById('search-input').value,
        document.getElementById('filter-status').value,
        document.getElementById('filter-min-ctc').value,
        document.getElementById('filter-max-ctc').value,
        document.getElementById('filter-my-cgpa').value,
        document.getElementById('filter-my-tenth').value,
        document.getElementById('filter-my-twelfth').value,
        document.getElementById('filter-backlog').value,
    ].filter(v => v !== '').length;

    const btn = document.querySelector('[data-bs-target="#advancedFilters"]');

    if (activeFilters > 0) {
        btn.innerHTML = `⚙️ Advanced Filters 
            <span class="badge bg-danger ms-1">${activeFilters}</span>`;
    } else {
        btn.innerHTML = '⚙️ Advanced Filters';
    }
}

function clearFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-min-ctc').value = '';
    document.getElementById('filter-max-ctc').value = '';
    document.getElementById('filter-my-cgpa').value = '';
    document.getElementById('filter-my-tenth').value = '';
    document.getElementById('filter-my-twelfth').value = '';
    document.getElementById('filter-backlog').value = '';
    updateActiveStatCard('');
    renderTable(allCompanies);
    updateFilterBadge(); // ← badge reset
}

// ===== DETAIL MODAL =====
function showDetail(id) {
    const c = allCompanies.find(c => c.id === id);
    if (!c) return;

    document.getElementById('modal-company-name').textContent =
        `🏢 ${c.company_name}`;

    document.getElementById('modal-body').innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6 class="text-muted">Basic Information</h6>
                <table class="table table-sm">
                    <tr><td><strong>Role</strong></td>
                        <td>${c.role || '-'}</td></tr>
                    <tr><td><strong>CTC</strong></td>
                        <td>${c.ctc ? c.ctc + ' LPA' : '-'}</td></tr>
                    <tr><td><strong>Location</strong></td>
                        <td>${c.location || '-'}</td></tr>
                    <tr><td><strong>Status</strong></td>
                        <td>${getStatusBadge(c.status)}</td></tr>
                    <tr><td><strong>Match Score</strong></td>
                        <td>${c.matching_score ? `<span class="fw-bold text-primary">${c.matching_score.percentage}%</span> <span class="badge ${c.matching_score.level === 'Strong Match' ? 'bg-success' : c.matching_score.level === 'Good Match' ? 'bg-primary' : c.matching_score.level === 'Needs Preparation' ? 'bg-warning text-dark' : 'bg-danger'}" style="font-size:0.7rem;">${c.matching_score.level}</span>` : '-'}</td></tr>
                    <tr><td><strong>Apply Link</strong></td>
                        <td>${c.apply_link ?
            `<a href="${c.apply_link}" target="_blank">Open Link</a>`
            : '-'}</td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Eligibility Criteria</h6>
                <table class="table table-sm">
                    <tr><td><strong>CGPA</strong></td>
                        <td>${c.cgpa_criteria || '-'}</td></tr>
                    <tr><td><strong>10th %</strong></td>
                        <td>${c.tenth_criteria ? c.tenth_criteria + '%' : '-'}</td></tr>
                    <tr><td><strong>12th %</strong></td>
                        <td>${c.twelfth_criteria ? c.twelfth_criteria + '%' : '-'}</td></tr>
                    <tr><td><strong>Backlog Allowed</strong></td>
                        <td>${c.backlog_allowed ?
            '<span class="text-success">Yes</span>' :
            '<span class="text-danger">No</span>'}</td></tr>
                </table>
                ${c.eligibility_notes ?
            `<p class="text-muted small">${c.eligibility_notes}</p>` : ''}
            </div>
        </div>
        <hr>
        <div class="row">
            <div class="col-md-6">
                <h6 class="text-muted">Important Dates</h6>
                <table class="table table-sm">
                    <tr><td><strong>Applied Date</strong></td>
                        <td>${c.applied_date || '-'}</td></tr>
                    <tr><td><strong>Deadline</strong></td>
                        <td>${getDeadlineDisplay(c.deadline)}</td></tr>
                    <tr><td><strong>Test Date</strong></td>
                        <td>${c.test_date || '-'}</td></tr>
                    <tr><td><strong>Interview Date</strong></td>
                        <td>${c.interview_date || '-'}</td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Additional Info</h6>
                <p>${c.notes || 'No notes added.'}</p>
                <small class="text-muted">
                    Added: ${c.created_at || '-'}<br>
                    Updated: ${c.updated_at || '-'}
                </small>
            </div>
        </div>
    `;

    const detailsBtn = document.getElementById('modal-details-btn');
    if (detailsBtn) {
        detailsBtn.href = `/company/${c.id}`;
    }

    document.getElementById('modal-edit-btn').onclick = () => {
        window.location.href = `/edit/${c.id}`;
    };

    new bootstrap.Modal(document.getElementById('detailModal')).show();
}

// ===== STATUS BADGE =====
function getStatusBadge(status) {
    let displayStatus = status;
    if (status === 'Pending') {
        displayStatus = 'Processing';
    }

    const badgeClasses = {
        'Applied': 'badge-status badge-applied',
        'Interview': 'badge-status badge-interview',
        'Selected': 'badge-status badge-selected',
        'Rejected': 'badge-status badge-rejected',
        'Pending': 'badge-status badge-processing'
    };

    const cls = badgeClasses[status] || 'badge-status badge-processing';
    return `<span class="${cls}">${displayStatus}</span>`;
}

// ===== DELETE =====
let companyIdToDelete = null;
let deleteModalInstance = null;

function deleteCompany(id, companyName = null, isDetailsPage = false) {
    let displayName = companyName;
    if (!displayName) {
        const c = allCompanies.find(x => x.id === id);
        if (c) displayName = c.company_name;
    }

    companyIdToDelete = id;
    const modalCompanyNameEl = document.getElementById('delete-modal-company-name');
    if (modalCompanyNameEl) {
        modalCompanyNameEl.textContent = displayName || 'this company';
    }

    if (!deleteModalInstance) {
        const modalEl = document.getElementById('deleteConfirmModal');
        if (modalEl) {
            deleteModalInstance = new bootstrap.Modal(modalEl);
        }
    }
    if (deleteModalInstance) {
        deleteModalInstance.show();
    }

    const modalEl = document.getElementById('deleteConfirmModal');
    if (modalEl) {
        modalEl.dataset.isDetailsPage = isDetailsPage ? "true" : "false";
    }
}

// ===== ADD COMPANY =====
async function submitCompany() {
    const data = {
        company_name: document.getElementById('company_name').value.trim(),
        role: document.getElementById('role').value.trim(),
        ctc: parseFloat(document.getElementById('ctc').value) || null,
        location: document.getElementById('location').value.trim(),
        status: document.getElementById('status').value,
        apply_link: document.getElementById('apply_link').value.trim(),
        cgpa_criteria: parseFloat(document.getElementById('cgpa_criteria').value) || null,
        tenth_criteria: parseFloat(document.getElementById('tenth_criteria').value) || null,
        twelfth_criteria: parseFloat(document.getElementById('twelfth_criteria').value) || null,
        backlog_allowed: document.getElementById('backlog_allowed').value === 'true',
        eligibility_notes: document.getElementById('eligibility_notes').value.trim(),
        required_skills: document.getElementById('required_skills').value.trim(),
        deadline: document.getElementById('deadline').value || null,
        test_date: document.getElementById('test_date').value || null,
        interview_date: document.getElementById('interview_date').value || null,
        notes: document.getElementById('notes').value.trim()
    };

    if (!data.company_name) {
        showMessage('Company name is required!', 'danger');
        return;
    }

    const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
        showMessage('Company added successfully!', 'success');
        setTimeout(() => window.location.href = '/', 1000);
    } else {
        showMessage(result.errors.join(', '), 'danger');
    }
}

// ===== EDIT COMPANY =====
async function loadCompanyData() {
    const id = document.getElementById('company_id').value;
    const response = await fetch(`/api/companies/${id}`);
    const company = await response.json();

    document.getElementById('company_name').value = company.company_name || '';
    document.getElementById('role').value = company.role || '';
    document.getElementById('ctc').value = company.ctc || '';
    document.getElementById('location').value = company.location || '';
    document.getElementById('apply_link').value = company.apply_link || '';
    document.getElementById('cgpa_criteria').value = company.cgpa_criteria || '';
    document.getElementById('tenth_criteria').value = company.tenth_criteria || '';
    document.getElementById('twelfth_criteria').value = company.twelfth_criteria || '';
    document.getElementById('eligibility_notes').value = company.eligibility_notes || '';
    document.getElementById('required_skills').value = company.required_skills || '';
    document.getElementById('deadline').value = company.deadline || '';
    document.getElementById('test_date').value = company.test_date || '';
    document.getElementById('interview_date').value = company.interview_date || '';
    document.getElementById('notes').value = company.notes || '';
    document.getElementById('status').value = company.status || 'Applied';
    document.getElementById('backlog_allowed').value =
        company.backlog_allowed ? 'true' : 'false';
}

async function updateCompany() {
    const id = document.getElementById('company_id').value;

    const data = {
        company_name: document.getElementById('company_name').value.trim(),
        role: document.getElementById('role').value.trim(),
        ctc: parseFloat(document.getElementById('ctc').value) || null,
        location: document.getElementById('location').value.trim(),
        status: document.getElementById('status').value,
        apply_link: document.getElementById('apply_link').value.trim(),
        cgpa_criteria: parseFloat(document.getElementById('cgpa_criteria').value) || null,
        tenth_criteria: parseFloat(document.getElementById('tenth_criteria').value) || null,
        twelfth_criteria: parseFloat(document.getElementById('twelfth_criteria').value) || null,
        backlog_allowed: document.getElementById('backlog_allowed').value === 'true',
        eligibility_notes: document.getElementById('eligibility_notes').value.trim(),
        required_skills: document.getElementById('required_skills').value.trim(),
        deadline: document.getElementById('deadline').value || null,
        test_date: document.getElementById('test_date').value || null,
        interview_date: document.getElementById('interview_date').value || null,
        notes: document.getElementById('notes').value.trim()
    };

    if (!data.company_name) {
        showMessage('Company name is required!', 'danger');
        return;
    }

    const response = await fetch(`/api/companies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
        showMessage('Company updated successfully!', 'success');
        setTimeout(() => window.location.href = '/', 1000);
    } else {
        showMessage(result.errors.join(', '), 'danger');
    }
}

// ===== HELPERS =====
function showMessage(msg, type) {
    const div = document.getElementById('message');
    if (!div) return;
    div.className = `alert alert-${type}`;
    div.textContent = msg;
}

function filterByStatus(status, element) {
    // Clear other filters except status
    document.getElementById('search-input').value = '';
    document.getElementById('filter-min-ctc').value = '';
    document.getElementById('filter-max-ctc').value = '';
    document.getElementById('filter-my-cgpa').value = '';
    document.getElementById('filter-my-tenth').value = '';
    document.getElementById('filter-my-twelfth').value = '';
    document.getElementById('filter-backlog').value = '';

    // Active card highlight & sync dropdown
    updateActiveStatCard(status);

    const statusSelect = document.getElementById('filter-status');
    if (statusSelect) {
        statusSelect.value = status;
    }

    applyFilters();
}

// ===== AI ASSISTANT HELPERS =====
function populateAICompanyDropdown() {
    const selectEl = document.getElementById('ai-select-company');
    if (!selectEl) return;
    
    // Save current selection to restore if needed
    const currentSelection = selectEl.value;
    
    // Clear old options except the first "Enter Custom Details" one
    selectEl.innerHTML = '<option value="">-- Enter Custom Details --</option>';
    
    allCompanies.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.company_name} - ${c.role || 'No Role'}`;
        selectEl.appendChild(opt);
    });
    
    // Restore selection
    selectEl.value = currentSelection;
}

let currentAIResponse = null;

function showToast(message) {
    const textEl = document.getElementById('toast-body-text');
    if (textEl) textEl.textContent = message;
    
    const toastEl = document.getElementById('aiToast');
    if (toastEl) {
        const toast = bootstrap.Toast.getOrCreateInstance(toastEl);
        toast.show();
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            showToast('Question copied successfully.');
        })
        .catch(err => {
            console.warn('Clipboard write failed:', err);
            showToast('Question copied successfully.');
        });
}

function copyAllAIQuestions() {
    if (!currentAIResponse) return;
    
    let text = `AI Interview Preparation Guide\n\n`;
    text += `Difficulty Level: ${currentAIResponse.difficulty_level}\n`;
    text += `Interview Readiness Score: ${currentAIResponse.readiness_score}%\n\n`;
    
    if (currentAIResponse.technical_questions) {
        text += `TECHNICAL QUESTIONS:\n`;
        currentAIResponse.technical_questions.forEach((q, i) => {
            text += `${i+1}. ${q.question}\nAnswer: ${q.answer}\n\n`;
        });
    }
    if (currentAIResponse.hr_questions) {
        text += `HR QUESTIONS:\n`;
        currentAIResponse.hr_questions.forEach((q, i) => {
            text += `${i+1}. ${q.question}\nAnswer: ${q.answer}\n\n`;
        });
    }
    if (currentAIResponse.project_questions) {
        text += `PROJECT-BASED QUESTIONS:\n`;
        currentAIResponse.project_questions.forEach((q, i) => {
            text += `${i+1}. ${q.question}\nAnswer: ${q.answer}\n\n`;
        });
    }
    
    navigator.clipboard.writeText(text)
        .then(() => {
            showToast('Questions copied successfully.');
        })
        .catch(err => {
            console.warn('Clipboard write failed:', err);
            showToast('Questions copied successfully.');
        });
}

function renderQuestionsList(containerEl, questionsList, sectionKey) {
    if (!containerEl) return;
    if (!questionsList || questionsList.length === 0) {
        containerEl.innerHTML = '<p class="text-muted small">No questions generated for this section.</p>';
        return;
    }

    containerEl.innerHTML = questionsList.map((qObj, index) => {
        const uniqueId = `collapse-${sectionKey}-${index}`;
        // Escape quotes to prevent breaks in inline javascript strings
        const escapedQuestion = qObj.question.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        return `
            <div class="card border-0 bg-light mb-3">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <span class="badge bg-secondary-subtle text-secondary fw-semibold small">Question #${index + 1}</span>
                        <button class="btn btn-sm btn-link p-0 text-muted text-decoration-none" onclick="copyToClipboard('${escapedQuestion}')">
                            📋 Copy
                        </button>
                    </div>
                    <h6 class="fw-bold text-dark mb-3">${qObj.question}</h6>
                    
                    <button class="btn btn-sm btn-outline-primary" type="button" data-bs-toggle="collapse" data-bs-target="#${uniqueId}">
                        Show Sample Answer
                    </button>
                    
                    <div class="collapse mt-3" id="${uniqueId}">
                        <div class="p-3 bg-white rounded border-start border-primary border-3" style="border-left: 4px solid #2563EB !important;">
                            <span class="text-muted small fw-semibold">💡 Sample Answer:</span>
                            <p class="text-secondary small mb-0 mt-1" style="white-space: pre-wrap; line-height: 1.6;">${qObj.answer}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderAIOutput(q, company, role, ctc) {
    currentAIResponse = q;
    
    // 1. Populate Profile Details
    document.getElementById('ai-profile-company').textContent = company;
    const ctcStr = ctc ? `${ctc} LPA` : 'Not specified';
    const timestamp = new Date().toLocaleString();
    document.getElementById('ai-profile-meta').innerHTML = `<strong>Role:</strong> ${role} | <strong>CTC:</strong> ${ctcStr} <span class="text-muted ms-2">Generated on: ${timestamp}</span>`;
    
    // 2. Difficulty Level Badge
    const diffBadge = document.getElementById('ai-difficulty-badge');
    const diff = (q.difficulty_level || 'Medium').trim();
    diffBadge.textContent = `Difficulty: ${diff}`;
    diffBadge.className = 'badge py-2 px-3 fs-7 rounded-pill'; // Reset classes
    if (diff.toLowerCase() === 'easy') {
        diffBadge.classList.add('bg-success', 'text-white');
    } else if (diff.toLowerCase() === 'medium') {
        diffBadge.classList.add('bg-warning', 'text-dark');
    } else {
        diffBadge.classList.add('bg-danger', 'text-white');
    }
    
    // 3. Interview Readiness Score Progress Bar
    const score = parseInt(q.readiness_score) || 0;
    document.getElementById('ai-readiness-percentage').textContent = `${score}%`;
    const bar = document.getElementById('ai-readiness-bar');
    bar.style.width = `${score}%`;
    bar.className = 'progress-bar'; // Reset colors
    if (score <= 40) {
        bar.classList.add('bg-danger');
    } else if (score <= 70) {
        bar.classList.add('bg-warning');
    } else {
        bar.classList.add('bg-success');
    }
    
    // 4. Strengths & Focus Areas lists
    const strengthsEl = document.getElementById('ai-strengths-list');
    strengthsEl.innerHTML = (q.strengths || []).map(s => `<li>• ${s}</li>`).join('');
    
    const focusEl = document.getElementById('ai-focus-list');
    focusEl.innerHTML = (q.focus_areas || []).map(f => `<li>• ${f}</li>`).join('');
    
    // 5. Question Categories Cards
    renderQuestionsList(document.getElementById('ai-tech-questions'), q.technical_questions, 'tech');
    renderQuestionsList(document.getElementById('ai-hr-questions'), q.hr_questions, 'hr');
    renderQuestionsList(document.getElementById('ai-project-questions'), q.project_questions, 'project');
    
    // 6. Topics badges
    const topicsEl = document.getElementById('ai-topics-chips');
    topicsEl.innerHTML = (q.topics_to_revise || []).map(t => `<span class="badge bg-secondary-subtle text-secondary py-2 px-3 mb-1 text-wrap text-start" style="font-size: 0.8rem; font-weight: 600; white-space: normal; text-align: left; max-width: 100%; word-break: break-word;">${t}</span>`).join('');
    
    // 7. Advice bullet list
    const adviceEl = document.getElementById('ai-advice-list');
    adviceEl.innerHTML = (q.preparation_advice || []).map(a => `<li class="mb-2">• ${a}</li>`).join('');
    
    // 8. Display output container and hide empty state
    document.getElementById('ai-empty-state').style.display = 'none';
    document.getElementById('ai-output-container').style.display = 'block';
}

async function generateAIQuestions() {
    const company = document.getElementById('ai-company-name').value.trim();
    const role = document.getElementById('ai-role').value.trim();
    const ctcVal = document.getElementById('ai-ctc').value;
    const ctc = ctcVal !== '' ? parseFloat(ctcVal) : null;
    const status = document.getElementById('ai-status').value;

    const errorDiv = document.getElementById('ai-error');
    const loadingDiv = document.getElementById('ai-loading');
    const outputContainer = document.getElementById('ai-output-container');
    const emptyState = document.getElementById('ai-empty-state');
    
    const generateBtn = document.getElementById('ai-generate-btn');
    const regenerateBtn = document.getElementById('ai-regenerate-btn');

    // Reset UI states
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';

    if (!company) {
        errorDiv.textContent = 'Company name is required!';
        errorDiv.style.display = 'block';
        return;
    }
    if (!role) {
        errorDiv.textContent = 'Job role is required!';
        errorDiv.style.display = 'block';
        return;
    }

    // Show loading spinner, disable buttons
    loadingDiv.style.display = 'block';
    if (generateBtn) generateBtn.disabled = true;
    if (regenerateBtn) regenerateBtn.disabled = true;

    try {
        const response = await fetch('/api/generate-interview-questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ company, role, ctc, status })
        });

        const data = await response.json();

        if (response.ok) {
            if (data.is_raw) {
                errorDiv.textContent = 'Failed to parse Gemini response as JSON. Raw response: ' + data.questions;
                errorDiv.style.display = 'block';
            } else {
                renderAIOutput(data.questions, company, role, ctc);
            }
        } else {
            errorDiv.textContent = data.error || 'An error occurred while generating questions.';
            errorDiv.style.display = 'block';
        }
    } catch (err) {
        errorDiv.textContent = 'Failed to connect to the backend server: ' + err.message;
        errorDiv.style.display = 'block';
    } finally {
        loadingDiv.style.display = 'none';
        if (generateBtn) generateBtn.disabled = false;
        if (regenerateBtn) regenerateBtn.disabled = false;
    }
}

// ===== PAGE DETECTION & INIT =====
if (document.getElementById('stats-row')) {
    loadDashboard();

    // Bind AI select dropdown auto-population
    const aiSelect = document.getElementById('ai-select-company');
    if (aiSelect) {
        aiSelect.addEventListener('change', (e) => {
            const id = e.target.value;
            const nameInput = document.getElementById('ai-company-name');
            const roleInput = document.getElementById('ai-role');
            const ctcInput = document.getElementById('ai-ctc');
            const statusSelect = document.getElementById('ai-status');
            
            if (id) {
                const c = allCompanies.find(x => x.id == id);
                if (c) {
                    nameInput.value = c.company_name;
                    nameInput.readOnly = true;
                    roleInput.value = c.role || '';
                    roleInput.readOnly = true;
                    ctcInput.value = c.ctc || '';
                    ctcInput.readOnly = true;
                    statusSelect.value = c.status || 'Applied';
                    statusSelect.disabled = true;
                }
            } else {
                nameInput.value = '';
                nameInput.readOnly = false;
                roleInput.value = '';
                roleInput.readOnly = false;
                ctcInput.value = '';
                ctcInput.readOnly = false;
                statusSelect.value = 'Applied';
                statusSelect.disabled = false;
            }
        });
    }
}
if (document.getElementById('company_id')) {
    loadCompanyData();
}
if (document.getElementById('details_company_id')) {
    loadCompanyDetails();
}

// ===== UPCOMING INTERVIEWS WIDGET =====
function renderUpcomingInterviews() {
    const listContainer = document.getElementById('upcoming-interviews-list');
    if (!listContainer) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcoming = allCompanies.filter(c => {
        if (!c.interview_date) return false;
        const parts = c.interview_date.split('-');
        const intDate = new Date(parts[0], parts[1] - 1, parts[2]);
        intDate.setHours(0, 0, 0, 0);
        return intDate >= today;
    });
    
    upcoming.sort((a, b) => {
        return new Date(a.interview_date) - new Date(b.interview_date);
    });
    
    if (upcoming.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center text-muted py-3">
                <p class="mb-0 small fw-semibold">📅 No upcoming interviews scheduled.</p>
            </div>
        `;
        return;
    }
    
    listContainer.innerHTML = `
        <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-3">
            ${upcoming.map(c => {
                const parts = c.interview_date.split('-');
                const intDate = new Date(parts[0], parts[1] - 1, parts[2]);
                intDate.setHours(0, 0, 0, 0);
                const diffTime = intDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                let daysText = '';
                let badgeClass = '';
                if (diffDays === 0) {
                    daysText = 'Today';
                    badgeClass = 'bg-danger text-white';
                } else if (diffDays === 1) {
                    daysText = '1 day left';
                    badgeClass = 'bg-warning text-dark';
                } else {
                    daysText = `${diffDays} days left`;
                    badgeClass = 'bg-info text-white';
                }
                
                return `
                    <div class="col">
                        <div class="card h-100 interview-card border-0 shadow-sm">
                            <div class="card-body p-3 d-flex flex-column justify-content-between">
                                <div>
                                    <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                                        <h6 class="fw-bold text-dark mb-0">${c.company_name}</h6>
                                        <span class="days-badge ${badgeClass}">${daysText}</span>
                                    </div>
                                    <p class="text-muted small mb-2">${c.role || '-'}</p>
                                </div>
                                <div class="border-top pt-2 mt-2 text-muted small">
                                    📅 Interview: <strong>${c.interview_date}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// ===== COMPANY DETAILS PAGE =====
async function loadCompanyDetails() {
    const id = document.getElementById('details_company_id').value;
    const loadingDiv = document.getElementById('details-loading');
    const errorDiv = document.getElementById('details-error');
    const container = document.getElementById('details-container');
    
    if (!id) {
        loadingDiv.style.display = 'none';
        errorDiv.textContent = 'No company ID provided.';
        errorDiv.style.display = 'block';
        return;
    }
    
    try {
        const response = await fetch(`/api/companies/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch company details.');
        }
        
        const c = await response.json();
        
        document.getElementById('detail-company-name').textContent = c.company_name;
        document.getElementById('detail-role').textContent = c.role || 'No Role Specified';
        document.getElementById('detail-location').textContent = c.location || 'Remote / Unspecified';
        document.getElementById('detail-loc-text').textContent = c.location || 'Remote / Unspecified';
        
        document.getElementById('detail-status-badge-container').innerHTML = getStatusBadge(c.status);
        document.getElementById('detail-ctc').textContent = c.ctc ? `${c.ctc} LPA` : 'Not Specified';
        
        const linkContainer = document.getElementById('detail-link-container');
        if (c.apply_link) {
            linkContainer.innerHTML = `<a href="${c.apply_link}" target="_blank" class="btn btn-sm btn-primary">Apply Now ↗</a>`;
        } else {
            linkContainer.textContent = 'No link provided';
        }
        
        document.getElementById('detail-cgpa').textContent = c.cgpa_criteria ? `${c.cgpa_criteria} CGPA` : 'No CGPA Criteria';
        document.getElementById('detail-academics').textContent = `10th: ${c.tenth_criteria ? c.tenth_criteria + '%' : 'N/A'} | 12th: ${c.twelfth_criteria ? c.twelfth_criteria + '%' : 'N/A'}`;
        
        document.getElementById('detail-backlogs').innerHTML = c.backlog_allowed 
            ? '<span class="text-success fw-semibold">Yes</span>' 
            : '<span class="text-danger fw-semibold">No</span>';
            
        // Populate required skills
        if (document.getElementById('detail-skills')) {
            document.getElementById('detail-skills').textContent = c.required_skills || 'None';
        }
            
        if (c.eligibility_notes) {
            document.getElementById('detail-eligibility-notes').textContent = c.eligibility_notes;
            document.getElementById('detail-notes-section').style.display = 'block';
        }
        
        // Populate matching score card
        const match = c.matching_score;
        if (match) {
            if (document.getElementById('detail-match-percentage')) {
                document.getElementById('detail-match-percentage').textContent = match.percentage;
            }
            
            const badge = document.getElementById('detail-match-badge');
            if (badge) {
                badge.textContent = match.level;
                badge.className = "badge py-2 px-3 fs-7 rounded-pill";
                
                if (match.level === "Strong Match") {
                    badge.classList.add("bg-success");
                } else if (match.level === "Good Match") {
                    badge.classList.add("bg-primary");
                } else if (match.level === "Needs Preparation") {
                    badge.classList.add("bg-warning", "text-dark");
                } else {
                    badge.classList.add("bg-danger");
                }
            }
            
            const pBar = document.getElementById('detail-match-progress-bar');
            if (pBar) {
                pBar.style.width = `${match.percentage}%`;
                pBar.className = "progress-bar";
                
                if (match.level === "Strong Match") {
                    pBar.classList.add("bg-success");
                } else if (match.level === "Good Match") {
                    pBar.classList.add("bg-primary");
                } else if (match.level === "Needs Preparation") {
                    pBar.classList.add("bg-warning");
                } else {
                    pBar.classList.add("bg-danger");
                }
            }
            
            if (document.getElementById('detail-match-recommendation')) {
                document.getElementById('detail-match-recommendation').textContent = match.recommendation;
            }
            
            // Populate breakdown scores
            if (document.getElementById('detail-match-academics-score')) {
                document.getElementById('detail-match-academics-score').textContent = match.academics_score;
            }
            if (document.getElementById('detail-match-skills-score')) {
                document.getElementById('detail-match-skills-score').textContent = match.skills_score;
            }
            if (document.getElementById('detail-match-roles-score')) {
                document.getElementById('detail-match-roles-score').textContent = match.role_score;
            }
        }
        
        document.getElementById('detail-notes').textContent = c.notes || 'No notes added.';
        document.getElementById('detail-deadline').innerHTML = getDeadlineDisplay(c.deadline);
        document.getElementById('detail-test-date').textContent = c.test_date || 'Not Scheduled';
        document.getElementById('detail-interview-date').textContent = c.interview_date || 'Not Scheduled';
        
        document.getElementById('detail-created-at').textContent = c.created_at || 'N/A';
        document.getElementById('detail-updated-at').textContent = c.updated_at || 'N/A';
        
        document.getElementById('detail-edit-btn').href = `/edit/${c.id}`;
        document.getElementById('detail-delete-btn').onclick = () => deleteCompany(c.id, c.company_name, true);
        
        renderProgressTimeline(c.status);
        
        loadingDiv.style.display = 'none';
        container.style.display = 'block';
        
    } catch (err) {
        loadingDiv.style.display = 'none';
        errorDiv.textContent = err.message;
        errorDiv.style.display = 'block';
    }
}

function renderProgressTimeline(status) {
    const stepApplied = document.getElementById('step-applied');
    const stepProcessing = document.getElementById('step-processing');
    const stepInterview = document.getElementById('step-interview');
    const stepOutcome = document.getElementById('step-outcome');
    const outcomeIcon = document.getElementById('step-outcome-icon');
    const outcomeLabel = document.getElementById('step-outcome-label');
    const progressBar = document.getElementById('timeline-progress-bar');
    
    const allStepEls = [stepApplied, stepProcessing, stepInterview, stepOutcome];
    allStepEls.forEach(el => {
        el.classList.remove('active', 'completed', 'rejected');
    });
    progressBar.classList.remove('rejected-line');
    
    outcomeLabel.textContent = 'Selected';
    outcomeIcon.textContent = '4';
    
    let activeIndex = -1;
    let isRejected = false;
    
    if (status === 'Applied') {
        activeIndex = 0;
    } else if (status === 'Pending') {
        activeIndex = 1;
    } else if (status === 'Interview') {
        activeIndex = 2;
    } else if (status === 'Selected') {
        activeIndex = 3;
    } else if (status === 'Rejected') {
        isRejected = true;
        activeIndex = 3;
        outcomeLabel.textContent = 'Rejected';
        outcomeIcon.textContent = '✗';
    }
    
    for (let i = 0; i < 4; i++) {
        const el = allStepEls[i];
        if (i < activeIndex) {
            el.classList.add('completed');
        } else if (i === activeIndex) {
            if (isRejected) {
                el.classList.add('rejected');
            } else {
                el.classList.add(status === 'Selected' ? 'completed' : 'active');
            }
        }
    }
    
    let progressWidth = 0;
    if (activeIndex > 0) {
        progressWidth = (activeIndex / 3) * 100;
    }
    progressBar.style.width = `${progressWidth}%`;
    
    if (isRejected) {
        progressBar.classList.add('rejected-line');
    }
}

// Bind delete confirmation button click globally (runs on all pages)
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
        if (companyIdToDelete === null) return;

        const response = await fetch(`/api/companies/${companyIdToDelete}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            if (deleteModalInstance) {
                deleteModalInstance.hide();
            }
            
            const modalEl = document.getElementById('deleteConfirmModal');
            const isDetailsPage = modalEl && modalEl.dataset.isDetailsPage === "true";
            
            if (isDetailsPage) {
                window.location.href = '/';
            } else {
                loadDashboard();
            }
        }
        companyIdToDelete = null;
    });
}

// ===== AI EXPLAIN MATCH =====
async function explainMatchWithAI() {
    const id = document.getElementById('details_company_id').value;
    if (!id) return;
    
    const container = document.getElementById('ai-explanation-container');
    const loadingDiv = document.getElementById('ai-explain-loading');
    const errorDiv = document.getElementById('ai-explain-error');
    const contentDiv = document.getElementById('ai-explanation-content');
    const explainBtn = document.getElementById('ai-explain-btn');
    
    // Reset UI states
    container.style.display = 'block';
    loadingDiv.style.display = 'block';
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    contentDiv.textContent = '';
    
    // Disable button
    explainBtn.disabled = true;
    
    try {
        const response = await fetch('/api/explain-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company_id: parseInt(id) })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to explain match.');
        }
        
        // Show output
        contentDiv.innerHTML = formatMarkdown(result.explanation);
        loadingDiv.style.display = 'none';
        
    } catch (err) {
        loadingDiv.style.display = 'none';
        errorDiv.textContent = err.message;
        errorDiv.style.display = 'block';
    } finally {
        explainBtn.disabled = false;
    }
}

// Simple helper to format Markdown response nicely in the UI
function formatMarkdown(text) {
    if (!text) return '';
    
    // Replace markdown headers with HTML headers (e.g. ## Header -> <h6>Header</h6>)
    let formatted = text
        .replace(/^### (.*?)$/gm, '<h6 class="fw-bold text-dark mt-3 mb-2">$1</h6>')
        .replace(/^## (.*?)$/gm, '<h5 class="fw-bold text-dark mt-4 mb-2">$1</h5>')
        .replace(/^# (.*?)$/gm, '<h4 class="fw-bold text-dark mt-4 mb-2">$1</h4>')
        .replace(/^(Short Summary:|Weak Areas:|Preparation Topics:|7-Day Preparation Plan:|Final Advice:)$/gm, '<h6 class="fw-bold text-primary mt-3 mb-2">$1</h6>');
        
    // Replace lists e.g. - item -> <li>item</li>
    formatted = formatted.replace(/^\s*[-*]\s+(.*?)$/gm, '<li>$1</li>');
    
    // Bold formatting **text** -> <strong>text</strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    return formatted;
}

