// ============================================
// EXPORT & PDF GENERATION MODULE
// ============================================

// ============================================
// GENERATE DETAILED SCORES VIEW
// ============================================
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

// ============================================
// PDF PREVIEW FUNCTIONS
// ============================================
let previewAssessment = null;

async function showPDFPreview(assessment) {
    previewAssessment = assessment;
    
    const modal = document.getElementById('pdfPreviewModal');
    const content = document.getElementById('pdfPreviewContent');
    
    // Generate preview content (HTML version of PDF)
    content.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="spinner"></div><p>Generating preview...</p></div>';
    modal.style.display = 'block';
    
    // Add spinner CSS if not exists
    if (!document.getElementById('spinnerStyle')) {
        const style = document.createElement('style');
        style.id = 'spinnerStyle';
        style.textContent = `
            .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #821874; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `;
        document.head.appendChild(style);
    }
    
    setTimeout(async () => {
        const previewHTML = await generatePDFPreviewHTML(assessment);
        content.innerHTML = previewHTML;
    }, 500);
}

function closePDFPreview() {
    document.getElementById('pdfPreviewModal').style.display = 'none';
    previewAssessment = null;
}

async function confirmExportPDF() {
    if (previewAssessment) {
        closePDFPreview();
        await generatePDFReport(previewAssessment);
    }
}

