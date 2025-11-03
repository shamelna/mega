// ============================================
// ADMIN MODULE
// ============================================

let allAssessmentsCache = [];
let allUsersCache = [];

// ============================================
// ADMIN TAB MANAGEMENT
// ============================================
function showAdminTab(tabName) {
    // Hide all tab contents
    document.getElementById('adminAssessmentsTab').classList.remove('active');
    document.getElementById('adminUsersTab').classList.remove('active');
    
    // Remove active class from all tabs
    document.querySelectorAll('#adminPanel .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    if (tabName === 'assessments') {
        document.getElementById('adminAssessmentsTab').classList.add('active');
        document.querySelectorAll('#adminPanel .tab')[0].classList.add('active');
        loadAdminAssessments();
    } else if (tabName === 'users') {
        document.getElementById('adminUsersTab').classList.add('active');
        document.querySelectorAll('#adminPanel .tab')[1].classList.add('active');
        loadAdminUsers();
    }
}

// ============================================
// ADMIN STATISTICS
// ============================================
async function loadAdminStatistics() {
    if (!isAdmin()) return;
    
    try {
        // Get all assessments
        const { data: assessments, error: assessmentError } = await supabase
            .from('assessments')
            .select('*');
        
        // Get all users
        const { data: users, error: userError } = await supabase
            .from('profiles')
            .select('*');
        
        if (assessmentError || userError) {
            console.error('Error loading stats:', assessmentError || userError);
            return;
        }
        
        // Calculate statistics
        const completedAssessments = assessments.filter(a => !a.is_draft).length;
        const draftAssessments = assessments.filter(a => a.is_draft).length;
        const activeUsers = users.filter(u => u.is_active !== false).length;
        const totalUsers = users.length;
        
        // Calculate average scores
        const completedWithResults = assessments.filter(a => !a.is_draft && a.results);
        const avgScore = completedWithResults.length > 0 
            ? Math.round(completedWithResults.reduce((sum, a) => sum + a.results.overallPercentage, 0) / completedWithResults.length)
            : 0;
        
        // Render statistics
        const html = `
            <div class="dimension-card">
                <h4>Total Assessments</h4>
                <div class="status-large" style="font-size: 2.5em; margin: 10px 0;">${assessments.length}</div>
                <div class="status-label">${completedAssessments} Completed | ${draftAssessments} Drafts</div>
            </div>
            <div class="dimension-card">
                <h4>Total Users</h4>
                <div class="status-large" style="font-size: 2.5em; margin: 10px 0;">${totalUsers}</div>
                <div class="status-label">${activeUsers} Active Users</div>
            </div>
            <div class="dimension-card">
                <h4>Average Score</h4>
                <div class="status-large" style="font-size: 2.5em; margin: 10px 0;">${avgScore}%</div>
                <div class="status-label">Overall LEAN Maturity</div>
            </div>
            <div class="dimension-card">
                <h4>Completion Rate</h4>
                <div class="status-large" style="font-size: 2.5em; margin: 10px 0;">
                    ${assessments.length > 0 ? Math.round((completedAssessments / assessments.length) * 100) : 0}%
                </div>
                <div class="status-label">${completedAssessments} of ${assessments.length}</div>
            </div>
        `;
        
        document.getElementById('adminStats').innerHTML = html;
        
    } catch (error) {
        console.error('Error loading admin statistics:', error);
    }
}

// ============================================
// ADMIN ASSESSMENTS MANAGEMENT
// ============================================
async function loadAdminAssessments() {
    if (!isAdmin()) return;
    
    try {
        const { data: assessments, error } = await supabase
            .from('assessments')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading assessments:', error);
            return;
        }
        
        allAssessmentsCache = assessments || [];
        renderAssessmentsTable(allAssessmentsCache);
        
    } catch (error) {
        console.error('Error loading admin assessments:', error);
    }
}

