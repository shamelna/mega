// ============================================
// ASSESSMENT MODULE
// ============================================

let currentAssessmentData = {};

// ============================================
// DASHBOARD RESULTS DISPLAY
// ============================================
function loadDashboardResults() {
    if (!currentAssessmentData || !currentAssessmentData.results) {
        console.log('No assessment data to display');
        return;
    }
    
    const results = currentAssessmentData.results;
    const overallScore = results.overall_score || 0;
    const overallPercentage = (overallScore / 5) * 100;
    
    // Update dashboard overview
    const overviewContent = document.getElementById('overviewTab');
    if (overviewContent) {
        overviewContent.innerHTML = `
            <div class="status-overview" style="text-align: center; padding: 30px;">
                <div class="progress-ring">
                    <svg>
                        <circle class="background" cx="100" cy="100" r="85"></circle>
                        <circle class="progress" cx="100" cy="100" r="85" id="progressCircle"></circle>
                    </svg>
                    <div class="progress-text">${overallPercentage.toFixed(0)}%</div>
                </div>
                <h3 style="margin: 10px 0;">Overall LEAN Maturity</h3>
                <p style="color: #666;">${getScoreStatus(overallPercentage).text}</p>
            </div>
            
            <div class="results-grid" style="margin-top: 30px;">
                ${generateDashboardDimensionResults(results)}
            </div>
        `;
        
        // Update progress circle animation
        setTimeout(() => {
            updateProgressCircle(overallPercentage);
        }, 100);
    }
    
    // Update detailed tab
    const detailedContent = document.getElementById('detailedTab');
    if (detailedContent) {
        detailedContent.innerHTML = `
            <h3>Detailed Assessment Results</h3>
            <div class="detailed-scores">
                ${generateDetailedScores(results)}
            </div>
        `;
    }
    
    // Update feedback tab
    const feedbackContent = document.getElementById('feedbackTab');
    if (feedbackContent) {
        feedbackContent.innerHTML = `
            <h3>Recommendations</h3>
            <div class="feedback-section">
                ${generateFeedback(results)}
            </div>
        `;
    }
    
    // Show PDF export buttons
    const previewBtn = document.getElementById('previewDashboardPDF');
    const exportBtn = document.getElementById('exportDashboardPDF');
    if (previewBtn) previewBtn.style.display = 'inline-block';
    if (exportBtn) exportBtn.style.display = 'inline-block';
}

function generateDashboardDimensionResults(results) {
    let html = '';
    if (results.dimension_scores && Array.isArray(results.dimension_scores)) {
        results.dimension_scores.forEach((score, index) => {
            const percentage = (score / 5) * 100;
            const status = getScoreStatus(percentage);
            const dimensionName = getDimensionName(index);
            
            html += `
                <div class="dimension-card" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 15px;">
                    <h4 style="margin: 0 0 10px 0; color: #821874;">${dimensionName}</h4>
                    <div class="progress-container" style="background: #f0f0f0; border-radius: 10px; overflow: hidden; height: 20px;">
                        <div class="progress-bar ${status.class}" style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, #821874, #159eda); transition: width 0.3s ease;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 5px; font-size: 14px;">
                        <span>${score.toFixed(1)}/5.0</span>
                        <span>${percentage.toFixed(0)}%</span>
                    </div>
                </div>
            `;
        });
    }
    return html;
}

function generateDetailedScores(results) {
    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">';
    
    if (results.dimension_scores && Array.isArray(results.dimension_scores)) {
        results.dimension_scores.forEach((score, index) => {
            const percentage = (score / 5) * 100;
            const status = getScoreStatus(percentage);
            const dimensionName = getDimensionName(index);
            
            html += `
                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h4 style="color: #821874; margin-bottom: 15px;">${dimensionName}</h4>
                    <div style="font-size: 24px; font-weight: bold; color: #821874; margin-bottom: 10px;">
                        ${score.toFixed(2)}/5.0
                    </div>
                    <div style="background: #f0f0f0; padding: 10px; border-radius: 5px;">
                        <strong>Status:</strong> <span class="${status.class}" style="padding: 2px 8px; border-radius: 12px; font-size: 12px; color: white;">${status.text}</span>
                    </div>
                </div>
            `;
        });
    }
    
    html += '</div>';
    return html;
}