async function generatePDFPreviewHTML(assessment) {
    const results = assessment.results;
    const date = new Date(assessment.assessment_date || assessment.created_at).toLocaleDateString();
    
    let html = `
        <div style="font-family: Arial, sans-serif;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #821874 0%, #159eda 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; margin-bottom: 20px;">
                <h1 style="margin: 0 0 10px 0;">MEGA LEAN Assessment Report</h1>
                <p style="margin: 0;">Comprehensive LEAN Maturity Analysis</p>
            </div>
            
            <!-- Assessment Details -->
            <div style="border: 2px solid #821874; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600;">Company:</td>
                        <td style="padding: 8px 0;">${assessment.company_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600;">Assessed By:</td>
                        <td style="padding: 8px 0;">${assessment.assessor_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600;">Date:</td>
                        <td style="padding: 8px 0;">${date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600;">Report Generated:</td>
                        <td style="padding: 8px 0;">${new Date().toLocaleDateString()}</td>
                    </tr>
                </table>
            </div>
            
            <!-- Overall Score -->
            <div style="background: linear-gradient(135deg, #159eda 0%, #00bcd4 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="margin: 0 0 10px 0;">Overall LEAN Maturity</h2>
                <div style="font-size: 48px; font-weight: bold; margin: 15px 0;">${results.overallPercentage}%</div>
                <div style="font-size: 24px;">${results.status}</div>
            </div>
            
            <!-- Spider Chart Note -->
            <div style="background: #f0f7fa; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                <p style="margin: 0; color: #666;"><em>📊 Spider diagram will be included in the exported PDF</em></p>
            </div>
            
            <!-- Dimension Scores Table -->
            <h3 style="color: #821874; margin: 30px 0 15px 0;">Dimension Breakdown</h3>
            <table style="width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <thead style="background: linear-gradient(135deg, #821874 0%, #159eda 100%); color: white;">
                    <tr>
                        <th style="padding: 12px; text-align: left;">Dimension</th>
                        <th style="padding: 12px; text-align: center;">Score</th>
                        <th style="padding: 12px; text-align: center;">Percentage</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    results.dimensions.forEach((dim, index) => {
        const bgColor = index % 2 === 0 ? '#fafafa' : 'white';
        const statusClass = getStatusClass(dim.percentage);
        let percentColor = '#dc3545';
        if (statusClass.includes('advanced')) percentColor = '#28a745';
        else if (statusClass.includes('developing')) percentColor = '#159eda';
        else if (statusClass.includes('emerging')) percentColor = '#ffc107';
        
        html += `
            <tr style="background: ${bgColor};">
                <td style="padding: 12px;">${dim.dimension}</td>
                <td style="padding: 12px; text-align: center;">${dim.score}/${dim.maxScore}</td>
                <td style="padding: 12px; text-align: center; font-weight: 600; color: ${percentColor};">${dim.percentage}%</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
            
            <!-- Question-Level Details -->
            <h3 style="color: #821874; margin: 30px 0 15px 0;">Detailed Question Responses</h3>
    `;
    
    html += generateDetailedScores(assessment);
    
    // Add feedback
    html += `
        <h3 style="color: #821874; margin: 30px 0 15px 0;">Assessment Insights & Recommendations</h3>
        ${generateFeedback(results)}
        
        <h3 style="color: #821874; margin: 30px 0 15px 0;">What's Next?</h3>
        <p>Now that you've completed the assessment, contact Barry at <a href="mailto:barry.taylor@midulstermega.com">barry.taylor@midulstermega.com</a> to:</p>
        <ul>
            <li>Review your results in detail</li>
            <li>Discuss your priority focus areas</li>
            <li>Explore training options tailored to your organization's maturity level</li>
        </ul>
        
        <h4>Two training pathways are available:</h4>
        <ol>
            <li><strong>Continuous Improvement Training and Coaching Model</strong> - For groups of 5-10 people from one organization</li>
            <li><strong>Certified Lean Practitioner Program</strong> - For individual candidates</li>
        </ol>
        
        <h4>How the Certified Lean Practitioner Program Works:</h4>
        <ol>
            <li><strong>Enroll & Access Learning Portal</strong>: Get immediate access to high quality online content and resources.</li>
            <li><strong>Complete 3 Learning Modules</strong>:
                <ul>
                    <li>Lean & TPS Fundamentals</li>
                    <li>7QC Tools Course</li>
                    <li>Value Stream Mapping (VSM)</li>
                </ul>
            </li>
            <li><strong>Project Coaching</strong>: Engage one-to-one with expert coaches who guide you through a real business improvement project using a streamlined, proven template.</li>
            <li><strong>Exam Module</strong>: Prove your learning mastery by completing a 2-hour exam consisting of 180 carefully curated multiple-choice questions.</li>
            <li><strong>Certification</strong>: Upon successful completion of coursework, project, and exam, receive your official Lean Practitioner Certificate.</li>
        </ol>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #821874;">
            <p style="margin: 0; font-style: italic;">Contact Barry for more details and special pricing for MEGA.</p>
        </div>
    `;
    
    html += '</div>';
    return html;
}

// ============================================
// GENERATE FEEDBACK BASED ON SCORES
// ============================================
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
// GENERATE SPIDER/RADAR CHART
// ============================================
async function generateSpiderChart(results) {
    return new Promise((resolve) => {
        // Create temporary canvas
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        
        const labels = results.dimensions.map(d => d.dimension);
        const data = results.dimensions.map(d => d.percentage);
        
        const chart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'LEAN Maturity',
                    data: data,
                    backgroundColor: 'rgba(130, 24, 116, 0.2)',
                    borderColor: 'rgba(130, 24, 116, 1)',
                    borderWidth: 3,
                    pointBackgroundColor: 'rgba(130, 24, 116, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(130, 24, 116, 1)',
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20,
                            font: { size: 12 }
                        },
                        pointLabels: {
                            font: { size: 11, weight: 'bold' }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        
        // Wait for chart to render
        setTimeout(() => {
            const imageData = canvas.toDataURL('image/png');
            chart.destroy();
            resolve(imageData);
        }, 500);
    });
}

// ============================================
// GENERATE PDF REPORT
// ============================================
async function generatePDFReport(assessment) {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        let yPos = margin;
        
        // Header with logo area
        doc.setFillColor(130, 24, 116);
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text('MEGA LEAN Assessment Report', pageWidth / 2, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text('Comprehensive LEAN Maturity Analysis', pageWidth / 2, 30, { align: 'center' });
        
        yPos = 50;
        
        // Assessment Details Box
        doc.setDrawColor(130, 24, 116);
        doc.setLineWidth(0.5);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 35);
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        
        yPos += 8;
        doc.text('Company:', margin + 5, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(assessment.company_name, margin + 35, yPos);
        
        yPos += 7;
        doc.setFont(undefined, 'bold');
        doc.text('Assessed By:', margin + 5, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(assessment.assessor_name, margin + 35, yPos);
        
        yPos += 7;
        doc.setFont(undefined, 'bold');
        doc.text('Date:', margin + 5, yPos);
        doc.setFont(undefined, 'normal');
        const assessmentDate = new Date(assessment.assessment_date || assessment.created_at).toLocaleDateString();
        doc.text(assessmentDate, margin + 35, yPos);
        
        yPos += 7;
        doc.setFont(undefined, 'bold');
        doc.text('Report Generated:', margin + 5, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(new Date().toLocaleDateString(), margin + 35, yPos);
        
        yPos += 15;
        
        const results = assessment.results;
        
        // Overall Score Section
        doc.setFillColor(21, 158, 218);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 30, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Overall LEAN Maturity', pageWidth / 2, yPos + 10, { align: 'center' });
        
        doc.setFontSize(28);
        doc.text(`${results.overallPercentage}%`, pageWidth / 2, yPos + 22, { align: 'center' });
        
        doc.setFontSize(14);
        doc.text(results.status, pageWidth / 2, yPos + 28, { align: 'center' });
        
        yPos += 40;
        
        // Spider Chart
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('LEAN Maturity Spider Diagram', pageWidth / 2, yPos, { align: 'center' });
        
        yPos += 5;
        
        const chartImage = await generateSpiderChart(results);
        const chartWidth = 120;
        const chartHeight = 120;
        doc.addImage(chartImage, 'PNG', (pageWidth - chartWidth) / 2, yPos, chartWidth, chartHeight);
        
        yPos += chartHeight + 10;
        
        // Check if we need a new page
        if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = margin;
        }
        
        // Dimension Scores Table
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Dimension Breakdown', margin, yPos);
        yPos += 8;
        
        // Table header
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('Dimension', margin + 2, yPos + 5);
        doc.text('Score', pageWidth - margin - 35, yPos + 5);
        doc.text('Percentage', pageWidth - margin - 20, yPos + 5);
        
        yPos += 8;
        
        // Table rows
        doc.setFont(undefined, 'normal');
        results.dimensions.forEach((dim, index) => {
            if (yPos > pageHeight - 30) {
                doc.addPage();
                yPos = margin;
            }
            
            if (index % 2 === 0) {
                doc.setFillColor(250, 250, 250);
                doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');
            }
            
            doc.setFontSize(9);
            doc.text(dim.dimension, margin + 2, yPos + 5);
            doc.text(`${dim.score}/${dim.maxScore}`, pageWidth - margin - 35, yPos + 5);
            
            // Color-code percentage
            const statusClass = getStatusClass(dim.percentage);
            if (statusClass.includes('advanced')) doc.setTextColor(76, 175, 80);
            else if (statusClass.includes('developing')) doc.setTextColor(33, 150, 243);
            else if (statusClass.includes('emerging')) doc.setTextColor(255, 193, 7);
            else doc.setTextColor(244, 67, 54);
            
            doc.text(`${dim.percentage}%`, pageWidth - margin - 20, yPos + 5);
            doc.setTextColor(0, 0, 0);
            
            yPos += 7;
        });
        
        // Add new page for detailed question responses
        doc.addPage();
        yPos = margin;
        
        // Detailed Questions Section
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(130, 24, 116);
        doc.text('Detailed Question Responses', margin, yPos);
        yPos += 10;
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        
        // Add questions by dimension
        const responses = assessment.responses;
        DIMENSIONS.forEach((dimension, dimIndex) => {
            const dimensionResult = results.dimensions.find(d => d.dimension === dimension.name);
            if (!dimensionResult) return;
            
            // Check if we need a new page
            if (yPos > pageHeight - 60) {
                doc.addPage();
                yPos = margin;
            }
            
            // Dimension header
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(130, 24, 116);
            doc.text(dimension.name, margin, yPos);
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(9);
            doc.text(`${dimensionResult.percentage}% (${dimensionResult.score}/${dimensionResult.maxScore})`, pageWidth - margin - 30, yPos);
            yPos += 7;
            
            doc.setFont(undefined, 'normal');
            doc.setFontSize(8);
            
            // Get questions for this dimension
            const dimensionQuestions = QUESTIONS.filter(q => q.dimension === dimIndex);
            
            dimensionQuestions.forEach(question => {
                if (yPos > pageHeight - 25) {
                    doc.addPage();
                    yPos = margin;
                }
                
                const answer = responses[`q${question.id}`];
                const answerText = answer ? RATING_OPTIONS.find(opt => opt.value == answer)?.label || 'N/A' : 'Not Answered';
                const score = answer || 0;
                
                // Question text
                doc.setFont(undefined, 'bold');
                doc.text(`Q${question.id}.`, margin + 2, yPos);
                doc.setFont(undefined, 'normal');
                
                const questionLines = doc.splitTextToSize(question.text, pageWidth - margin * 2 - 40);
                doc.text(questionLines, margin + 10, yPos);
                yPos += questionLines.length * 4;
                
                // Answer with color coding
                if (score >= 4) doc.setTextColor(76, 175, 80);
                else if (score === 3) doc.setTextColor(255, 193, 7);
                else if (score > 0) doc.setTextColor(244, 67, 54);
                else doc.setTextColor(128, 128, 128);
                
                doc.setFont(undefined, 'bold');
                doc.text(`Answer: ${answerText} (${score}/5)`, margin + 10, yPos);
                doc.setTextColor(0, 0, 0);
                yPos += 6;
            });
            
            yPos += 3; // Space between dimensions
        });
        
        // Add new page for feedback
        doc.addPage();
        yPos = margin;
        
        // Feedback Section
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(130, 24, 116);
        doc.text('Assessment Insights & Recommendations', margin, yPos);
        yPos += 10;
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        // Generate and add feedback (simplified for PDF)
        const feedback = generateSimplifiedFeedback(results);
        const feedbackLines = doc.splitTextToSize(feedback, pageWidth - 2 * margin);
        feedbackLines.forEach(line => {
            if (yPos > pageHeight - 20) {
                doc.addPage();
                yPos = margin;
            }
            doc.text(line, margin, yPos);
            yPos += 5;
        });
        
        // Add Next Steps section
        doc.addPage();
        yPos = margin;
        
        // Next Steps Section
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(130, 24, 116);
        doc.text("What's Next?", margin, yPos);
        yPos += 10;
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        // Next Steps Content
        let nextSteps = [
            "Now that you've completed the assessment, contact Barry at barry.taylor@midulstermega.com to:",
            "• Review your results in detail",
            "• Discuss your priority focus areas",
            "• Explore training options tailored to your organization's maturity level",
            "",
            "Two training pathways are available:",
            "1. Continuous Improvement Training and Coaching Model - For groups of 5-10 people from one organization",
            "2. Certified Lean Practitioner Program - For individual candidates",
            "",
            "How the Certified Lean Practitioner Program Works:",
            "1. Enroll & Access Learning Portal: Get immediate access to high quality online content and resources.",
            "2. Complete 3 Learning Modules:",
            "   • Lean & TPS Fundamentals",
            "   • 7QC Tools Course",
            "   • Value Stream Mapping (VSM)",
            "3. Project Coaching: Engage one-to-one with expert coaches who guide you through a real business improvement project.",
            "4. Exam Module: 2-hour exam with 180 multiple-choice questions.",
            "5. Certification: Receive your official Lean Practitioner Certificate upon successful completion."
        ];
        
        nextSteps.forEach(line => {
            if (yPos > pageHeight - 20) {
                doc.addPage();
                yPos = margin;
            }
            
            // Handle bullet points and indentation
            let indent = 0;
            let text = line;
            
            if (line.startsWith("•")) {
                indent = 10;
                text = line.substring(1).trim();
            } else if (line.match(/^\d+\./)) {
                // Numbered list
                indent = 0;
            } else if (line.trim().startsWith("•")) {
                // Indented bullet points
                indent = 20;
                text = line.trim().substring(1).trim();
            } else if (line.trim() === "") {
                // Empty line
                yPos += 5;
                return;
            }
            
            doc.text(line, margin + indent, yPos);
            yPos += 5;
        });
        
        // Add contact box
        yPos += 5;
        doc.setFillColor(248, 249, 250);
        doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 15, 3, 3, 'F');
        doc.setDrawColor(130, 24, 116);
        doc.setLineWidth(0.5);
        doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 15, 3, 3, 'S');
        
        doc.setFont(undefined, 'italic');
        doc.text("Contact Barry for more details and special pricing for MEGA.", margin + 10, yPos + 10);
        
        // Footer on all pages
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(
                `© 2024 MEGA LEAN Assessment Tool | Kaizen Academy™ | Page ${i} of ${pageCount}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );
        }
        
        // Save PDF
        const filename = `LEAN_Assessment_${assessment.company_name.replace(/\s+/g, '_')}_${assessmentDate.replace(/\//g, '-')}.pdf`;
        doc.save(filename);
        
        return true;
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF report. Please try again.');
        return false;
    }
}