function renderAssessmentsTable(assessments) {
    if (assessments.length === 0) {
        document.getElementById('adminAssessmentsTable').innerHTML = 
            '<p style="text-align: center; color: #999; padding: 40px;">No assessments found.</p>';
        return;
    }
    
    let html = `
        <div style="overflow-x: auto;">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>User</th>
                        <th>Company</th>
                        <th>Assessor</th>
                        <th>Status</th>
                        <th>Overall Score</th>
                        <th>Dimensions</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    for (const assessment of assessments) {
        const date = new Date(assessment.created_at).toLocaleDateString();
        const status = assessment.is_draft ? 'Draft' : 'Completed';
        const statusColor = assessment.is_draft ? '#ffc107' : '#28a745';
        const score = assessment.results ? `${assessment.results.overallPercentage}%` : 'N/A';
        const statusClass = assessment.results ? getStatusClass(assessment.results.overallPercentage) : '';
        
        // Calculate average per dimension
        let dimensionScores = 'N/A';
        if (assessment.results && assessment.results.dimensions) {
            const avgDimension = Math.round(
                assessment.results.dimensions.reduce((sum, d) => sum + d.percentage, 0) / 
                assessment.results.dimensions.length
            );
            dimensionScores = `${avgDimension}% avg`;
        }
        
        html += `
            <tr>
                <td>${date}</td>
                <td>${assessment.user_email}<br><small>${assessment.user_name || 'N/A'}</small></td>
                <td>${assessment.company_name}</td>
                <td>${assessment.assessor_name}</td>
                <td><span style="background: ${statusColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${status}</span></td>
                <td><span class="${statusClass}" style="padding: 4px 8px; border-radius: 4px; color: white; font-weight: 600;">${score}</span></td>
                <td>${dimensionScores}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="viewAssessmentResults(${assessment.id})">View</button>
                    ${!assessment.is_draft ? `<button class="btn btn-sm btn-primary" onclick="exportAssessmentPDFById(${assessment.id})" title="Export PDF">📄</button>` : ''}
                </td>
            </tr>
        `;
    }
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    document.getElementById('adminAssessmentsTable').innerHTML = html;
}

function filterAssessments() {
    const userFilter = document.getElementById('filterUser').value.toLowerCase();
    const companyFilter = document.getElementById('filterCompany').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;
    
    let filtered = allAssessmentsCache.filter(assessment => {
        const matchesUser = !userFilter || 
            assessment.user_email.toLowerCase().includes(userFilter) ||
            (assessment.user_name && assessment.user_name.toLowerCase().includes(userFilter));
        
        const matchesCompany = !companyFilter || 
            assessment.company_name.toLowerCase().includes(companyFilter);
        
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'completed' && !assessment.is_draft) ||
            (statusFilter === 'draft' && assessment.is_draft);
        
        return matchesUser && matchesCompany && matchesStatus;
    });
    
    renderAssessmentsTable(filtered);
}

// ============================================
// ADMIN USER MANAGEMENT
// ============================================
async function loadAdminUsers() {
    if (!isAdmin()) return;
    
    try {
        const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading users:', error);
            return;
        }
        
        allUsersCache = users || [];
        renderUsersTable(allUsersCache);
        
    } catch (error) {
        console.error('Error loading admin users:', error);
    }
}

function renderUsersTable(users) {
    if (users.length === 0) {
        document.getElementById('adminUsersTable').innerHTML = 
            '<p style="text-align: center; color: #999; padding: 40px;">No users found.</p>';
        return;
    }
    
    let html = `
        <div style="overflow-x: auto;">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Full Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    for (const user of users) {
        const created = new Date(user.created_at).toLocaleDateString();
        const isActive = user.is_active !== false;
        const statusText = isActive ? 'Active' : 'Inactive';
        const statusColor = isActive ? '#28a745' : '#dc3545';
        const roleColor = user.role === 'admin' ? '#821874' : '#159eda';
        
        html += `
            <tr>
                <td>${user.full_name || 'N/A'}</td>
                <td>${user.email}</td>
                <td><span style="background: ${roleColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${user.role}</span></td>
                <td><span style="background: ${statusColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${statusText}</span></td>
                <td>${created}</td>
                <td>
                    ${isActive ? 
                        `<button class="btn btn-sm btn-danger" onclick="toggleUserStatus('${user.id}', false)">Deactivate</button>` :
                        `<button class="btn btn-sm btn-secondary" onclick="toggleUserStatus('${user.id}', true)">Activate</button>`
                    }
                    ${user.role !== 'admin' ? 
                        `<button class="btn btn-sm btn-primary" onclick="toggleUserRole('${user.id}', 'admin')">Make Admin</button>` :
                        user.id !== currentUser.id ? `<button class="btn btn-sm btn-secondary" onclick="toggleUserRole('${user.id}', 'user')">Remove Admin</button>` : ''
                    }
                </td>
            </tr>
        `;
    }
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    document.getElementById('adminUsersTable').innerHTML = html;
}

async function toggleUserStatus(userId, newStatus) {
    if (!isAdmin()) {
        alert('Unauthorized action');
        return;
    }
    
    const action = newStatus ? 'activate' : 'deactivate';
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ is_active: newStatus })
            .eq('id', userId);
        
        if (error) {
            console.error('Error updating user status:', error);
            alert('Failed to update user status');
            return;
        }
        
        alert(`User ${action}d successfully`);
        loadAdminUsers();
        
    } catch (error) {
        console.error('Error toggling user status:', error);
        alert('Failed to update user status');
    }
}