function generateFeedback(results) {
    const overallPercentage = ((results.overall_score || 0) / 5) * 100;
    
    let feedback = `
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h4 style="color: #821874; margin-bottom: 15px;">Overall Assessment</h4>
            <p>Your organization has achieved <strong>${overallPercentage.toFixed(0)}%</strong> LEAN maturity. ${getOverallFeedback(overallPercentage)}</p>
        </div>
    `;
    
    if (results.dimension_scores && Array.isArray(results.dimension_scores)) {
        feedback += '<h4 style="margin-top: 30px; margin-bottom: 15px;">Dimension-Specific Recommendations</h4>';
        
        results.dimension_scores.forEach((score, index) => {
            const percentage = (score / 5) * 100;
            const dimensionName = getDimensionName(index);
            
            feedback += `
                <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 15px;">
                    <h5 style="color: #821874; margin-bottom: 10px;">${dimensionName}</h5>
                    <p>${getDimensionFeedback(percentage)}</p>
                </div>
            `;
        });
    }
    
    return feedback;
}

function getDimensionName(index) {
    const dimensions = [
        'Leadership & Culture', 'Strategy & Planning', 'Process Management',
        'Performance Measurement', 'Continuous Improvement', 'Customer Focus',
        'Supplier & Partner Relationships'
    ];
    return dimensions[index] || `Dimension ${index + 1}`;
}

function getOverallFeedback(percentage) {
    if (percentage <= 48) return 'Focus on establishing basic LEAN principles and building awareness.';
    if (percentage <= 66) return 'Good progress! Continue developing standardized processes and employee engagement.';
    if (percentage <= 82) return 'Advanced level achieved! Focus on optimization and continuous improvement culture.';
    return 'Excellent! Your organization demonstrates mature LEAN practices. Consider mentoring others and innovation.';
}

function getDimensionFeedback(percentage) {
    if (percentage <= 48) return 'Begin with foundational training and identify quick wins to build momentum.';
    if (percentage <= 66) return 'Develop standard work procedures and increase visual management.';
    if (percentage <= 82) return 'Enhance cross-functional collaboration and advanced problem-solving techniques.';
    return 'Share best practices and drive innovation in this area.';
}

// ============================================
// PROGRESS CIRCLE ANIMATION
// ============================================
function updateProgressCircle(percentage) {
    const circle = document.getElementById('progressCircle');
    if (!circle) return;
    
    const circumference = 2 * Math.PI * 85;
    const offset = circumference - (percentage / 100) * circumference;
    
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = offset;
    
    // Animate the progress
    circle.style.transition = 'stroke-dashoffset 1s ease-in-out';
}

// ============================================
// VIEW ASSESSMENT (WRAPPER FUNCTION)
// ============================================
async function viewAssessment(assessmentId) {
    try {
        // Access global variables properly
        const user = window.currentUser;
        const userProfile = window.currentUserProfile;
        
        // Check if user is logged in
        if (!user) {
            showErrorMessage('Please sign in to view assessments.');
            // Try to access auth functions
            if (typeof showAuthTab === 'function') {
                showAuthTab('signin');
            }
            return;
        }
        
        // Try to use admin function if available
        if (typeof viewAssessmentResults === 'function') {
            await viewAssessmentResults(assessmentId);
        } else {
            // Fallback: create a basic view
            await basicViewAssessment(assessmentId);
        }
    } catch (error) {
        console.error('Error viewing assessment:', error);
        showErrorMessage('Unable to view assessment. Please try again.');
    }
}