function generateSimplifiedFeedback(results) {
    const sorted = [...results.dimensions].sort((a, b) => b.percentage - a.percentage);
    const best = sorted.slice(0, 2);
    const worst = sorted.slice(-2).reverse();
    
    let feedback = `Overall LEAN Maturity: ${results.status} (${results.overallPercentage}%)\n\n`;
    
    feedback += `KEY STRENGTHS:\n`;
    best.forEach(dim => {
        feedback += `• ${dim.dimension}: ${dim.percentage}% - ${getDimensionFeedback(dim.dimension, dim.percentage, true)}\n\n`;
    });
    
    feedback += `\nFOCUS AREAS FOR IMPROVEMENT:\n`;
    worst.forEach(dim => {
        feedback += `• ${dim.dimension}: ${dim.percentage}% - ${getDimensionFeedback(dim.dimension, dim.percentage, false)}\n\n`;
    });
    
    feedback += `\nRECOMMENDED ACTIONS:\n`;
    if (results.overallPercentage < 32) {
        feedback += `• Start with Leadership Development and basic LEAN training\n`;
        feedback += `• Focus on quick wins to build momentum\n`;
        feedback += `• Establish visual management systems\n`;
    } else if (results.overallPercentage < 49) {
        feedback += `• Strengthen process standardization\n`;
        feedback += `• Develop problem-solving capabilities\n`;
        feedback += `• Implement regular improvement cycles\n`;
    } else if (results.overallPercentage < 67) {
        feedback += `• Advance continuous improvement practices\n`;
        feedback += `• Optimize flow and pull systems\n`;
        feedback += `• Deepen customer value understanding\n`;
    } else {
        feedback += `• Pursue operational excellence\n`;
        feedback += `• Benchmark against best-in-class\n`;
        feedback += `• Drive breakthrough innovations\n`;
    }
    
    return feedback;
}