async function toggleUserRole(userId, newRole) {
    if (!isAdmin()) {
        alert('Unauthorized action');
        return;
    }
    
    const action = newRole === 'admin' ? 'promote to admin' : 'remove admin privileges from';
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);
        
        if (error) {
            console.error('Error updating user role:', error);
            alert('Failed to update user role');
            return;
        }
        
        alert(`User role updated successfully`);
        loadAdminUsers();
        
    } catch (error) {
        console.error('Error toggling user role:', error);
        alert('Failed to update user role');
    }
}

// ============================================
// VIEW INDIVIDUAL ASSESSMENT RESULTS
// ============================================
async function viewAssessmentResults(assessmentId) {
    try {
        const { data: assessment, error } = await supabase
            .from('assessments')
            .select('*')
            .eq('id', assessmentId)
            .single();
        
        if (error || !assessment) {
            alert('Assessment not found');
            return;
        }
        
        // Render assessment results
        renderIndividualResults(assessment);
        
        // Show results panel
        document.querySelectorAll('.panel').forEach(panel => panel.classList.remove('active'));
        document.getElementById('assessmentResultsPanel').classList.add('active');
        
    } catch (error) {
        console.error('Error loading assessment:', error);
        alert('Failed to load assessment');
    }
}

function renderIndividualResults(assessment) {
    const results = assessment.results;
    
    // Store full assessment for export
    window.currentIndividualAssessment = assessment;
    
    if (!results) {
        document.getElementById('individualResultsContainer').innerHTML = `
            <div class="data-warning">
                <h4>Draft Assessment</h4>
                <p>This assessment is still in draft status and has not been completed yet.</p>
            </div>
        `;
        document.getElementById('individualFeedbackSection').style.display = 'none';
        document.getElementById('individualDetailedScoresContainer').style.display = 'none';
        return;
    }
    
    const date = new Date(assessment.created_at).toLocaleDateString();
    
    let html = `
        <div class="status-overview">
            <h2>${assessment.company_name}</h2>
            <p>Assessed on ${date} by ${assessment.assessor_name}</p>
            <div class="progress-ring">
                <svg>
                    <circle class="background" cx="100" cy="100" r="85"></circle>
                    <circle class="progress" cx="100" cy="100" r="85" id="individualProgressCircle"></circle>
                </svg>
                <div class="progress-text">${results.overallPercentage}%</div>
            </div>
            <div class="status-large">${results.status}</div>
            <div>Overall Score: ${results.totalScore} / ${results.overallMaxScore}</div>
        </div>
        
        <h3 style="color: #821874; margin: 30px 0 20px 0;">Dimension Breakdown</h3>
        <div class="results-grid">
    `;
    
    for (const dim of results.dimensions) {
        const statusClass = getStatusClass(dim.percentage);
        html += `
            <div class="dimension-card">
                <h4>${dim.dimension}</h4>
                <div class="progress-container">
                    <div class="progress-bar ${statusClass}" style="width: ${dim.percentage}%;">
                        ${dim.percentage}%
                    </div>
                </div>
                <div class="status-label">${dim.score} / ${dim.maxScore}</div>
            </div>
        `;
    }
    
    html += `</div>`;
    
    document.getElementById('individualResultsContainer').innerHTML = html;
    
    // Generate and display feedback
    const feedback = generateFeedback(results);
    document.getElementById('individualFeedbackSection').innerHTML = feedback;
    document.getElementById('individualFeedbackSection').style.display = 'block';
    
    // Generate detailed scores
    const detailedScores = generateDetailedScores(assessment);
    document.getElementById('individualDetailedScoresContainer').innerHTML = detailedScores;
    document.getElementById('individualDetailedScoresContainer').style.display = 'block';
    
    // Update progress circle
    setTimeout(() => {
        const circumference = 2 * Math.PI * 85;
        const offset = circumference - (results.overallPercentage / 100) * circumference;
        const circle = document.getElementById('individualProgressCircle');
        if (circle) {
            circle.style.strokeDasharray = circumference;
            circle.style.strokeDashoffset = offset;
        }
    }, 100);
}

// ============================================
// EXPORT FUNCTIONS FOR ADMIN
// ============================================
async function exportAssessmentPDFById(assessmentId) {
    try {
        const { data: assessment, error } = await supabase
            .from('assessments')
            .select('*')
            .eq('id', assessmentId)
            .single();
        
        if (error || !assessment) {
            alert('Failed to load assessment data');
            return;
        }
        
        await generatePDFReport(assessment);
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to generate PDF');
    }
}

// Initialize admin dashboard when admin panel is shown
function initializeAdminDashboard() {
    if (!isAdmin()) return;
    
    loadAdminStatistics();
    loadAdminAssessments();
}
