// ============================================
// ASSESSMENT MODULE
// ============================================

// ============================================
// DASHBOARD RESULTS DISPLAY
// ============================================
function loadDashboardResults() {
    console.log('loadDashboardResults called');
    console.log('window.allAssessments:', window.allAssessments);
    console.log('window.currentUser:', window.currentUser);
    
    // Check if assessments are already loaded
    if (window.allAssessments && window.allAssessments.length > 0) {
        console.log('Using existing assessments:', window.allAssessments.length);
        displayDashboardWithAllAssessments();
        return;
    }
    
    // Load all assessments for the dashboard
    if (typeof loadUserAssessments === 'function') {
        console.log('Calling loadUserAssessments...');
        loadUserAssessments().then((assessments) => {
            console.log('Assessments loaded successfully:', assessments?.length);
            displayDashboardWithAllAssessments();
        }).catch(error => {
            console.error('Error loading assessments for dashboard:', error);
            displayDashboardFallback();
        });
    } else {
        console.warn('loadUserAssessments function not available');
        displayDashboardFallback();
    }
}

function displayDashboardWithAllAssessments() {
    const allAssessments = window.allAssessments || [];
    const totalAssessments = allAssessments.length;
    
    // Calculate overall statistics
    let overallScores = [];
    let statusCounts = { novice: 0, emerging: 0, developing: 0, advanced: 0 };
    
    allAssessments.forEach(assessment => {
        if (assessment.results && assessment.results.overallPercentage) {
            overallScores.push(assessment.results.overallPercentage);
            const status = getScoreStatus(assessment.results.overallPercentage).label.toLowerCase();
            if (statusCounts[status] !== undefined) {
                statusCounts[status]++;
            }
        }
    });
    
    // Update dashboard overview
    const overviewContent = document.getElementById('overviewTab');
    if (overviewContent) {
        overviewContent.innerHTML = `
            <div class="assessment-count" style="text-align: center; padding: 30px; background: linear-gradient(135deg, #821874, #159eda); border-radius: 12px; margin-bottom: 30px;">
                <h4 style="color: white; margin-bottom: 15px; font-size: 18px;">Total Assessments Completed</h4>
                <div style="font-size: 48px; font-weight: bold; color: white;">${totalAssessments}</div>
                <div style="color: rgba(255,255,255,0.9); margin-top: 10px;">Assessments</div>
            </div>
            
            <div class="chart-container" style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-bottom: 30px;">
                <h4 style="color: #821874; margin-bottom: 25px; font-size: 18px;">Performance Comparison</h4>
                <div style="height: 300px; width: 100%; position: relative;">
                    <canvas id="performanceChart" style="width: 100%; height: 100%;"></canvas>
                </div>
            </div>
            
            <div class="status-distribution" style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-bottom: 30px;">
                <h4 style="color: #821874; margin-bottom: 20px; font-size: 18px;">Status Distribution</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                    <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${statusCounts.novice || 0}</div>
                        <div style="color: #666; font-size: 14px; margin-top: 5px;">Novice</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${statusCounts.emerging || 0}</div>
                        <div style="color: #666; font-size: 14px; margin-top: 5px;">Emerging</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 24px; font-weight: bold; color: #0891b2;">${statusCounts.developing || 0}</div>
                        <div style="color: #666; font-size: 14px; margin-top: 5px;">Developing</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 24px; font-weight: bold; color: #059669;">${statusCounts.advanced || 0}</div>
                        <div style="color: #666; font-size: 14px; margin-top: 5px;">Advanced</div>
                    </div>
                </div>
            </div>
            
            ${totalAssessments > 0 ? generateRecentAssessmentsList(allAssessments.slice(-5)) : '<div style="text-align: center; padding: 40px; color: #666;">No assessments completed yet. Complete your first assessment to see results here!</div>'}
        `;
        
        // Draw performance chart with assessment data
        setTimeout(() => {
            drawPerformanceChart(allAssessments);
        }, 200);
    }
}