// ============================================
// BASIC ASSESSMENT VIEW (FALLBACK)
// ============================================
async function basicViewAssessment(assessmentId) {
    try {
        const doc = await db.collection('assessments').doc(assessmentId).get();
        if (!doc.exists) {
            showErrorMessage('Assessment not found.');
            return;
        }
        
        const assessment = doc.data();
        
        // Create a simple modal to display assessment
        const modal = document.createElement('div');
        modal.id = 'assessmentViewModal';
        modal.style.cssText = `
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 9999;
            overflow: auto;
        `;
        
        const overallScore = assessment.results?.overall_score || 0;
        const percentage = (overallScore / 5) * 100;
        
        modal.innerHTML = `
            <div style="position: relative; max-width: 800px; margin: 50px auto; background: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                <div style="background: linear-gradient(135deg, #821874 0%, #159eda 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0;">Assessment Results</h2>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">${assessment.company_name || 'Unknown Company'}</p>
                </div>
                <div style="padding: 30px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="font-size: 48px; font-weight: bold; color: #821874;">${percentage.toFixed(0)}%</div>
                        <p style="color: #666;">Overall LEAN Maturity</p>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <strong>Assessor:</strong> ${assessment.assessor_name || 'N/A'}<br>
                        <strong>Date:</strong> ${assessment.assessment_date || 'N/A'}<br>
                        <strong>Status:</strong> ${assessment.is_draft ? 'Draft' : 'Completed'}
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 10px;">
                        <button onclick="closeAssessmentViewModal()" class="btn btn-secondary">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('Error in basic view assessment:', error);
        showErrorMessage('Failed to load assessment details.');
    }
}

function closeAssessmentViewModal() {
    const modal = document.getElementById('assessmentViewModal');
    if (modal) {
        modal.remove();
    }
}

// ============================================
// EDIT ASSESSMENT
// ============================================
async function editAssessment(assessmentId) {
    try {
        // Access global variables properly
        const user = window.currentUser;
        const userProfile = window.currentUserProfile;
        
        // Check if user is logged in
        if (!user) {
            showErrorMessage('Please sign in to edit assessments.');
            if (typeof showAuthTab === 'function') {
                showAuthTab('signin');
            }
            return;
        }
        
        const doc = await db.collection('assessments').doc(assessmentId).get();
        if (!doc.exists) {
            showErrorMessage('Assessment not found.');
            return;
        }
        
        const assessment = doc.data();
        
        // Check if user owns this assessment or is admin
        if (assessment.user_id !== user.uid && userProfile?.role !== 'admin') {
            showErrorMessage('You can only edit your own assessments.');
            return;
        }
        
        // Load assessment data into form
        window.currentAssessmentId = assessmentId;
        
        // Set form values
        document.getElementById('companyName').value = assessment.company_name || '';
        document.getElementById('assessorName').value = assessment.assessor_name || '';
        document.getElementById('assessmentDate').value = assessment.assessment_date || '';
        
        // Load responses into form
        if (assessment.responses) {
            loadResponsesIntoForm(assessment.responses);
        }
        
        // Show assessment panel
        if (typeof showPanel === 'function') {
            showPanel('assessment');
        }
        
        showSuccessMessage('Assessment loaded for editing. Make your changes and save.');
        
    } catch (error) {
        console.error('Error editing assessment:', error);
        showErrorMessage('Failed to load assessment for editing.');
    }
}

// ============================================
// DELETE ASSESSMENT
// ============================================
async function deleteAssessment(assessmentId) {
    try {
        // Access global variables properly
        const user = window.currentUser;
        const userProfile = window.currentUserProfile;
        
        // Check if user is logged in
        if (!user) {
            showErrorMessage('Please sign in to delete assessments.');
            if (typeof showAuthTab === 'function') {
                showAuthTab('signin');
            }
            return;
        }
        
        // Confirm deletion
        if (!confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
            return;
        }
        
        const doc = await db.collection('assessments').doc(assessmentId).get();
        if (!doc.exists) {
            showErrorMessage('Assessment not found.');
            return;
        }
        
        const assessment = doc.data();
        
        // Check if user owns this assessment or is admin
        if (assessment.user_id !== user.uid && userProfile?.role !== 'admin') {
            showErrorMessage('You can only delete your own assessments.');
            return;
        }
        
        // Delete the assessment
        await db.collection('assessments').doc(assessmentId).delete();
        
        // Refresh the assessments list
        if (typeof loadUserAssessments === 'function') {
            await loadUserAssessments();
        }
        
        showSuccessMessage('Assessment deleted successfully.');
        
    } catch (error) {
        console.error('Error deleting assessment:', error);
        showErrorMessage('Failed to delete assessment. Please try again.');
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function loadResponsesIntoForm(responses) {
    // Load responses into the assessment form
    Object.keys(responses).forEach(questionId => {
        const input = document.querySelector(`input[name="${questionId}"]:checked`);
        if (input) {
            input.checked = true;
        }
    });
}

// ============================================
// UI HELPERS
// ============================================
function showSuccessMessage(message) {
    // Create or update success notification
    let notification = document.getElementById('successNotification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'successNotification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
            z-index: 10000;
            font-weight: 500;
            max-width: 350px;
            animation: slideIn 0.3s ease-out;
        `;
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.style.display = 'block';
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 4000);
}

