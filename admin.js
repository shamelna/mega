// ============================================
// ADMIN MODULE
// ============================================

let allAssessmentsCache = [];
let allUsersCache = [];

function loadAdminDashboard() {
    initializeAdminDashboard();
}

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

async function exportAllAssessmentsData() {
    if (!isAdmin()) {
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Unauthorized action');
        } else {
            alert('Unauthorized action');
        }
        return;
    }

    try {
        const snapshot = await db.collection('assessments').get();
        const assessments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
                const aDate = convertTimestamp(a.created_at);
                const bDate = convertTimestamp(b.created_at);
                const aTime = aDate ? aDate.getTime() : 0;
                const bTime = bDate ? bDate.getTime() : 0;
                return bTime - aTime;
            });

        if (!assessments.length) {
            if (typeof showErrorMessage === 'function') {
                showErrorMessage('No data to export');
            } else {
                alert('No data to export');
            }
            return;
        }

        let csv = 'Created Date,User Email,User Name,Company,Assessor,Status,Overall Percentage\n';

        assessments.forEach(a => {
            const created = convertTimestamp(a.created_at);
            const createdText = created ? created.toLocaleDateString() : '';
            const status = a.is_draft ? 'Draft' : 'Completed';
            const overall = a.results ? `${a.results.overallPercentage}%` : '';

            csv += `"${createdText}","${a.user_email || ''}","${a.user_name || ''}","${a.company_name || ''}","${a.assessor_name || ''}","${status}","${overall}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `ALL_LEAN_Assessments_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error exporting all assessments:', error);
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Error exporting data. Please try again.');
        } else {
            alert('Error exporting data. Please try again.');
        }
    }
}