function displayDashboardFallback() {
    const overviewContent = document.getElementById('overviewTab');
    if (overviewContent) {
        overviewContent.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <h3 style="color: #821874; margin-bottom: 20px;">Welcome to Your Dashboard</h3>
                <p style="color: #666; margin-bottom: 30px;">Complete assessments to see your LEAN maturity progress and performance analytics here.</p>
                <button onclick="showPanel('assessment')" style="background: #821874; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Start New Assessment</button>
            </div>
        `;
    }
}

function generateRecentAssessmentsList(recentAssessments) {
    let html = `
        <div class="recent-assessments" style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <h4 style="color: #821874; margin-bottom: 20px; font-size: 18px;">Recent Assessments</h4>
            <div style="display: flex; flex-direction: column; gap: 15px;">
    `;
    
    recentAssessments.reverse().forEach(assessment => {
        const date = new Date(assessment.assessment_date || assessment.created_at).toLocaleDateString();
        const percentage = assessment.results ? assessment.results.overallPercentage : 0;
        const status = getScoreStatus(percentage);
        
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid ${status.color};">
                <div>
                    <div style="font-weight: 600; color: #2d2d2d;">${assessment.company_name || 'Assessment'}</div>
                    <div style="color: #666; font-size: 14px;">${date}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 20px; font-weight: bold; color: ${status.color};">${percentage}%</div>
                    <div style="color: #666; font-size: 12px;">${status.label}</div>
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

// ============================================
// ASSESSMENT FORM HANDLING
// ============================================

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

function generateDetailedScores(assessment) {
    if (!assessment || !assessment.responses || !assessment.results) {
        return '<p>No data available</p>';
    }
    
    const responses = assessment.responses;
    const results = assessment.results;
    
    let html = '<div style="padding: 20px;">';
    
    // Group questions by dimension
    DIMENSIONS.forEach((dimension, dimIndex) => {
        const dimensionResult = results.dimensions.find(d => d.dimension === dimension.name);
        if (!dimensionResult) return;
        
        const statusClass = getStatusClass(dimensionResult.percentage);
        
        html += `
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="color: #821874; margin: 0;">${dimension.name}</h3>
                    <div>
                        <span class="${statusClass}" style="padding: 6px 12px; border-radius: 4px; color: white; font-weight: 600; font-size: 18px;">
                            ${dimensionResult.percentage}%
                        </span>
                        <span style="margin-left: 10px; color: #666;">${dimensionResult.score}/${dimensionResult.maxScore} points</span>
                    </div>
                </div>
                <p style="color: #666; font-size: 14px; margin-bottom: 15px;">${dimension.description}</p>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f4f8;">
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #821874;">Question</th>
                            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #821874; width: 120px;">Your Answer</th>
                            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #821874; width: 80px;">Score</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // Get questions for this dimension
        const dimensionQuestions = QUESTIONS.filter(q => q.dimension === dimIndex);
        
        dimensionQuestions.forEach(question => {
            const answer = responses[`q${question.id}`];
            const answerText = answer ? RATING_OPTIONS.find(opt => opt.value == answer)?.label || 'N/A' : 'Not Answered';
            const score = answer || 0;
            
            // Color code the answer
            let answerColor = '#999';
            if (score >= 4) answerColor = '#28a745';
            else if (score === 3) answerColor = '#ffc107';
            else if (score > 0) answerColor = '#dc3545';
            
            html += `
                <tr style="border-bottom: 1px solid #ebebeb;">
                    <td style="padding: 12px;">
                        <strong>Q${question.id}.</strong> ${question.text}
                    </td>
                    <td style="padding: 12px; text-align: center;">
                        <span style="color: ${answerColor}; font-weight: 600;">${answerText}</span>
                    </td>
                    <td style="padding: 12px; text-align: center; font-weight: 600; color: ${answerColor};">
                        ${score}/5
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

function generateFeedback(results) {
    if (!results || !results.dimensions) return '';
    
    // Sort dimensions by percentage
    const sorted = [...results.dimensions].sort((a, b) => b.percentage - a.percentage);
    const best = sorted.slice(0, 2); // Top 2
    const worst = sorted.slice(-2).reverse(); // Bottom 2
    
    let feedback = '';
    
    // Overall assessment
    const overallStatus = results.status;
    feedback += `<div style="margin-bottom: 20px;">`;
    feedback += `<h3 style="color: #821874; margin-bottom: 10px;">Overall LEAN Maturity: ${overallStatus}</h3>`;
    feedback += `<p>Your organization scored ${results.overallPercentage}% (${results.totalScore}/${results.overallMaxScore} points) across all seven LEAN dimensions.</p>`;
    feedback += `</div>`;
    
    // Strengths
    feedback += `<div style="margin-bottom: 20px;">`;
    feedback += `<h3 style="color: #28a745; margin-bottom: 10px;">🌟 Key Strengths</h3>`;
    feedback += `<p>Your organization demonstrates strong performance in:</p><ul style="margin-left: 20px;">`;
    best.forEach(dim => {
        feedback += `<li><strong>${dim.dimension}</strong>: ${dim.percentage}% (${dim.score}/${dim.maxScore}) - `;
        feedback += getDimensionFeedback(dim.dimension, dim.percentage, true);
        feedback += `</li>`;
    });
    feedback += `</ul></div>`;
    
    // Areas for Improvement
    feedback += `<div style="margin-bottom: 20px;">`;
    feedback += `<h3 style="color: #dc3545; margin-bottom: 10px;">🎯 Focus Areas for Improvement</h3>`;
    feedback += `<p>Priority should be given to strengthening:</p><ul style="margin-left: 20px;">`;
    worst.forEach(dim => {
        feedback += `<li><strong>${dim.dimension}</strong>: ${dim.percentage}% (${dim.score}/${dim.maxScore}) - `;
        feedback += getDimensionFeedback(dim.dimension, dim.percentage, false);
        feedback += `</li>`;
    });
    feedback += `</ul></div>`;
    
    // Recommendations
    feedback += `<div style="margin-bottom: 20px;">`;
    feedback += `<h3 style="color: #159eda; margin-bottom: 10px;">💡 Recommended Actions</h3>`;
    feedback += getRecommendations(results.overallPercentage, worst);
    feedback += `</div>`;
    
    // Next Steps Section
    feedback += `
    <div style="margin: 30px 0; border-top: 2px solid #f0f0f0; padding-top: 20px;">
        <h3 style="color: #821874; margin-bottom: 15px;">🚀 What's Next?</h3>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #821874;">
            <p style="font-size: 1.1em; margin-bottom: 20px; font-weight: 600;">1. Review your detailed assessment report</p>
            <p style="margin: 0 0 20px 20px;">
                Take time to review your comprehensive assessment results and export the PDF report for your reference.
            </p>
            
            <div style="display: flex; flex-wrap: wrap; gap: 20px; margin: 25px 0;">
                <div style="flex: 1; min-width: 250px; background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h4 style="color: #159eda; margin-top: 0; margin-bottom: 10px;">2. Schedule a Consultation</h4>
                    <p style="margin-bottom: 10px;">Contact Barry Taylor to discuss your results and create a customized improvement plan:</p>
                    <p style="margin: 10px 0 0 0; text-align: center;">
                        <a href="mailto:barry.taylor@midulstermega.com" style="color: #821874; font-weight: 600; text-decoration: none; background: #f8f0f7; padding: 8px 15px; border-radius: 4px; display: inline-block;">
                            ✉️ Contact Barry Taylor
                        </a>
                    </p>
                </div>
                
                <div style="flex: 1; min-width: 250px; background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h4 style="color: #159eda; margin-top: 0; margin-bottom: 10px;">3. Explore Training Options</h4>
                    <p style="margin-bottom: 10px;">We offer flexible training programs tailored to your needs:</p>
                    <ul style="margin: 10px 0 0 20px; padding: 0;">
                        <li>Team Training (5-10 people)</li>
                        <li>Individual Certification</li>
                        <li>Customized Workshops</li>
                    </ul>
                </div>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 6px; margin: 25px 0 15px 0; border: 1px solid #e9ecef;">
                <p style="margin: 0; color: #6c757d; font-size: 0.95em;">
                    <strong>Special Offer:</strong> Contact Barry Taylor for information about special pricing and packages available for MEGA.
                </p>
            </div>
            
            <div style="margin-top: 20px; text-align: center; padding: 10px; background: #f1f8ff; border-radius: 6px;">
                <p style="margin: 0; font-weight: 500;">
                    Learn more: 
                    <a href="https://midulstermega.com/" target="_blank" style="color: #159eda; margin: 0 10px; text-decoration: none;">MEGA Website</a> | 
                    <a href="https://kaizenacademy.education/" target="_blank" style="color: #159eda; text-decoration: none;">Kaizen Academy</a>
                </p>
            </div>
        </div>
    </div>`;
    
    return feedback;
}

function getDimensionFeedback(dimensionName, percentage, isStrength) {
    const feedbackMap = {
        'Leadership & Culture': {
            strength: 'Strong leadership commitment to LEAN principles creates a solid foundation for continuous improvement.',
            weakness: 'Leadership alignment and cultural transformation are critical first steps. Focus on visible leadership commitment and communication.'
        },
        'Customer Value Focus': {
            strength: 'Excellent understanding of customer needs positions you well for delivering real value.',
            weakness: 'Reconnect with your customers. Regular feedback loops and value stream mapping can help identify what truly matters.'
        },
        'Process Efficiency': {
            strength: 'Well-standardized processes and effective visual management support operational excellence.',
            weakness: 'Start with process mapping and standardization. Visual management tools can quickly improve visibility and control.'
        },
        'Waste Elimination - Muda': {
            strength: 'Strong waste awareness and systematic elimination practices drive efficiency gains.',
            weakness: 'Train teams to recognize the 8 wastes in daily operations. Quick wins in waste elimination can build momentum.'
        },
        'Continuous Improvement - Kaizen': {
            strength: 'Active Kaizen culture with engaged frontline staff drives sustained improvement.',
            weakness: 'Establish regular improvement cycles (PDCA) and create systems to capture and implement employee ideas.'
        },
        'Flow and Pull Systems': {
            strength: 'Smooth workflow and pull systems minimize delays and inventory.',
            weakness: 'Map your value streams to identify bottlenecks. Implement basic pull signals before advancing to complex systems.'
        },
        'Problem Solving & Root Cause Analysis': {
            strength: 'Structured problem-solving methods ensure issues are resolved at the root cause.',
            weakness: 'Invest in problem-solving training (A3, 5 Whys). Data-driven decisions prevent recurring problems.'
        }
    };
    
    const feedback = feedbackMap[dimensionName];
    return feedback ? (isStrength ? feedback.strength : feedback.weakness) : '';
}

function getRecommendations(overallPercentage, weakestDimensions) {
    let recommendations = '<ul style="margin-left: 20px;">';
    
    if (overallPercentage <= 48) {
        recommendations += '<li>Start with <strong>Leadership Development</strong>: Ensure leadership understands and champions LEAN principles</li>';
        recommendations += '<li>Focus on <strong>Quick Wins</strong>: Identify and eliminate obvious wastes to build momentum</li>';
        recommendations += '<li>Invest in <strong>Basic Training</strong>: Educate staff on fundamental LEAN concepts</li>';
    } else if (overallPercentage <= 66) {
        recommendations += '<li>Strengthen <strong>Standardization</strong>: Document and follow standard work procedures</li>';
        recommendations += '<li>Implement <strong>Visual Management</strong>: Make problems and performance visible</li>';
        recommendations += '<li>Develop <strong>Problem-Solving Skills</strong>: Train teams in structured problem-solving methods</li>';
    } else if (overallPercentage <= 82) {
        recommendations += '<li>Advance <strong>Continuous Improvement</strong>: Formalize Kaizen events and suggestion systems</li>';
        recommendations += '<li>Optimize <strong>Flow</strong>: Implement pull systems and reduce batch sizes</li>';
        recommendations += '<li>Deepen <strong>Customer Understanding</strong>: Regular voice-of-customer analysis</li>';
    } else {
        recommendations += '<li>Pursue <strong>Operational Excellence</strong>: Benchmark against best-in-class organizations</li>';
        recommendations += '<li>Expand <strong>Integration</strong>: Extend LEAN principles across the value chain</li>';
        recommendations += '<li>Focus on <strong>Innovation</strong>: Use LEAN thinking to drive breakthrough improvements</li>';
    }
    
    // Add dimension-specific recommendations
    weakestDimensions.forEach(dim => {
        recommendations += `<li>For <strong>${dim.dimension}</strong>: `;
        recommendations += getDimensionRecommendation(dim.dimension);
        recommendations += '</li>';
    });
    
    recommendations += '</ul>';
    return recommendations;
}

function getDimensionRecommendation(dimensionName) {
    const recommendations = {
        'Leadership & Culture': 'Conduct leadership workshops and establish visible LEAN performance boards',
        'Customer Value Focus': 'Implement regular customer surveys and value stream mapping sessions',
        'Process Efficiency': 'Start 5S implementation and create standard work documents',
        'Waste Elimination - Muda': 'Run waste identification workshops and establish waste tracking metrics',
        'Continuous Improvement - Kaizen': 'Launch a suggestion system and schedule monthly Kaizen events',
        'Flow and Pull Systems': 'Map current state, identify bottlenecks, and pilot kanban systems',
        'Problem Solving & Root Cause Analysis': 'Provide A3 training and establish problem-solving forums'
    };
    return recommendations[dimensionName] || 'Seek expert consultation for tailored improvement strategies';
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
        console.log('View assessment called with ID:', assessmentId);
        
        // Check if user is logged in
        if (!window.currentUser) {
            console.log('User not logged in');
            showErrorMessage('Please sign in to view assessments.');
            // Try to access auth functions
            if (typeof showAuthTab === 'function') {
                showAuthTab('signin');
            }
            return;
        }
        
        console.log('User logged in, checking functions...');
        
        // Try to use admin function if available
        if (typeof viewAssessmentResults === 'function') {
            console.log('Using viewAssessmentResults function');
            await viewAssessmentResults(assessmentId);
        } else {
            console.log('viewAssessmentResults not available, using basic view');
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
        console.log('Basic view assessment called with ID:', assessmentId);
        
        const doc = await db.collection('assessments').doc(assessmentId).get();
        if (!doc.exists) {
            console.log('Assessment not found');
            showErrorMessage('Assessment not found.');
            return;
        }
        
        const assessment = doc.data();
        console.log('Assessment data loaded:', assessment);
        
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
        
        console.log('Creating modal with percentage:', percentage);
        
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
        
        console.log('Adding modal to body');
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
        // Check if user is logged in
        if (!window.currentUser) {
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
        if (assessment.user_id !== window.currentUser.uid && window.currentUserProfile?.role !== 'admin') {
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
        // Check if user is logged in
        if (!window.currentUser) {
            showErrorMessage('Please sign in to delete assessments.');
            if (typeof showAuthTab === 'function') {
                showAuthTab('signin');
            }
            return;
        }
        
        // Confirm deletion
        if (!await showDeleteConfirmation('assessment', 'This action cannot be undone.')) {
            return;
        }
        
        const doc = await db.collection('assessments').doc(assessmentId).get();
        if (!doc.exists) {
            showErrorMessage('Assessment not found.');
            return;
        }
        
        const assessment = doc.data();
        
        // Check if user owns this assessment or is admin
        if (assessment.user_id !== window.currentUser.uid && window.currentUserProfile?.role !== 'admin') {
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
    // Load responses into assessment form
    Object.keys(responses).forEach(questionId => {
        const responseValue = responses[questionId];
        if (responseValue) {
            // Find the radio button with the matching value
            const input = document.querySelector(`input[name="${questionId}"][value="${responseValue}"]`);
            if (input) {
                input.checked = true;
            }
        }
    });
}

// ============================================
// CONFIRMATION MODALS
// ============================================
async function showDeleteConfirmation(itemType, message) {
    return new Promise((resolve) => {
        // Create modal if it doesn't exist
        let modal = document.getElementById('deleteConfirmModal');
        if (modal) {
            modal.remove();
        }
        
        modal = document.createElement('div');
        modal.id = 'deleteConfirmModal';
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
                <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h2 style="margin: 0;">🗑️ Delete ${itemType}</h2>
                </div>
                <div style="padding: 30px; text-align: center;">
                    <p style="margin-bottom: 20px; color: #2d2d2d;">Are you sure you want to delete this ${itemType}? ${message}</p>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button onclick="closeDeleteConfirmModal(false)" class="btn btn-secondary" style="min-width: 100px;">Cancel</button>
                        <button onclick="closeDeleteConfirmModal(true)" class="btn btn-danger" style="min-width: 100px;">Delete</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        // Store resolve function for button clicks
        window.deleteConfirmResolve = resolve;
    });
}

function closeDeleteConfirmModal(confirmed) {
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
        modal.remove();
    }
    
    if (window.deleteConfirmResolve) {
        window.deleteConfirmResolve(confirmed);
        delete window.deleteConfirmResolve;
    }
}

function showResetConfirmation() {
    // Create modal if it doesn't exist
    let modal = document.getElementById('resetConfirmModal');
    if (modal) {
        modal.remove();
    }
    
    modal = document.createElement('div');
    modal.id = 'resetConfirmModal';
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
            <div style="background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h2 style="margin: 0;">🔄 Reset Form</h2>
            </div>
            <div style="padding: 30px; text-align: center;">
                <p style="margin-bottom: 20px; color: #2d2d2d;">Are you sure you want to reset the form? All current data will be lost.</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="closeResetConfirmModal(false)" class="btn btn-secondary" style="min-width: 100px;">Cancel</button>
                    <button onclick="closeResetConfirmModal(true)" class="btn btn-warning" style="min-width: 100px;">Reset</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function closeResetConfirmModal(confirmed) {
    const modal = document.getElementById('resetConfirmModal');
    if (modal) {
        modal.remove();
    }
    
    if (confirmed) {
        document.getElementById('assessmentForm').reset();
        document.getElementById('assessmentDate').value = new Date().toISOString().split('T')[0];
        window.currentAssessmentId = null;
        showSuccessMessage('✓ Form has been reset successfully.');
    }
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

window.currentAssessmentId = null;

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
            showErrorMessage(`Please answer question ${i}.`);
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
        id: window.currentAssessmentId || null,
        companyName: document.getElementById('companyName').value,
        assessorName: document.getElementById('assessorName').value,
        assessmentDate: document.getElementById('assessmentDate').value,
        results: results,
        responses: getFormResponses(),
        isDraft: false
    };

    await saveAssessmentToStorage(assessment);
    
    // Store current assessment data for dashboard display
    window.currentAssessmentData = {
        ...assessment,
        user_name: window.currentUserProfile?.display_name || window.currentUser.email,
        user_email: window.currentUser.email,
        created_at: new Date().toISOString()
    };
    
    window.currentAssessmentId = null;
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
        id: window.currentAssessmentId,
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
    showResetConfirmation();
}

async function saveAssessmentToStorage(assessment) {
    if (!window.currentUser) {
        showErrorMessage('Please login first.');
        return;
    }

    try {
        const now = firebase.firestore.FieldValue.serverTimestamp();

        const assessmentData = {
            user_id: window.currentUser.uid,
            user_email: window.currentUser.email,
            user_name: window.currentUserProfile?.display_name || window.currentUser.email.split('@')[0],
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

        // Show success message
        if (assessment.isDraft) {
            showSuccessMessage('✓ Draft saved successfully! You can continue later.');
        } else {
            showSuccessMessage('✓ Assessment saved successfully! Your results are ready to view.');
        }
        
        // Update all assessments array for chart display
        if (!window.allAssessments) {
            window.allAssessments = [];
        }
        
        // Add or update assessment in the array
        const existingIndex = window.allAssessments.findIndex(a => a.id === currentAssessmentId);
        const assessmentWithResults = {
            ...assessmentData,
            results: assessment.results
        };
        
        if (existingIndex >= 0) {
            window.allAssessments[existingIndex] = assessmentWithResults;
        } else {
            window.allAssessments.push(assessmentWithResults);
        }
        
        // Update total assessments count
        window.totalAssessments = window.allAssessments.length;
        
    } catch (error) {
        console.error('Exception:', error?.message || error);
        showErrorMessage('Failed to save assessment. Please try again.');
    }
}

function drawPerformanceChart(assessments) {
    try {
        const canvas = document.getElementById('performanceChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Handle both array of assessment objects and other formats
        let chartScores, labels, assessmentData;
        
        if (Array.isArray(assessments) && assessments.length > 0 && assessments[0].results) {
            // New dashboard: array of assessment objects
            assessmentData = assessments;
            chartScores = assessments.map(assessment => {
                // Try multiple ways to get the percentage
                if (assessment.results && assessment.results.overallPercentage !== undefined) {
                    return assessment.results.overallPercentage;
                } else if (assessment.results && assessment.results.overall_score !== undefined) {
                    return (assessment.results.overall_score / 5) * 100;
                } else if (assessment.overallPercentage !== undefined) {
                    return assessment.overallPercentage;
                } else {
                    console.log('Assessment data:', assessment);
                    return 0; // Fallback
                }
            });
            
            // Extract dates for labels
            labels = assessments.map(assessment => {
                const date = assessment.assessment_date || assessment.created_at;
                const dateObj = new Date(date);
                return dateObj.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                });
            });
        } else if (assessments && assessments.dimensions) {
            // Old format: results object with dimensions
            chartScores = assessments.dimensions.map(dim => dim.percentage);
            labels = assessments.dimensions.map(dim => dim.dimension);
            assessmentData = null;
        } else {
            // Fallback: use all assessments
            const allAssessments = window.allAssessments || [];
            assessmentData = allAssessments;
            chartScores = allAssessments.map(assessment => {
                if (assessment.results && assessment.results.overallPercentage !== undefined) {
                    return assessment.results.overallPercentage;
                } else if (assessment.results && assessment.results.overall_score !== undefined) {
                    return (assessment.results.overall_score / 5) * 100;
                } else {
                    return 0;
                }
            });
            labels = allAssessments.map((_, index) => `Assessment ${index + 1}`);
        }
        
        console.log('Chart data prepared:', { chartScores, labels, assessmentDataCount: assessmentData?.length });
        
        // Get status colors
        const colors = chartScores.map(score => {
            const status = getScoreStatus(score);
            return status.color || '#821874';
        });
        
        // Create bar chart with assessment data
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Overall LEAN Maturity %',
                    data: chartScores,
                    backgroundColor: colors,
                    borderColor: colors.map(color => color),
                    borderWidth: 2,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 20,
                        bottom: 20,
                        left: 10,
                        right: 10
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                const index = context[0].dataIndex;
                                if (assessmentData && assessmentData[index]) {
                                    const assessment = assessmentData[index];
                                    return `Assessment: ${assessment.company_name || 'Unknown'}`;
                                }
                                return 'Assessment';
                            },
                            label: function(context) {
                                const index = context.dataIndex;
                                const score = context.parsed.y;
                                const status = getScoreStatus(score);
                                
                                let tooltipLines = [
                                    `Score: ${score.toFixed(1)}%`,
                                    `Status: ${status.label}`
                                ];
                                
                                // Add date if assessment data is available
                                if (assessmentData && assessmentData[index]) {
                                    const assessment = assessmentData[index];
                                    const date = assessment.assessment_date || assessment.created_at;
                                    const dateObj = new Date(date);
                                    tooltipLines.push(`Date: ${dateObj.toLocaleDateString()}`);
                                }
                                
                                return tooltipLines;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20,
                            callback: function(value) {
                                return value + '%';
                            },
                            padding: 10
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            display: true,
                            font: {
                                size: 11
                            },
                            padding: 10,
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 0
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error drawing performance chart:', error);
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
