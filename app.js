// ============================================
// MAIN APP MODULE
// ============================================

// ============================================
// PANEL MANAGEMENT
// ============================================
function showPanel(panelName) {
    // Remove active class from all nav buttons (only if they exist)
    const navButtons = document.querySelectorAll('.nav-btn');
    if (navButtons) {
        navButtons.forEach(btn => btn.classList.remove('active'));
    }
    
    // Remove active class from all panels (only if they exist)
    const panels = document.querySelectorAll('.panel');
    if (panels) {
        panels.forEach(panel => panel.classList.remove('active'));
    }
    
    switch(panelName) {
        case 'assessment':
            const assessmentPanel = document.getElementById('assessmentPanel');
            const assessmentBtn = document.querySelector('[onclick*="assessment"]');
            if (assessmentPanel) assessmentPanel.classList.add('active');
            if (assessmentBtn) assessmentBtn.classList.add('active');
            break;
        case 'dashboard':
            const dashboardPanel = document.getElementById('dashboardPanel');
            const dashboardBtn = document.querySelector('[onclick*="dashboard"]');
            if (dashboardPanel) dashboardPanel.classList.add('active');
            if (dashboardBtn) dashboardBtn.classList.add('active');
            loadDashboard();
            break;
        case 'saved':
            const savedPanel = document.getElementById('savedPanel');
            const savedBtn = document.querySelector('[onclick*="saved"]');
            if (savedPanel) savedPanel.classList.add('active');
            if (savedBtn) savedBtn.classList.add('active');
            loadSavedAssessments();
            break;
        case 'manual':
            const manualPanel = document.getElementById('manualPanel');
            const manualBtn = document.querySelector('[onclick*="manual"]');
            if (manualPanel) manualPanel.classList.add('active');
            if (manualBtn) manualBtn.classList.add('active');
            break;
        case 'admin':
            const adminPanel = document.getElementById('adminPanel');
            const adminNav = document.getElementById('adminNav');
            if (adminPanel) adminPanel.classList.add('active');
            if (adminNav) adminNav.classList.add('active');
            if (typeof initializeAdminDashboard === 'function') {
                initializeAdminDashboard();
            }
            break;
    }
}

