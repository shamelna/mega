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
    if (percentage <= 31) return 'Novice';
    if (percentage <= 48) return 'Emerging';
    if (percentage <= 66) return 'Developing';
    return 'Advanced';
}

function getStatusClass(percentage) {
    if (percentage <= 31) return 'status-novice';
    if (percentage <= 48) return 'status-emerging';
    if (percentage <= 66) return 'status-developing';
    return 'status-advanced';
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

    assessment.user_email = currentUser.email;
    assessment.user_name = currentUserProfile?.full_name || currentUser.email.split('@')[0];
    
    try {
        const assessmentData = {
            user_email: currentUser.email,
            user_name: assessment.user_name,
            company_name: assessment.companyName,
            assessor_name: assessment.assessorName,
            assessment_date: assessment.assessmentDate,
            responses: assessment.responses,
            results: assessment.results,
            is_draft: assessment.isDraft || false
        };
        
        let data, error;
        
        // Update existing assessment or insert new one
        if (assessment.id && currentAssessmentId) {
            // Update existing assessment
            const result = await supabase
                .from('assessments')
                .update(assessmentData)
                .eq('id', currentAssessmentId)
                .select();
            data = result.data;
            error = result.error;
        } else {
            // Insert new assessment
            const result = await supabase
                .from('assessments')
                .insert([assessmentData])
                .select();
            data = result.data;
            error = result.error;
        }
        
        if (error) {
            console.error('Error:', error.message || error);
            alert('Error: ' + (error.message || 'Unknown error'));
            return;
        }
        
        if (data && data[0]) {
            currentAssessmentId = data[0].id;
        }
        
        alert('✓ Assessment saved successfully!');
    } catch (error) {
        console.error('Exception:', error?.message || error);
        alert('Error: ' + (error?.message || 'Unknown error'));
    }
}