// ============================================
// DATA EXPORT (CSV)
// ============================================
async function exportAssessmentData(assessmentId = null) {
    try {
        let assessments;
        
        if (assessmentId) {
            // Export single assessment
            const { data, error } = await supabase
                .from('assessments')
                .select('*')
                .eq('id', assessmentId)
                .single();
            
            if (error) throw error;
            assessments = [data];
        } else {
            // Export all user's assessments (or all for admin)
            assessments = await loadUserAssessments();
        }
        
        if (!assessments || assessments.length === 0) {
            alert('No data to export');
            return;
        }
        
        // Create CSV
        let csv = 'Company,Assessor,Date,Status,Overall Score,Overall Percentage,Maturity Level,';
        csv += 'Leadership & Culture,Customer Value Focus,Process Efficiency,Waste Elimination,';
        csv += 'Continuous Improvement,Flow & Pull Systems,Problem Solving\n';
        
        assessments.forEach(assessment => {
            const date = new Date(assessment.assessment_date || assessment.created_at).toLocaleDateString();
            const status = assessment.is_draft ? 'Draft' : 'Completed';
            
            csv += `"${assessment.company_name}","${assessment.assessor_name}","${date}","${status}",`;
            
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
        link.setAttribute('download', `LEAN_Assessment_Data_${new Date().toISOString().split('T')[0]}.csv`);
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
// EXPORT ALL USER DATA (GDPR Compliance)
// ============================================
async function exportUserData() {
    try {
        if (!currentUser) {
            alert('Please login first');
            return;
        }
        
        // Get all user data
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        
        const assessments = await loadUserAssessments();
        
        const userData = {
            profile: profile,
            assessments: assessments,
            exportDate: new Date().toISOString(),
            dataProtectionNotice: 'This export contains all your personal data stored in the MEGA LEAN Assessment system.'
        };
        
        // Download as JSON
        const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `My_LEAN_Data_${currentUser.email}_${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('Your data has been exported successfully!');
        
    } catch (error) {
        console.error('Error exporting user data:', error);
        alert('Error exporting your data. Please try again.');
    }
}