// ============================================
// DATA LOADING
// ============================================
async function loadUserAssessments() {
    if (!currentUser) return [];
    
    try {
        let query = supabase.from('assessments').select('*');
        
        if (!isAdmin()) {
            query = query.eq('user_email', currentUser.email);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) {
            console.error('Load error:', error.message || error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Exception:', error?.message || error);
        return [];
    }
}

async function loadDashboard() {
    const assessments = await loadUserAssessments();
    
    // Filter to only completed assessments
    const completedAssessments = assessments.filter(a => !a.is_draft && a.results);
    
    if (completedAssessments.length === 0) {
        document.getElementById('statusLarge').textContent = 'Not Assessed';
        document.getElementById('statusDescription').textContent = 'Complete an assessment to see your organization\'s LEAN maturity level';
        document.getElementById('progressText').textContent = '0%';
        document.getElementById('enhancedResultsGrid').innerHTML = '';
        document.getElementById('assessmentDetails').style.display = 'none';
        return;
    }

    // Show only the last COMPLETED assessment
    const latestAssessment = completedAssessments[0];
    const results = latestAssessment.results;
    
    // Display assessment details
    const assessmentDate = new Date(latestAssessment.assessment_date || latestAssessment.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    document.getElementById('assessmentDetails').style.display = 'block';
    document.getElementById('assessmentDetails').innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div>
                <div style="font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 5px;">Company</div>
                <div style="font-weight: 600; color: #821874; font-size: 16px;">${latestAssessment.company_name}</div>
            </div>
            <div>
                <div style="font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 5px;">Assessed By</div>
                <div style="font-weight: 600; color: #159eda; font-size: 16px;">${latestAssessment.assessor_name}</div>
            </div>
            <div>
                <div style="font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 5px;">Assessment Date</div>
                <div style="font-weight: 600; color: #2d2d2d; font-size: 16px;">${assessmentDate}</div>
            </div>
        </div>
    `;

    document.getElementById('statusLarge').textContent = results.status;
    document.getElementById('statusDescription').textContent = `Overall Score: ${results.overallPercentage}%`;
    document.getElementById('progressText').textContent = results.overallPercentage + '%';

    const circumference = 2 * Math.PI * 85;
    const offset = circumference - (results.overallPercentage / 100) * circumference;
    document.getElementById('progressCircle').style.strokeDasharray = circumference;
    document.getElementById('progressCircle').style.strokeDashoffset = offset;
    
    // Generate and display feedback
    const feedback = generateFeedback(results);
    document.getElementById('feedbackSection').innerHTML = feedback;
    document.getElementById('feedbackSection').style.display = 'block';
    
    // Add What's Next section to the overview tab
    document.getElementById('dashboardTabs').style.display = 'flex';
    document.getElementById('previewDashboardPDF').style.display = 'inline-block';
    document.getElementById('exportDashboardPDF').style.display = 'inline-block';
    
    // Store current assessment for export
    window.currentDashboardAssessment = latestAssessment;

    // Ensure the Overview tab is active
    showDashboardTab('overview');

    let html = '';
    for (const dim of results.dimensions) {
        const status = getStatusClass(dim.percentage);
        html += `
            <div class="dimension-card">
                <h4>${dim.dimension}</h4>
                <div class="progress-container">
                    <div class="progress-bar ${status}" style="width: ${dim.percentage}%;">
                        ${dim.percentage}%
                    </div>
                </div>
                <div class="status-label">${dim.score} / ${dim.maxScore}</div>
            </div>
        `;
    }
    // Add What's Next section before the dimension cards
    const whatsNextHTML = `
        <div class="whats-next-container" style="margin-bottom: 30px; padding: 25px; background: #f8f9fa; border-radius: 10px; border-left: 4px solid #821874;">
            <h2 style="color: #821874; margin-top: 0;">🚀 What's Next?</h2>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #2d2d2d; margin-bottom: 10px;">1. Review your detailed assessment report</h3>
                <p style="margin: 5px 0 0 20px; color: #555;">Take time to review your comprehensive assessment results and export the PDF report for your reference.</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #2d2d2d; margin-bottom: 10px;">2. Schedule a Consultation</h3>
                <p style="margin: 5px 0 0 20px; color: #555;">Contact Barry Taylor to discuss your results and create a customized improvement plan:</p>
                <div style="margin: 10px 0 0 40px;">
                    <a href="mailto:barry.taylor@midulstermega.com" class="btn" style="display: inline-block; padding: 8px 15px; background: #159eda; color: white; text-decoration: none; border-radius: 4px; font-weight: 500;">
                        ✉️ Contact Barry Taylor
                    </a>
                </div>
            </div>
            
            <div style="margin-bottom: 10px;">
                <h3 style="color: #2d2d2d; margin-bottom: 10px;">3. Explore Training Options</h3>
                <p style="margin: 5px 0 0 20px; color: #555;">We offer flexible training programs tailored to your needs:</p>
                <ul style="margin: 5px 0 0 40px; color: #555;">
                    <li>Team Training (5-10 people)</li>
                    <li>Individual Certification</li>
                    <li>Customized Workshops</li>
                </ul>
                <p style="margin: 10px 0 0 20px; color: #555; font-style: italic;">
                    Special Offer: Contact Barry Taylor for information about special pricing and packages available for MEGA.
                </p>
                <p style="margin: 15px 0 0 20px;">
                    <a href="https://mega.kaizenacademy.education" target="_blank" style="color: #159eda; text-decoration: none; font-weight: 500;">
                        Learn more: MEGA Website
                    </a> | 
                    <a href="https://kaizenacademy.education" target="_blank" style="color: #159eda; text-decoration: none; font-weight: 500;">
                        Kaizen Academy
                    </a>
                </p>
            </div>
        </div>
    `;

    // Create the dimensions container
    const dimensionsHTML = `
        <div class="dimensions-container">
            <h2 style="color: #821874; margin-bottom: 20px;">Dimension Breakdown</h2>
            <div class="dimensions-grid">
                ${html}
            </div>
        </div>
    `;
    
    // Clear and set the content
    const enhancedResultsGrid = document.getElementById('enhancedResultsGrid');
    enhancedResultsGrid.innerHTML = ''; // Clear existing content
    
    // Append the What's Next section and dimensions
    enhancedResultsGrid.insertAdjacentHTML('beforeend', whatsNextHTML);
    enhancedResultsGrid.insertAdjacentHTML('beforeend', dimensionsHTML);
    
    // Make sure the tab is visible
    document.getElementById('dashboardTabs').style.display = 'flex';
    document.getElementById('overviewTab').style.display = 'block';
    
    // Force a reflow to ensure the content is displayed
    void enhancedResultsGrid.offsetHeight;
}

async function loadSavedAssessments() {
    const assessments = await loadUserAssessments();
    
    let html = '';
    if (assessments.length === 0) {
        html = '<p style="text-align: center; color: #999;">No assessments found. Create one to get started!</p>';
    } else {
        for (const assessment of assessments) {
            const date = new Date(assessment.created_at).toLocaleDateString();
            const status = assessment.is_draft ? 'Draft' : 'Completed';
            const statusColor = assessment.is_draft ? '#ffc107' : '#28a745';
            
            html += `
                <div class="assessment-item">
                    <div>
                        <strong>${assessment.company_name}</strong><br>
                        <small style="color: #999;">Assessed on ${date} by ${assessment.assessor_name}</small><br>
                        <span style="display: inline-block; background: ${statusColor}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px; margin-top: 5px;">${status}</span>
                    </div>
                    <div class="assessment-actions">
                        ${!assessment.is_draft ? `<button class="btn btn-sm btn-primary" onclick="viewAssessmentResults(${assessment.id})">View Results</button>` : ''}
                        <button class="btn btn-sm btn-secondary" onclick="loadAssessmentForEdit(${assessment.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteAssessment(${assessment.id})">Delete</button>
                    </div>
                </div>
            `;
        }
    }
    document.getElementById('savedAssessments').innerHTML = html;
}

async function deleteAssessment(id) {
    try {
        if (confirm('Are you sure you want to delete this assessment?')) {
            const { error } = await supabase
                .from('assessments')
                .delete()
                .eq('id', id);
            
            if (error) {
                console.error('Delete error:', error);
                alert('Error: ' + (error.message || 'Could not delete'));
                return;
            }
            
            alert('✓ Deleted successfully!');
            await loadSavedAssessments();
        }
    } catch (error) {
        console.error('Exception:', error);
        alert('Error: ' + (error?.message || 'Unknown error'));
    }
}

async function loadAssessmentForEdit(id) {
    try {
        const { data: assessment, error } = await supabase
            .from('assessments')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error || !assessment) {
            alert('Assessment not found.');
            return;
        }
        
        if (!isAdmin() && assessment.user_email !== currentUser.email) {
            alert('You do not have permission to edit this assessment.');
            return;
        }
        
        if (assessment && assessment.responses) {
            currentAssessmentId = assessment.id;
            
            document.getElementById('companyName').value = assessment.responses.companyName || '';
            document.getElementById('assessorName').value = assessment.responses.assessorName || '';
            document.getElementById('assessmentDate').value = assessment.responses.assessmentDate || '';
            
            for (let i = 1; i <= 35; i++) {
                if (assessment.responses[`q${i}`]) {
                    const radio = document.querySelector(`input[name="q${i}"][value="${assessment.responses[`q${i}`]}"]`);
                    if (radio) {
                        radio.checked = true;
                        radio.closest('.radio-option').style.background = '#fef5fe';
                        radio.closest('.radio-option').style.borderColor = '#821874';
                    }
                }
            }
            
            showPanel('assessment');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error: Could not load assessment');
    }
}

// Deprecated - now using initializeAdminDashboard from admin.js
// Keeping for backward compatibility
async function loadAdminDashboard() {
    initializeAdminDashboard();
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const activeElement = document.activeElement;
        
        if (activeElement.id === 'signinPassword') {
            handleSignIn();
        } else if (activeElement.id === 'signupPasswordConfirm') {
            handleSignUp();
        } else if (activeElement.id === 'resetEmail') {
            handlePasswordReset();
        }
    }
});

// ============================================
// TAB SWITCHING FUNCTIONS
// ============================================
function showDashboardTab(tabName) {
    // Hide all tabs
    document.getElementById('overviewTab').classList.remove('active');
    document.getElementById('detailedTab').classList.remove('active');
    document.getElementById('feedbackTab').classList.remove('active');
    
    // Remove active from all buttons
    document.querySelectorAll('#dashboardTabs .tab').forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    if (tabName === 'overview') {
        document.getElementById('overviewTab').classList.add('active');
        document.querySelectorAll('#dashboardTabs .tab')[0].classList.add('active');
    } else if (tabName === 'detailed') {
        document.getElementById('detailedTab').classList.add('active');
        document.querySelectorAll('#dashboardTabs .tab')[1].classList.add('active');
    } else if (tabName === 'feedback') {
        document.getElementById('feedbackTab').classList.add('active');
        document.querySelectorAll('#dashboardTabs .tab')[2].classList.add('active');
    }
}

function showIndividualTab(tabName) {
    // Hide all tabs
    document.getElementById('individualOverviewTab').classList.remove('active');
    document.getElementById('individualDetailedTab').classList.remove('active');
    document.getElementById('individualFeedbackTab').classList.remove('active');
    
    // Remove active from all buttons
    document.querySelectorAll('#individualTabs .tab').forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    if (tabName === 'overview') {
        document.getElementById('individualOverviewTab').classList.add('active');
        document.querySelectorAll('#individualTabs .tab')[0].classList.add('active');
    } else if (tabName === 'detailed') {
        document.getElementById('individualDetailedTab').classList.add('active');
        document.querySelectorAll('#individualTabs .tab')[1].classList.add('active');
    } else if (tabName === 'feedback') {
        document.getElementById('individualFeedbackTab').classList.add('active');
        document.querySelectorAll('#individualTabs .tab')[2].classList.add('active');
    }
}

// ============================================
// EXPORT WRAPPER FUNCTIONS
// ============================================
async function previewCurrentAssessmentPDF() {
    if (!window.currentDashboardAssessment) {
        alert('No assessment data available');
        return;
    }
    
    await showPDFPreview(window.currentDashboardAssessment);
}

async function exportCurrentAssessmentPDF() {
    if (!window.currentDashboardAssessment) {
        alert('No assessment data available');
        return;
    }
    
    await generatePDFReport(window.currentDashboardAssessment);
}

async function previewIndividualAssessmentPDF() {
    if (!window.currentIndividualAssessment) {
        alert('No assessment data available');
        return;
    }
    
    await showPDFPreview(window.currentIndividualAssessment);
}

async function exportIndividualAssessmentPDF() {
    if (!window.currentIndividualAssessment) {
        alert('No assessment data available');
        return;
    }
    
    await generatePDFReport(window.currentIndividualAssessment);
}

async function exportAllAssessmentsData() {
    if (!isAdmin()) {
        alert('Unauthorized action');
        return;
    }
    
    try {
        const { data: assessments, error } = await supabase
            .from('assessments')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!assessments || assessments.length === 0) {
            alert('No data to export');
            return;
        }
        
        // Use the same export function but with all assessments
        await exportAssessmentDataWithArray(assessments);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to export data');
    }
}

async function exportAssessmentDataWithArray(assessments) {
    try {
        // Create CSV
        let csv = 'Company,Assessor,User Email,Date,Status,Overall Score,Overall Percentage,Maturity Level,';
        csv += 'Leadership & Culture,Customer Value Focus,Process Efficiency,Waste Elimination,';
        csv += 'Continuous Improvement,Flow & Pull Systems,Problem Solving\n';
        
        assessments.forEach(assessment => {
            const date = new Date(assessment.assessment_date || assessment.created_at).toLocaleDateString();
            const status = assessment.is_draft ? 'Draft' : 'Completed';
            
            csv += `"${assessment.company_name}","${assessment.assessor_name}","${assessment.user_email}","${date}","${status}",`;
            
            if (assessment.results) {
                const r = assessment.results;
                csv += `${r.totalScore},${r.overallPercentage}%,"${r.status}",`;
                
                // Add dimension scores
                r.dimensions.forEach((dim, index) => {
                    csv += `${dim.percentage}%`;
                    if (index < r.dimensions.length - 1) csv += ',';
                });
            } else {
                csv += 'N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A';
            }
            
            csv += '\n';
        });
        
        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `All_LEAN_Assessments_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Error exporting data. Please try again.');
    }
}

// ============================================
// SUPABASE KEEP-ALIVE FUNCTIONALITY
// ============================================
function setupSupabaseKeepAlive() {
    // Function to ping Supabase
    const pingSupabase = async () => {
        try {
            // Make a simple query to a small table
            const { data, error } = await supabase
                .from('assessments')
                .select('id')
                .limit(1);
            
            if (error) {
                console.error('Keep-alive ping failed:', error.message);
                return;
            }
            
            console.log('Keep-alive ping successful at:', new Date().toISOString());
            return true;
        } catch (error) {
            console.error('Keep-alive error:', error.message);
            return false;
        }
    };

    // Run immediately when the app loads
    pingSupabase().then(success => {
        if (success) {
            console.log('Initial keep-alive ping successful');
        }
    });

    // Set up the interval (24 hours in milliseconds)
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    setInterval(pingSupabase, TWENTY_FOUR_HOURS);

    // Additional safety: ping when the tab becomes visible after being in background
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            pingSupabase();
        }
    });
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
    renderAssessmentForm();
    document.getElementById('assessmentDate').value = new Date().toISOString().split('T')[0];
    
    // Initialize keep-alive functionality if Supabase is available
    if (typeof supabase !== 'undefined') {
        setupSupabaseKeepAlive();
    }
});
