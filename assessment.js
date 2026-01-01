// ============================================
// ASSESSMENT MODULE
// ============================================

let currentAssessmentData = {};

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
    
    currentAssessmentId = null;
    document.getElementById('assessmentForm').reset();
    document.getElementById('assessmentDate').value = new Date().toISOString().split('T')[0];
    
    showPanel('dashboard');
}

async function saveAssessment() {
    if (document.getElementById('companyName').value === '') {
        alert('Please enter company name.');
        return;
    }

    const assessment = {
        id: currentAssessmentId || null,
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
        currentAssessmentId = null;
    }
}

async function saveAssessmentToStorage(assessment) {
    if (!currentUser) {
        alert('Please login first.');
        return;
    }

    try {
        const now = firebase.firestore.FieldValue.serverTimestamp();

        const assessmentData = {
            user_id: currentUser.uid,
            user_email: currentUser.email,
            user_name: currentUserProfile?.display_name || currentUser.email.split('@')[0],
            company_name: assessment.companyName,
            assessor_name: assessment.assessorName,
            assessment_date: assessment.assessmentDate,
            responses: assessment.responses,
            results: assessment.results,
            is_draft: assessment.isDraft || false,
            updated_at: now
        };

        if (assessment.id && currentAssessmentId) {
            await db.collection('assessments').doc(currentAssessmentId).set(assessmentData, { merge: true });
        } else {
            const docRef = await db.collection('assessments').add({
                ...assessmentData,
                created_at: now
            });
            currentAssessmentId = docRef.id;
        }

        alert('✓ Assessment saved successfully!');
    } catch (error) {
        console.error('Exception:', error?.message || error);
        alert('Error: ' + (error?.message || 'Unknown error'));
    }
}