// Add slide-in animation
if (!document.getElementById('successNotificationStyles')) {
    const style = document.createElement('style');
    style.id = 'successNotificationStyles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// INITIALIZATION
// ============================================
function initializeAssessment() {
    console.log('Assessment module initialized');
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    const dateElement = document.getElementById('assessmentDate');
    if (dateElement) {
        dateElement.value = today;
    }
    
    // Generate assessment questions
    if (typeof renderAssessmentForm === 'function') {
        renderAssessmentForm();
    } else {
        generateQuestions();
    }
}

// ============================================
// QUESTION GENERATION
// ============================================
function generateQuestions() {
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '';
    
    DIMENSIONS.forEach((dimension, dimIndex) => {
        const sectionHtml = `
            <div class="form-section">
                <h3>${dimIndex + 1}. ${dimension.name} (Questions ${dimension.questions[0] * dimIndex + 1}-${dimension.questions[0] * dimIndex + dimension.questions})</h3>
                <p style="color: #2d2d2d; margin-bottom: 20px;">${dimension.description}</p>
                ${generateDimensionQuestions(dimIndex)}
            </div>
        `;
        container.innerHTML += sectionHtml;
    });
}

function generateDimensionQuestions(dimensionIndex) {
    const startQuestion = dimensionIndex * 5 + 1;
    const endQuestion = startQuestion + 4;
    
    let questionsHtml = '';
    
    for (let i = startQuestion; i <= endQuestion; i++) {
        const question = QUESTIONS.find(q => q.id === i);
        if (question) {
            questionsHtml += `
                <div class="question-group">
                    <label>Q${i}: ${question.text}</label>
                    <div class="radio-group">
                        <div class="radio-option"><input type="radio" name="q${i}" value="1"> <span>1 - Strongly Disagree</span></div>
                        <div class="radio-option"><input type="radio" name="q${i}" value="2"> <span>2 - Disagree</span></div>
                        <div class="radio-option"><input type="radio" name="q${i}" value="3"> <span>3 - Neutral</span></div>
                        <div class="radio-option"><input type="radio" name="q${i}" value="4"> <span>4 - Agree</span></div>
                        <div class="radio-option"><input type="radio" name="q${i}" value="5"> <span>5 - Strongly Agree</span></div>
                    </div>
                </div>
            `;
        }
    }
    
    return questionsHtml;
}

// ============================================
// FORM HANDLING
// ============================================
async function submitAssessment() {
    try {
        const formData = collectFormData();
        
        // Validate form
        if (!validateForm(formData)) {
            showError('Please fill in all required fields');
            return;
        }
        
        // Save to Firebase
        const result = await saveAssessment(formData);
        
        if (result.error) {
            showError('Failed to save assessment: ' + result.error.message);
            return;
        }
        
        showSuccess('Assessment saved successfully!');
        
        // Calculate and display results
        calculateAndDisplayResults(formData);
        
    } catch (error) {
        console.error('Submit assessment error:', error);
        showError('An error occurred while submitting assessment');
    }
}

function collectFormData() {
    const formData = {
        companyName: document.getElementById('companyName').value,
        assessorName: document.getElementById('assessorName').value,
        assessmentDate: document.getElementById('assessmentDate').value,
        responses: {},
        dimension_scores: [],
        overall_score: 0
    };
    
    // Collect all question responses
    for (let i = 1; i <= 35; i++) {
        const radios = document.getElementsByName(`q${i}`);
        const selected = Array.from(radios).find(radio => radio.checked);
        if (selected) {
            formData.responses[`q${i}`] = parseInt(selected.value);
        }
    }
    
    // Calculate dimension scores
    DIMENSIONS.forEach((dimension, index) => {
        const startQuestion = index * 5 + 1;
        const endQuestion = startQuestion + 4;
        
        let dimensionTotal = 0;
        let questionCount = 0;
        
        for (let i = startQuestion; i <= endQuestion; i++) {
            if (formData.responses[`q${i}`]) {
                dimensionTotal += formData.responses[`q${i}`];
                questionCount++;
            }
        }
        
        if (questionCount > 0) {
            formData.dimension_scores[index] = dimensionTotal / questionCount;
        }
    });
    
    // Calculate overall score
    const validScores = formData.dimension_scores.filter(score => score > 0);
    if (validScores.length > 0) {
        formData.overall_score = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
    }
    
    return formData;
}

function validateForm(formData) {
    return formData.companyName.trim() !== '' &&
           formData.assessorName.trim() !== '' &&
           formData.assessmentDate !== '' &&
           Object.keys(formData.responses).length >= 30; // At least 30 questions answered
}

// ============================================
// RESULTS CALCULATION
// ============================================
function calculateAndDisplayResults(formData) {
    // Hide form, show results
    document.getElementById('assessmentForm').style.display = 'none';
    
    const resultsHtml = `
        <div class="status-overview">
            <h2>Assessment Results</h2>
            <div class="status-large">${formData.overall_score.toFixed(1)}/5.0</div>
            <p>Overall LEAN Maturity Score</p>
        </div>
        
        <div class="results-grid">
            ${generateDimensionResults(formData)}
        </div>
        
        <div class="form-actions">
            <button type="button" class="btn btn-primary" onclick="saveAssessmentData(${JSON.stringify(formData).replace(/"/g, '&quot;')})">Save Results</button>
            <button type="button" class="btn btn-secondary" onclick="newAssessment()">New Assessment</button>
        </div>
    `;
    
    // Create results container if it doesn't exist
    let resultsContainer = document.getElementById('resultsContainer');
    if (!resultsContainer) {
        resultsContainer = document.createElement('div');
        resultsContainer.id = 'resultsContainer';
        resultsContainer.className = 'panel';
        document.querySelector('.container').appendChild(resultsContainer);
    }
    
    resultsContainer.innerHTML = resultsHtml;
    resultsContainer.style.display = 'block';
    resultsContainer.classList.add('active');
}

function generateDimensionResults(formData) {
    let dimensionHtml = '';
    
    DIMENSIONS.forEach((dimension, index) => {
        const score = formData.dimension_scores[index] || 0;
        const percentage = (score / 5) * 100; // Convert to percentage
        const status = getScoreStatus(percentage);
        
        dimensionHtml += `
            <div class="dimension-card">
                <h4>${dimension.name}</h4>
                <div class="progress-container">
                    <div class="progress-bar ${status.class}" style="width: ${percentage}%">
                        ${percentage.toFixed(0)}%
                    </div>
                </div>
                <div class="status-label">${status.label}</div>
                <div class="status-label">Score: ${score.toFixed(1)}/5.0</div>
            </div>
        `;
    });
    
    return dimensionHtml;
}

function getScoreStatus(percentage) {
    if (percentage >= 80) return { class: 'status-advanced', label: 'Advanced' };
    if (percentage >= 60) return { class: 'status-developing', label: 'Developing' };
    if (percentage >= 40) return { class: 'status-emerging', label: 'Emerging' };
    return { class: 'status-novice', label: 'Novice' };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
// ============================================
// UTILITY FUNCTIONS
// ============================================
function saveDraft() {
    const formData = collectFormData();
    if (validateForm(formData)) {
        localStorage.setItem('assessmentDraft', JSON.stringify(formData));
        showSuccess('Draft saved locally!');
    } else {
        showError('Please fill in required fields before saving draft');
    }
}

function loadDraft() {
    const draft = localStorage.getItem('assessmentDraft');
    if (draft) {
        const formData = JSON.parse(draft);
        
        // Populate form fields
        document.getElementById('companyName').value = formData.companyName || '';
        document.getElementById('assessorName').value = formData.assessorName || '';
        document.getElementById('assessmentDate').value = formData.assessmentDate || '';
        
        // Populate radio buttons
        Object.keys(formData.responses).forEach(questionKey => {
            const value = formData.responses[questionKey];
            if (value) {
                const radio = document.querySelector(`input[name="${questionKey}"][value="${value}"]`);
                if (radio) radio.checked = true;
            }
        });
    }
}

function newAssessment() {
    // Clear form
    document.getElementById('assessmentForm').reset();
    
    // Clear draft
    localStorage.removeItem('assessmentDraft');
    
    // Hide results, show form
    const resultsContainer = document.getElementById('resultsContainer');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
    
    document.getElementById('assessmentForm').style.display = 'block';
    
    // Reset date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('assessmentDate').value = today;
}

function saveAssessmentData(formDataJson) {
    // This function will be connected to the Firebase database module
    console.log('Saving assessment data:', formDataJson);
    showSuccess('Assessment data ready to save to Firebase!');
}

function showError(message) {
    // Create error message if it doesn't exist
    let errorDiv = document.getElementById('errorMessage');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'errorMessage';
        errorDiv.className = 'status error';
        errorDiv.style.margin = '20px 0';
        document.querySelector('.container').appendChild(errorDiv);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    // Create success message if it doesn't exist
    let successDiv = document.getElementById('successMessage');
    if (!successDiv) {
        successDiv = document.createElement('div');
        successDiv.id = 'successMessage';
        successDiv.className = 'status success';
        successDiv.style.margin = '20px 0';
        document.querySelector('.container').appendChild(successDiv);
    }
    
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 3000);
}

// Load draft on initialization
document.addEventListener('DOMContentLoaded', function() {
    loadDraft();
});

// ============================================
// ASSESSMENT MODULE
// ============================================

let currentAssessmentId = null;

// ============================================
// RENDER ASSESSMENT FORM
// ============================================
function renderAssessmentForm() {
    const container = document.getElementById('questionsContainer');
    let html = '';
    
    let questionIndex = 0;
    for (let d = 0; d < DIMENSIONS.length; d++) {
        const dimension = DIMENSIONS[d];
        html += `
            <div class="form-section">
                <h3>${d + 1}. ${dimension.name} (Questions ${questionIndex + 1}-${questionIndex + dimension.questions})</h3>
                <p style="color: #2d2d2d; margin-bottom: 20px;">${dimension.description}</p>
        `;
        
        for (let q = 0; q < dimension.questions; q++) {
            const question = QUESTIONS[questionIndex];
            html += `
                <div class="question-group">
                    <label>Q${question.id}: ${question.text}</label>
                    <div class="radio-group">
            `;
            
            for (const option of RATING_OPTIONS) {
                html += `
                    <div class="radio-option">
                        <input type="radio" name="q${question.id}" value="${option.value}">
                        <span>${option.label}</span>
                    </div>
                `;
            }
            
            html += `
                    </div>
                </div>
            `;
            questionIndex++;
        }
        
        html += '</div>';
    }
    
    container.innerHTML = html;
    setupRadioOptionHandlers();
}

function setupRadioOptionHandlers() {
    document.querySelectorAll('.radio-option').forEach(option => {
        option.addEventListener('click', function() {
            const radio = this.querySelector('input[type="radio"]');
            radio.checked = true;
            
            const name = radio.name;
            document.querySelectorAll(`input[name="${name}"]`).forEach(r => {
                r.closest('.radio-option').style.background = 'white';
                r.closest('.radio-option').style.borderColor = '#ebebeb';
            });
            
            this.style.background = '#fef5fe';
            this.style.borderColor = '#821874';
        });
    });
}

// ============================================
// VALIDATION & SUBMISSION
// ============================================
function validateAssessment() {
    for (let i = 1; i <= 35; i++) {
        const checked = document.querySelector(`input[name="q${i}"]:checked`);
        if (!checked) {
            alert(`Please answer question ${i}.`);
            return false;
        }
    }
    return true;
}

function getFormResponses() {
    const responses = {
        companyName: document.getElementById('companyName').value,
        assessorName: document.getElementById('assessorName').value,
        assessmentDate: document.getElementById('assessmentDate').value
    };

    for (let i = 1; i <= 35; i++) {
        const checked = document.querySelector(`input[name="q${i}"]:checked`);
        if (checked) {
            responses[`q${i}`] = parseInt(checked.value);
        }
    }

    return responses;
}

function calculateResults() {
    const results = [];
    let totalScore = 0;
    let questionIndex = 1;

    for (let d = 0; d < DIMENSIONS.length; d++) {
        let dimensionTotal = 0;
        for (let q = 0; q < DIMENSIONS[d].questions; q++) {
            const value = parseInt(document.querySelector(`input[name="q${questionIndex}"]:checked`).value);
            dimensionTotal += value;
            questionIndex++;
        }
        const maxScore = DIMENSIONS[d].questions * 5;
        const percentage = (dimensionTotal / maxScore) * 100;
        results.push({
            dimension: DIMENSIONS[d].name,
            score: dimensionTotal,
            maxScore: maxScore,
            percentage: Math.round(percentage)
        });
        totalScore += dimensionTotal;
    }

    const overallMaxScore = 35 * 5;
    const overallPercentage = (totalScore / overallMaxScore) * 100;

    return {
        dimensions: results,
        totalScore: totalScore,
        overallMaxScore: overallMaxScore,
        overallPercentage: Math.round(overallPercentage),
        status: getStatusLabel(overallPercentage)
    };
}

function getStatusLabel(percentage) {
    if (percentage <= 48) return 'Novice';         // 0-48%
    if (percentage <= 66) return 'Emerging';       // 49-66%
    if (percentage <= 82) return 'Developing';     // 67-82%
    return 'Advanced';                            // 83-100%
}

function getStatusClass(percentage) {
    if (percentage <= 48) return 'status-novice';         // 0-48%
    if (percentage <= 66) return 'status-emerging';       // 49-66%
    if (percentage <= 82) return 'status-developing';     // 67-82%
    return 'status-advanced';                            // 83-100%
}

async function submitAssessment() {
    if (!validateAssessment()) return;

    const results = calculateResults();
    const assessment = {
        id: currentAssessmentId || null,
        companyName: document.getElementById('companyName').value,
        assessorName: document.getElementById('assessorName').value,
        assessmentDate: document.getElementById('assessmentDate').value,
        results: results,
        responses: getFormResponses(),
        isDraft: false
    };

    await saveAssessmentToStorage(assessment);
    
    // Store current assessment data for dashboard display
    currentAssessmentData = {
        ...assessment,
        user_name: currentUserProfile?.display_name || currentUser.email,
        user_email: currentUser.email,
        created_at: new Date().toISOString()
    };
    
    currentAssessmentId = null;
    document.getElementById('assessmentForm').reset();
    document.getElementById('assessmentDate').value = new Date().toISOString().split('T')[0];
    
    // Show dashboard with results
    showPanel('dashboard');
    loadDashboardResults();
}

async function saveAssessment() {
    if (document.getElementById('companyName').value === '') {
        showErrorMessage('Please enter company name.');
        return;
    }

    const assessment = {
        id: window.currentAssessmentId || null,
        companyName: document.getElementById('companyName').value,
        assessorName: document.getElementById('assessorName').value,
        assessmentDate: document.getElementById('assessmentDate').value,
        results: null,
        responses: getFormResponses(),
        isDraft: true
    };

    await saveAssessmentToStorage(assessment);
}

function resetForm() {
    if (confirm('Are you sure you want to reset the form?')) {
        document.getElementById('assessmentForm').reset();
        document.getElementById('assessmentDate').value = new Date().toISOString().split('T')[0];
        window.currentAssessmentId = null;
    }
}

async function saveAssessmentToStorage(assessment) {
    const user = window.currentUser;
    const userProfile = window.currentUserProfile;
    
    if (!user) {
        showErrorMessage('Please login first.');
        return;
    }

    try {
        const now = firebase.firestore.FieldValue.serverTimestamp();

        const assessmentData = {
            user_id: user.uid,
            user_email: user.email,
            user_name: userProfile?.display_name || user.email.split('@')[0],
            company_name: assessment.companyName,
            assessor_name: assessment.assessorName,
            assessment_date: assessment.assessmentDate,
            responses: assessment.responses,
            results: assessment.results,
            is_draft: assessment.isDraft || false,
            updated_at: now
        };

        if (assessment.id && window.currentAssessmentId) {
            await db.collection('assessments').doc(window.currentAssessmentId).set(assessmentData, { merge: true });
        } else {
            const docRef = await db.collection('assessments').add({
                ...assessmentData,
                created_at: now
            });
            window.currentAssessmentId = docRef.id;
        }

        // Show success message
        if (assessment.isDraft) {
            showSuccessMessage('✓ Draft saved successfully! You can continue later.');
        } else {
            showSuccessMessage('✓ Assessment saved successfully! Your results are ready to view.');
        }
        
    } catch (error) {
        console.error('Exception:', error?.message || error);
        showErrorMessage('Failed to save assessment. Please try again.');
    }
}

function showErrorMessage(message) {
    // Create or update error notification
    let notification = document.getElementById('errorNotification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'errorNotification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #dc3545, #c82333);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
            z-index: 10000;
            font-weight: 500;
            max-width: 350px;
            animation: slideIn 0.3s ease-out;
        `;
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.style.display = 'block';
    
    // Auto-hide after 5 seconds (longer for errors)
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}
