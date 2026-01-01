// ============================================
// APPLICATION CONTROLLER
// ============================================

// ============================================
// DASHBOARD TAB SWITCHING
// ============================================
function showDashboardTab(tabName) {
    // Hide all tab contents
    document.getElementById('overviewTab').classList.remove('active');
    document.getElementById('detailedTab').classList.remove('active');
    document.getElementById('feedbackTab').classList.remove('active');
    
    // Remove active class from all tabs
    document.querySelectorAll('#dashboardTabs .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
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

// ============================================
// INDIVIDUAL RESULTS TAB SWITCHING
// ============================================
function showIndividualTab(tabName) {
    // Hide all tab contents
    document.getElementById('individualOverviewTab').classList.remove('active');
    document.getElementById('individualDetailedTab').classList.remove('active');
    document.getElementById('individualFeedbackTab').classList.remove('active');
    
    // Remove active class from all tabs
    document.querySelectorAll('#individualTabs .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
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
// PDF EXPORT FUNCTIONS FOR DASHBOARD
// ============================================
async function previewCurrentAssessmentPDF() {
    if (!currentAssessmentData || !currentAssessmentData.results) {
        alert('No assessment data to preview');
        return;
    }
    
    previewAssessment = currentAssessmentData;
    const previewContent = generatePDFPreviewHTML(currentAssessmentData);
    document.getElementById('pdfPreviewContent').innerHTML = previewContent;
    document.getElementById('pdfPreviewModal').style.display = 'block';
}

async function exportCurrentAssessmentPDF() {
    if (!currentAssessmentData || !currentAssessmentData.results) {
        alert('No assessment data to export');
        return;
    }
    
    await generatePDFReport(currentAssessmentData);
}

// ============================================
// PDF EXPORT FUNCTIONS FOR INDIVIDUAL RESULTS
// ============================================
async function previewIndividualAssessmentPDF() {
    if (!currentIndividualAssessment) {
        alert('No assessment data to preview');
        return;
    }
    
    previewAssessment = currentIndividualAssessment;
    const previewContent = generatePDFPreviewHTML(currentIndividualAssessment);
    document.getElementById('pdfPreviewContent').innerHTML = previewContent;
    document.getElementById('pdfPreviewModal').style.display = 'block';
}

async function exportIndividualAssessmentPDF() {
    if (!currentIndividualAssessment) {
        alert('No assessment data to export');
        return;
    }
    
    await generatePDFReport(currentIndividualAssessment);
}   