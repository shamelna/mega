// ============================================
// MAIN APP MODULE
// ============================================

// ============================================
// PANEL MANAGEMENT
// ============================================
function showPanel(panelName) {
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // Remove active class from all panels
    document.querySelectorAll('.panel').forEach(panel => panel.classList.remove('active'));
    
    switch(panelName) {
        case 'assessment':
            document.getElementById('assessmentPanel').classList.add('active');
            document.querySelector('[onclick*="assessment"]').classList.add('active');
            break;
        case 'dashboard':
            document.getElementById('dashboardPanel').classList.add('active');
            document.querySelector('[onclick*="dashboard"]').classList.add('active');
            loadDashboard();
            break;
        case 'saved':
            document.getElementById('savedPanel').classList.add('active');
            document.querySelector('[onclick*="saved"]').classList.add('active');
            loadSavedAssessments();
            break;
        case 'manual':
            document.getElementById('manualPanel').classList.add('active');
            document.querySelector('[onclick*="manual"]').classList.add('active');
            break;
        case 'admin':
            document.getElementById('adminPanel').classList.add('active');
            document.getElementById('adminNav').classList.add('active');
            initializeAdminDashboard();
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
    
    // Show export PDF button
    document.getElementById('exportDashboardPDF').style.display = 'inline-block';
    
    // Store current assessment ID for export
    window.currentDashboardAssessmentId = latestAssessment.id;

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
    document.getElementById('enhancedResultsGrid').innerHTML = html;
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
// EXPORT WRAPPER FUNCTIONS
// ============================================
async function exportCurrentAssessmentPDF() {
    if (!window.currentDashboardAssessmentId) {
        alert('No assessment data available');
        return;
    }
    
    try {
        const { data: assessment, error } = await supabase
            .from('assessments')
            .select('*')
            .eq('id', window.currentDashboardAssessmentId)
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

async function exportIndividualAssessmentPDF() {
    if (!window.currentIndividualAssessmentId) {
        alert('No assessment data available');
        return;
    }
    
    try {
        const { data: assessment, error } = await supabase
            .from('assessments')
            .select('*')
            .eq('id', window.currentIndividualAssessmentId)
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
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
    renderAssessmentForm();
    document.getElementById('assessmentDate').value = new Date().toISOString().split('T')[0];
});