// ============================================
// ADMIN STATISTICS
// ============================================
async function loadAdminStatistics() {
    if (!isAdmin()) return;
    
    try {
        const assessmentsSnapshot = await db.collection('assessments').get();
        const usersSnapshot = await db.collection('profiles').get();

        const assessments = assessmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
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
        const snapshot = await db.collection('assessments').get();
        const assessments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
                const aDate = convertTimestamp(a.created_at);
                const bDate = convertTimestamp(b.created_at);
                const aTime = aDate ? aDate.getTime() : 0;
                const bTime = bDate ? bDate.getTime() : 0;
                return bTime - aTime;
            });

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
        const createdDate = convertTimestamp(assessment.created_at);
        const date = createdDate ? createdDate.toLocaleDateString() : '';
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
                    <button class="btn btn-sm btn-secondary" onclick="viewAssessmentResults('${assessment.id}')">View</button>
                    ${!assessment.is_draft ? `<button class="btn btn-sm btn-primary" onclick="exportAssessmentPDFById('${assessment.id}')" title="Export PDF">📄</button>` : ''}
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
        const snapshot = await db.collection('profiles').get();
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
                const aDate = convertTimestamp(a.created_at);
                const bDate = convertTimestamp(b.created_at);
                const aTime = aDate ? aDate.getTime() : 0;
                const bTime = bDate ? bDate.getTime() : 0;
                return bTime - aTime;
            });

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
        const createdDate = convertTimestamp(user.created_at);
        const created = createdDate ? createdDate.toLocaleDateString() : '';
        const isActive = user.is_active !== false;
        const statusText = isActive ? 'Active' : 'Inactive';
        const statusColor = isActive ? '#059669' : '#dc2626';
        const roleColor = user.role === 'admin' ? '#821874' : '#159eda';
        
        const userName = (user.display_name || user.full_name || 'N/A').replace(/'/g, "\\'");
        const userEmail = user.email.replace(/'/g, "\\'");
        
        html += `
            <tr>
                <td>${user.display_name || user.full_name || 'N/A'}</td>
                <td>${user.email}</td>
                <td><span style="background: ${roleColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${user.role}</span></td>
                <td><span style="background: ${statusColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${statusText}</span></td>
                <td>${created}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="showEditUserModal('${user.id}', '${userName}', '${userEmail}')">✏️ Edit</button>
                    ${isActive ? 
                        `<button class="btn btn-sm btn-danger" onclick="toggleUserStatus('${user.id}', false)">Deactivate</button>` :
                        `<button class="btn btn-sm btn-secondary" onclick="toggleUserStatus('${user.id}', true)">Activate</button>`
                    }
                    ${user.role !== 'admin' ? 
                        `<button class="btn btn-sm btn-primary" onclick="toggleUserRole('${user.id}', 'admin')">Make Admin</button>` :
                        user.id !== currentUser.uid ? `<button class="btn btn-sm btn-secondary" onclick="toggleUserRole('${user.id}', 'user')">Remove Admin</button>` : ''
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
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Unauthorized action');
        } else {
            alert('Unauthorized action');
        }
        return;
    }
    
    const action = newStatus ? 'activate' : 'deactivate';
    if (!await showAdminActionConfirmation('user status', `${action} this user`)) {
        return;
    }
    
    try {
        await db.collection('profiles').doc(userId).update({
            is_active: newStatus,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        if (typeof showSuccessMessage === 'function') {
            showSuccessMessage(`✓ User ${action}d successfully`);
        } else {
            alert(`User ${action}d successfully`);
        }
        loadAdminUsers();
        
    } catch (error) {
        console.error('Error toggling user status:', error);
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Failed to update user status');
        } else {
            alert('Failed to update user status');
        }
    }
}

async function toggleUserRole(userId, newRole) {
    if (!isAdmin()) {
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Unauthorized action');
        } else {
            alert('Unauthorized action');
        }
        return;
    }
    
    const action = newRole === 'admin' ? 'promote to admin' : 'remove admin privileges from';
    if (!await showAdminActionConfirmation('user role', `${action} this user`)) {
        return;
    }
    
    try {
        await db.collection('profiles').doc(userId).update({
            role: newRole,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        if (typeof showSuccessMessage === 'function') {
            showSuccessMessage('✓ User role updated successfully');
        } else {
            alert('User role updated successfully');
        }
        
        loadAdminUsers();
        
    } catch (error) {
        console.error('Error toggling user role:', error);
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Failed to update user role');
        } else {
            alert('Failed to update user role');
        }
    }
}

// ============================================
// ADMIN ACTION CONFIRMATION MODAL
// ============================================
async function showAdminActionConfirmation(actionType, message) {
    return new Promise((resolve) => {
        // Create modal if it doesn't exist
        let modal = document.getElementById('adminActionConfirmModal');
        if (modal) {
            modal.remove();
        }
        
        modal = document.createElement('div');
        modal.id = 'adminActionConfirmModal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 9999;
            overflow: auto;
        `;
        
        modal.innerHTML = `
            <div style="position: relative; max-width: 400px; margin: 100px auto; background: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                <div style="background: linear-gradient(135deg, #821874 0%, #159eda 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h2 style="margin: 0;">⚙️ Admin Action</h2>
                </div>
                <div style="padding: 30px; text-align: center;">
                    <p style="margin-bottom: 20px; color: #2d2d2d;">Are you sure you want to ${message}?</p>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button onclick="closeAdminActionConfirmModal(false)" class="btn btn-secondary" style="min-width: 100px;">Cancel</button>
                        <button onclick="closeAdminActionConfirmModal(true)" class="btn btn-primary" style="min-width: 100px;">Confirm</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        // Store resolve function for button clicks
        window.adminActionConfirmResolve = resolve;
    });
}

function closeAdminActionConfirmModal(confirmed) {
    const modal = document.getElementById('adminActionConfirmModal');
    if (modal) {
        modal.remove();
    }
    
    if (window.adminActionConfirmResolve) {
        window.adminActionConfirmResolve(confirmed);
        delete window.adminActionConfirmResolve;
    }
}

// ============================================
// VIEW INDIVIDUAL ASSESSMENT RESULTS
// ============================================
async function viewAssessmentResults(assessmentId) {
    try {
        console.log('viewAssessmentResults called with ID:', assessmentId);
        
        const doc = await db.collection('assessments').doc(assessmentId).get();
        if (!doc.exists) {
            console.log('Assessment not found in database');
            if (typeof showErrorMessage === 'function') {
                showErrorMessage('Assessment not found');
            } else {
                alert('Assessment not found');
            }
            return;
        }

        const assessment = { id: doc.id, ...doc.data() };
        console.log('Assessment data loaded:', assessment);
        
        // Render assessment results
        console.log('Calling renderIndividualResults...');
        renderIndividualResults(assessment);
        
        // Show results panel
        console.log('Switching to assessmentResultsPanel...');
        document.querySelectorAll('.panel').forEach(panel => panel.classList.remove('active'));
        
        const resultsPanel = document.getElementById('assessmentResultsPanel');
        if (resultsPanel) {
            resultsPanel.classList.add('active');
            console.log('assessmentResultsPanel activated');
            console.log('Panel classes:', resultsPanel.className);
            console.log('Panel display style:', window.getComputedStyle(resultsPanel).display);
        } else {
            console.error('assessmentResultsPanel not found in DOM');
        }
        
        // Check tab visibility
        const overviewTab = document.getElementById('individualOverviewTab');
        if (overviewTab) {
            console.log('Overview tab classes:', overviewTab.className);
            console.log('Overview tab display style:', window.getComputedStyle(overviewTab).display);
        } else {
            console.error('individualOverviewTab not found');
        }
        
        const resultsContainer = document.getElementById('individualResultsContainer');
        if (resultsContainer) {
            console.log('Results container display style:', window.getComputedStyle(resultsContainer).display);
            console.log('Results container content:', resultsContainer.innerHTML.substring(0, 100) + '...');
        } else {
            console.error('individualResultsContainer not found');
        }
        
    } catch (error) {
        console.error('Error loading assessment:', error);
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Failed to load assessment');
        } else {
            alert('Failed to load assessment');
        }
    }
}

function renderIndividualResults(assessment) {
    console.log('renderIndividualResults called with:', assessment);
    
    const results = assessment.results;
    
    // Store full assessment for export
    window.currentIndividualAssessment = assessment;
    console.log('Stored assessment in window.currentIndividualAssessment');
    
    if (!results) {
        console.log('No results found - showing draft message');
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
    
    console.log('Results found, processing...');
    
    // Handle date properly - check if it's a Firestore Timestamp or regular date
    let date = 'Unknown';
    if (assessment.created_at) {
        try {
            if (assessment.created_at.toDate) {
                // Firestore Timestamp
                date = assessment.created_at.toDate().toLocaleDateString();
            } else if (assessment.assessment_date) {
                // Use assessment_date as fallback
                date = new Date(assessment.assessment_date).toLocaleDateString();
            } else {
                // Try regular date conversion
                date = new Date(assessment.created_at).toLocaleDateString();
            }
        } catch (dateError) {
            console.warn('Date conversion error:', dateError);
            date = 'Invalid Date';
        }
    }
    
    console.log('Using date:', date);
    
    console.log('Generating HTML...');
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
    
    console.log('Processing dimensions...');
    // Use the original data structure - check if we have dimension_scores or dimensions
    const dimensionData = results.dimension_scores || results.dimensions || [];
    
    for (let i = 0; i < dimensionData.length; i++) {
        const dim = dimensionData[i];
        // Handle both data structures
        let percentage, score, dimensionName, maxScore;
        
        if (results.dimension_scores) {
            // Old data structure
            percentage = (dim / 5) * 100;
            score = dim;
            dimensionName = getDimensionName(i);
            maxScore = 5;
        } else {
            // New data structure
            percentage = dim.percentage || 0;
            score = dim.score || 0;
            dimensionName = dim.dimension || `Dimension ${i + 1}`;
            maxScore = dim.maxScore || 5;
        }
        
        const statusClass = getStatusClass(percentage);
        html += `
            <div class="dimension-card">
                <h4>${dimensionName}</h4>
                <div class="progress-container">
                    <div class="progress-bar ${statusClass}" style="width: ${percentage}%;">
                        ${percentage.toFixed(1)}%
                    </div>
                </div>
                <div class="status-label">${score.toFixed(2)} / ${maxScore}</div>
            </div>
        `;
    }
    
    html += `</div>`;
    console.log('HTML generated, updating DOM...');
    
    const resultsContainer = document.getElementById('individualResultsContainer');
    if (resultsContainer) {
        resultsContainer.innerHTML = html;
        console.log('individualResultsContainer updated');
        
        // Check if container is actually visible
        const containerStyle = window.getComputedStyle(resultsContainer);
        const containerRect = resultsContainer.getBoundingClientRect();
        console.log('Container visibility check:');
        console.log('- Display:', containerStyle.display);
        console.log('- Visibility:', containerStyle.visibility);
        console.log('- Opacity:', containerStyle.opacity);
        console.log('- Rect:', containerRect);
        
        if (containerRect.width === 0 || containerRect.height === 0) {
            console.warn('Container has zero dimensions, forcing visibility');
            resultsContainer.style.display = 'block';
            resultsContainer.style.visibility = 'visible';
            resultsContainer.style.opacity = '1';
        }
    } else {
        console.error('individualResultsContainer not found');
    }
    
    // Generate and display feedback
    console.log('Generating feedback...');
    try {
        const feedback = generateFeedback(results);
        const feedbackSection = document.getElementById('individualFeedbackSection');
        if (feedbackSection) {
            feedbackSection.innerHTML = feedback;
            feedbackSection.style.display = 'block';
            console.log('individualFeedbackSection updated');
        } else {
            console.error('individualFeedbackSection not found');
        }
    } catch (error) {
        console.error('Error generating feedback:', error);
    }
    
    // Initialize detailed scores and feedback sections with original functions
    const detailedContainer = document.getElementById('individualDetailedScoresContainer');
    const feedbackContainer = document.getElementById('individualFeedbackSection');
    
    if (detailedContainer) {
        detailedContainer.innerHTML = generateDetailedScores(assessment);
        detailedContainer.style.display = 'none'; // Hidden by default
    }
    
    if (feedbackContainer) {
        feedbackContainer.innerHTML = generateFeedback(results);
        feedbackContainer.style.display = 'none'; // Hidden by default
    }
    
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
        const doc = await db.collection('assessments').doc(assessmentId).get();
        if (!doc.exists) {
            if (typeof showErrorMessage === 'function') {
                showErrorMessage('Failed to load assessment data');
            } else {
                alert('Failed to load assessment data');
            }
            return;
        }

        const assessment = { id: doc.id, ...doc.data() };
        
        try {
            // Use the simple PDF generation from app.js
            if (typeof generateSimplePDF === 'function') {
                await generateSimplePDF(assessment);
            } else {
                throw new Error('PDF generation function not available');
            }
        } catch (pdfError) {
            console.error('PDF generation error:', pdfError);
            if (typeof showErrorMessage === 'function') {
                showErrorMessage('Failed to generate PDF: ' + pdfError.message);
            } else {
                alert('Failed to generate PDF: ' + pdfError.message);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Failed to generate PDF');
        } else {
            alert('Failed to generate PDF');
        }
    }
}

// Initialize admin dashboard when admin panel is shown
function initializeAdminDashboard() {
    if (!isAdmin()) return;
    
    loadAdminStatistics();
    loadAdminAssessments();
}

// ============================================
// EDIT USER FUNCTIONS
// ============================================
function showEditUserModal(userId, userName, userEmail) {
    document.getElementById('editUserId').value = userId;
    document.getElementById('editUserName').value = userName.replace(/\\'/g, "'");
    document.getElementById('editUserEmail').value = userEmail.replace(/\\'/g, "'");
    const passwordEl = document.getElementById('editUserPassword');
    if (passwordEl) passwordEl.value = '';
    
    // Hide error/success messages
    document.getElementById('editUserError').style.display = 'none';
    document.getElementById('editUserSuccess').style.display = 'none';
    
    document.getElementById('editUserModal').style.display = 'block';
}

function closeEditUserModal() {
    document.getElementById('editUserModal').style.display = 'none';
    document.getElementById('editUserId').value = '';
    document.getElementById('editUserName').value = '';
    document.getElementById('editUserEmail').value = '';
    document.getElementById('editUserPassword').value = '';
}

async function saveUserEdit() {
    const userId = document.getElementById('editUserId').value;
    const newName = document.getElementById('editUserName').value.trim();
    const newEmail = document.getElementById('editUserEmail').value.trim();
    const newPassword = document.getElementById('editUserPassword').value;
    
    const errorDiv = document.getElementById('editUserError');
    const successDiv = document.getElementById('editUserSuccess');
    
    // Hide previous messages
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    // Validate inputs
    if (!newName) {
        errorDiv.textContent = 'Full name is required';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (!newEmail) {
        errorDiv.textContent = 'Email is required';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (!newEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        errorDiv.textContent = 'Please enter a valid email address';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (newPassword) {
        errorDiv.textContent = 'Password updates are not supported from the client app. Use Firebase Admin SDK (server) if needed.';
        errorDiv.style.display = 'block';
        return;
    }
    
    const saveBtn = event.target;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="loading-spinner"></span> Saving...';
    
    try {
        await db.collection('profiles').doc(userId).update({
            display_name: newName,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });

        if (newEmail) {
            console.warn('Email updates are not supported from the client app.');
        }

        successDiv.textContent = 'User details updated successfully!';
        successDiv.style.display = 'block';
        
        // Reload users table
        setTimeout(() => {
            closeEditUserModal();
            loadAdminUsers();
        }, 2000);
        
    } catch (error) {
        console.error('Error updating user:', error);
        errorDiv.textContent = 'Failed to update user: ' + error.message;
        errorDiv.style.display = 'block';
        saveBtn.disabled = false;
        saveBtn.innerHTML = '💾 Save Changes';
    }
}
