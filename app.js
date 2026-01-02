// ============================================
// APPLICATION CONTROLLER
// ============================================

// ============================================
// DASHBOARD TAB SWITCHING
// ============================================
function showDashboardTab(tabName) {
    // Since dashboard tabs are hidden, only show overview content
    const overviewTab = document.getElementById('overviewTab');
    if (overviewTab) {
        overviewTab.classList.add('active');
    }
    
    // Try to remove active class from tabs (but don't error if they don't exist)
    const dashboardTabs = document.getElementById('dashboardTabs');
    if (dashboardTabs) {
        dashboardTabs.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
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
        
        // Load detailed scores using original function (expects assessment object)
        if (window.currentIndividualAssessment) {
            const container = document.getElementById('individualDetailedScoresContainer');
            if (container) {
                container.innerHTML = generateDetailedScores(window.currentIndividualAssessment);
                container.style.display = 'block';
            }
        }
    } else if (tabName === 'feedback') {
        document.getElementById('individualFeedbackTab').classList.add('active');
        document.querySelectorAll('#individualTabs .tab')[2].classList.add('active');
        
        // Load feedback using original function (expects results object)
        if (window.currentIndividualAssessment && window.currentIndividualAssessment.results) {
            const container = document.getElementById('individualFeedbackSection');
            if (container) {
                container.innerHTML = generateFeedback(window.currentIndividualAssessment.results);
                container.style.display = 'block';
            }
        }
    }
}

// ============================================
// PDF EXPORT FUNCTIONS FOR DASHBOARD
// ============================================
async function previewCurrentAssessmentPDF() {
    if (!window.currentAssessmentData || !window.currentAssessmentData.results) {
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('No assessment data to preview');
        } else {
            alert('No assessment data to preview');
        }
        return;
    }
    
    try {
        // Generate preview HTML directly
        const previewContent = generateSimplePDFPreview(window.currentAssessmentData);
        document.getElementById('pdfPreviewContent').innerHTML = previewContent;
        document.getElementById('pdfPreviewModal').style.display = 'block';
        
        // Store assessment for export
        window.previewAssessment = window.currentAssessmentData;
    } catch (error) {
        console.error('Error generating preview:', error);
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Failed to generate preview: ' + error.message);
        } else {
            alert('Failed to generate preview: ' + error.message);
        }
    }
}

async function exportCurrentAssessmentPDF() {
    console.log('Export Current Assessment PDF called');
    
    if (!window.currentAssessmentData || !window.currentAssessmentData.results) {
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('No assessment data to export');
        } else {
            alert('No assessment data to export');
        }
        return;
    }
    
    try {
        await generateSimplePDF(window.currentAssessmentData);
    } catch (error) {
        console.error('Error exporting PDF:', error);
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Failed to export PDF: ' + error.message);
        } else {
            alert('Failed to export PDF: ' + error.message);
        }
    }
}

// ============================================
// PDF EXPORT FUNCTIONS FOR INDIVIDUAL RESULTS
// ============================================
async function previewIndividualAssessmentPDF() {
    if (!window.currentIndividualAssessment) {
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('No assessment data to preview');
        } else {
            alert('No assessment data to preview');
        }
        return;
    }
    
    try {
        // Generate preview HTML directly
        const previewContent = generateSimplePDFPreview(window.currentIndividualAssessment);
        document.getElementById('pdfPreviewContent').innerHTML = previewContent;
        document.getElementById('pdfPreviewModal').style.display = 'block';
        
        // Store assessment for export
        window.previewAssessment = window.currentIndividualAssessment;
    } catch (error) {
        console.error('Error generating preview:', error);
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Failed to generate preview: ' + error.message);
        } else {
            alert('Failed to generate preview: ' + error.message);
        }
    }
}

async function exportIndividualAssessmentPDF() {
    if (!window.currentIndividualAssessment) {
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('No assessment data to export');
        } else {
            alert('No assessment data to export');
        }
        return;
    }
    
    try {
        await generateSimplePDF(window.currentIndividualAssessment);
    } catch (error) {
        console.error('Error exporting individual assessment PDF:', error);
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Failed to export PDF: ' + error.message);
        } else {
            alert('Failed to export PDF: ' + error.message);
        }
    }
}

// ============================================
// SIMPLE PDF GENERATION FUNCTIONS
// ============================================
function generateSimplePDFPreview(assessmentData) {
    const results = assessmentData.results;
    const date = new Date(assessmentData.assessment_date || assessmentData.created_at).toLocaleDateString();
    
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
                        <td style="padding: 8px 0;">${assessmentData.company_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600;">Assessed By:</td>
                        <td style="padding: 8px 0;">${assessmentData.assessor_name}</td>
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
    
    html += generateDetailedScores(assessmentData);
    
    // Add feedback with "What's Next" section
    html += `
        <h3 style="color: #821874; margin: 30px 0 15px 0;">Assessment Insights & Recommendations</h3>
        ${generateFeedback(results)}
        
    `;
    
    html += '</div>';
    return html;
}

function getStatusClass(percentage) {
    if (percentage >= 80) return 'status-advanced';
    if (percentage >= 60) return 'status-developing';
    if (percentage >= 40) return 'status-emerging';
    return 'status-novice';
}

function generateDetailedInsights(results) {
    const overallPercentage = results.overallPercentage || 0;
    const sorted = [...results.dimensions].sort((a, b) => b.percentage - a.percentage);
    const best = sorted.slice(0, 2);
    const worst = sorted.slice(-2).reverse();
    
    let insights = `
        <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 10px 0;">
            <h4 style="color: #821874;">Key Strengths</h4>
            ${best.map(dim => `
                <div style="margin: 10px 0;">
                    <strong>${dim.dimension}:</strong> ${dim.percentage}% - ${getDimensionFeedback(dim.dimension, dim.percentage, true)}
                </div>
            `).join('')}
        </div>
        
        <div style="background: #fff5f5; padding: 15px; border-radius: 8px; margin: 10px 0;">
            <h4 style="color: #dc2626;">Areas for Improvement</h4>
            ${worst.map(dim => `
                <div style="margin: 10px 0;">
                    <strong>${dim.dimension}:</strong> ${dim.percentage}% - ${getDimensionFeedback(dim.dimension, dim.percentage, false)}
                </div>
            `).join('')}
        </div>
        
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 10px 0;">
            <h4 style="color: #059669;">Recommended Actions</h4>
            ${getRecommendationsHTML(overallPercentage)}
        </div>
    `;
    
    return insights;
}

function getDimensionFeedback(dimensionName, percentage, isStrength = false) {
    const feedbackMap = {
        'Leadership & Culture': {
            strength: 'Excellent leadership commitment and cultural foundation supporting LEAN initiatives',
            weakness: 'Leadership needs development and cultural transformation to support LEAN effectively',
            emerging: 'Leadership awareness is growing but needs consistent application and commitment'
        },
        'Customer Value Focus': {
            strength: 'Strong customer-centric approach with clear value delivery mechanisms',
            weakness: 'Customer value understanding needs significant improvement and focus',
            emerging: 'Customer focus is developing but not yet systematic or comprehensive'
        },
        'Process Efficiency': {
            strength: 'Well-optimized processes with minimal waste and high efficiency',
            weakness: 'Processes are inefficient and contain significant waste requiring optimization',
            emerging: 'Process improvements are beginning but not yet systematic or sustained'
        },
        'Waste Elimination - Muda': {
            strength: 'Excellent waste identification and elimination with systematic approaches',
            weakness: 'Waste is prevalent and not systematically addressed or eliminated',
            emerging: 'Basic waste identification exists but elimination is inconsistent'
        },
        'Continuous Improvement - Kaizen': {
            strength: 'Culture of continuous improvement is well-established and actively practiced',
            weakness: 'Continuous improvement is not practiced regularly or systematically',
            emerging: 'Kaizen events occur but lack sustainability and cultural integration'
        },
        'Flow and Pull Systems': {
            strength: 'Excellent flow and pull system implementation with smooth value streams',
            weakness: 'Push system dominates, flow concepts not applied or understood',
            emerging: 'Some flow concepts introduced but not fully implemented or effective'
        },
        'Problem Solving & Root Cause Analysis': {
            strength: 'Advanced problem-solving and root cause analysis with systematic methodologies',
            weakness: 'Reactive problem-solving without proper root cause analysis',
            emerging: 'Basic problem-solving skills exist but need systematic approach'
        }
    };
    
    const key = dimensionName;
    const feedback = feedbackMap[key] || {
        strength: 'Good performance in this area with effective practices',
        weakness: 'Needs improvement in this area with focused development',
        emerging: 'Developing capability in this area with room for growth'
    };
    
    return isStrength ? feedback.strength : feedback.weakness;
}

function getRecommendationsHTML(overallPercentage) {
    let recommendations = [];
    
    if (overallPercentage < 32) {
        recommendations = [
            'Start with leadership development and basic LEAN training to establish foundational understanding',
            'Implement visual management boards to make work and problems visible at the gemba level',
            'Focus on identifying and eliminating obvious waste to build momentum and demonstrate benefits',
            'Establish basic 5S and workplace organization practices'
        ];
    } else if (overallPercentage < 49) {
        recommendations = [
            'Develop standardized work processes and procedures to ensure consistency and predictability',
            'Train team members in systematic problem-solving and root cause analysis techniques',
            'Establish daily improvement meetings and systematic review processes',
            'Implement basic flow and pull concepts in key processes'
        ];
    } else if (overallPercentage < 67) {
        recommendations = [
            'Optimize processes for flow and pull systems to reduce bottlenecks and improve delivery',
            'Map and analyze customer value streams to identify non-value-added activities',
            'Implement advanced problem-solving methodologies and statistical process control',
            'Deepen continuous improvement practices and cultural integration'
        ];
    } else {
        recommendations = [
            'Pursue operational excellence through advanced LEAN tools and techniques',
            'Benchmark against industry best practices and world-class organizations',
            'Drive breakthrough innovations through creative problem-solving and experimentation',
            'Develop advanced supplier partnerships and value stream integration'
        ];
    }
    
    return recommendations.map(rec => `<div style="margin: 8px 0;">• ${rec}</div>`).join('');
}

async function generateSimplePDF(assessmentData) {
    // Load jsPDF dynamically if not available
    if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // Get jsPDF from the loaded library
    let jsPDFConstructor;
    if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
        jsPDFConstructor = window.jspdf.jsPDF;
    } else if (typeof window.jsPDF !== 'undefined') {
        jsPDFConstructor = window.jsPDF;
    } else {
        throw new Error('jsPDF library could not be loaded');
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;
    
    // ===== PAGE 1: OVERVIEW =====
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
    doc.text(assessmentData.company_name, margin + 35, yPos);
    
    yPos += 7;
    doc.setFont(undefined, 'bold');
    doc.text('Assessed By:', margin + 5, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(assessmentData.assessor_name, margin + 35, yPos);
    
    yPos += 7;
    doc.setFont(undefined, 'bold');
    doc.text('Date:', margin + 5, yPos);
    doc.setFont(undefined, 'normal');
    const assessmentDate = new Date(assessmentData.assessment_date || assessmentData.created_at).toLocaleDateString();
    doc.text(assessmentDate, margin + 35, yPos);
    
    yPos += 7;
    doc.setFont(undefined, 'bold');
    doc.text('Report Generated:', margin + 5, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(' ' + new Date().toLocaleDateString(), margin + 60, yPos);
    
    yPos += 15;
    
    const results = assessmentData.results;
    
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
    
    // ===== PAGE 2: SPIDER CHART =====
    doc.addPage();
    yPos = margin;
    
    // Page header
    doc.setFillColor(130, 24, 116);
    doc.rect(0, 0, pageWidth, 60, 'F');
    
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, margin, pageWidth - 2 * margin, 40, 'F');
    
    doc.setTextColor(130, 24, 116);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Performance Visualization', pageWidth / 2, 35, { align: 'center' });
    
    yPos = 80;
    
    // Spider Chart
    try {
        const spiderChartImage = await generateSpiderChart(results);
        if (spiderChartImage) {
            const chartSize = 120;
            doc.setDrawColor(130, 24, 116);
            doc.setLineWidth(1);
            doc.rect((pageWidth - chartSize) / 2, yPos, chartSize, chartSize, 'S');
            
            doc.addImage(spiderChartImage, 'PNG', (pageWidth - chartSize) / 2 + 2, yPos + 2, chartSize - 4, chartSize - 4);
            yPos += chartSize + 30;
        } else {
            doc.setFontSize(12);
            doc.setTextColor(128, 128, 128);
            doc.text('Chart generation temporarily unavailable', pageWidth / 2, yPos + 40, { align: 'center' });
            yPos += 80;
        }
    } catch (error) {
        console.warn('Failed to generate spider chart:', error);
        doc.setFontSize(12);
        doc.setTextColor(128, 128, 128);
        doc.text('Chart unavailable at this time', pageWidth / 2, yPos + 40, { align: 'center' });
        yPos += 80;
    }
    
    // ===== PAGE 3: DETAILED DIMENSIONS =====
    if (yPos > pageHeight - 100) {
        doc.addPage();
        yPos = margin;
    }
    
    // Page header
    doc.setFillColor(130, 24, 116);
    doc.rect(0, 0, pageWidth, 60, 'F');
    
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, margin, pageWidth - 2 * margin, 40, 'F');
    
    doc.setTextColor(130, 24, 116);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Dimension Analysis', pageWidth / 2, 35, { align: 'center' });
    
    yPos = 80;
    
    // Dimension table
    if (results && results.dimensions && Array.isArray(results.dimensions)) {
        // Table header
        doc.setFillColor(130, 24, 116);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 12, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('Dimension', margin + 5, yPos + 8);
        doc.text('Score', margin + 80, yPos + 8);
        doc.text('Percentage', margin + 120, yPos + 8);
        doc.text('Status', margin + 170, yPos + 8);
        
        yPos += 15;
        
        // Table rows
        results.dimensions.forEach((dim, index) => {
            if (yPos > pageHeight - 30) {
                doc.addPage();
                yPos = margin;
                
                // Repeat header on new page
                doc.setFillColor(130, 24, 116);
                doc.rect(margin, yPos, pageWidth - 2 * margin, 12, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.text('Dimension', margin + 5, yPos + 8);
                doc.text('Score', margin + 80, yPos + 8);
                doc.text('Percentage', margin + 120, yPos + 8);
                doc.text('Status', margin + 170, yPos + 8);
                yPos += 15;
            }
            
            // Alternate row colors
            if (index % 2 === 0) {
                doc.setFillColor(248, 249, 250);
                doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
            }
            
            const statusInfo = getScoreStatus(dim.percentage);
            
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            
            // Truncate long dimension names
            const dimName = dim.dimension.length > 20 ? dim.dimension.substring(0, 17) + '...' : dim.dimension;
            doc.text(dimName, margin + 5, yPos + 7);
            doc.text(`${dim.score || 0}`, margin + 80, yPos + 7, { align: 'center' });
            doc.text(`${dim.percentage || 0}%`, margin + 120, yPos + 7, { align: 'center' });
            
            // Status with color
            const statusRgb = hexToRgb(statusInfo.color);
            doc.setTextColor(statusRgb[0], statusRgb[1], statusRgb[2]);
            doc.setFont(undefined, 'bold');
            doc.text(statusInfo.label, margin + 170, yPos + 7);
            
            yPos += 12;
        });
    }
    
    // ===== PAGE 4: INSIGHTS & RECOMMENDATIONS =====
    doc.addPage();
    yPos = margin;
    
    // Page header
    doc.setFillColor(130, 24, 116);
    doc.rect(0, 0, pageWidth, 60, 'F');
    
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, margin, pageWidth - 2 * margin, 40, 'F');
    
    doc.setTextColor(130, 24, 116);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Insights & Recommendations', pageWidth / 2, 35, { align: 'center' });
    
    yPos = 80;
    
    // Add feedback content from backup
    const feedbackHTML = generateFeedback(results);
    
    // Parse the feedback HTML and extract key sections for PDF
    const sorted = [...results.dimensions].sort((a, b) => b.percentage - a.percentage);
    const best = sorted.slice(0, 2);
    const worst = sorted.slice(-2).reverse();
    
    // Key Strengths
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text('Key Strengths', margin, yPos);
    yPos += 15;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    best.forEach(dim => {
        if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = margin;
        }
        
        const feedback = getDimensionFeedback(dim.dimension, dim.percentage, true);
        const lines = doc.splitTextToSize(`${dim.dimension}: ${feedback}`, pageWidth - 2 * margin - 10);
        lines.forEach(line => {
            doc.text(line, margin + 5, yPos);
            yPos += 6;
        });
        yPos += 5;
    });
    
    yPos += 15;
    
    // Areas for Improvement
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Areas for Improvement', margin, yPos);
    yPos += 15;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    worst.forEach(dim => {
        if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = margin;
        }
        
        const feedback = getDimensionFeedback(dim.dimension, dim.percentage, false);
        const lines = doc.splitTextToSize(`${dim.dimension}: ${feedback}`, pageWidth - 2 * margin - 10);
        lines.forEach(line => {
            doc.text(line, margin + 5, yPos);
            yPos += 6;
        });
        yPos += 5;
    });
    
    // Recommendations
    if (yPos > pageHeight - 80) {
        doc.addPage();
        yPos = margin;
    }
    
    yPos += 15;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Recommended Actions', margin, yPos);
    yPos += 15;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const recommendations = getRecommendationsList(results.overallPercentage);
    recommendations.forEach(rec => {
        if (yPos > pageHeight - 30) {
            doc.addPage();
            yPos = margin;
        }
        
        const lines = doc.splitTextToSize(`• ${rec}`, pageWidth - 2 * margin - 10);
        lines.forEach(line => {
            doc.text(line, margin + 5, yPos);
            yPos += 6;
        });
        yPos += 5;
    });
    
    // ===== PAGE 5: WHAT'S NEXT SECTION =====
    doc.addPage();
    yPos = margin;
    
    // Page header
    doc.setFillColor(130, 24, 116);
    doc.rect(0, 0, pageWidth, 60, 'F');
    
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, margin, pageWidth - 2 * margin, 40, 'F');
    
    doc.setTextColor(130, 24, 116);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('What\'s Next?', pageWidth / 2, 35, { align: 'center' });
    
    yPos = 80;
    
    // What's Next content from backup
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text('1. Review your detailed assessment report', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const reviewText = 'Take time to review your comprehensive assessment results and export the PDF report for your reference.';
    const reviewLines = doc.splitTextToSize(reviewText, pageWidth - 2 * margin - 20);
    reviewLines.forEach(line => {
        doc.text(line, margin + 20, yPos);
        yPos += 6;
    });
    
    yPos += 20;
    
    // Contact Barry Taylor
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('2. Schedule a Consultation', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const consultText = 'Contact Barry Taylor to discuss your results and create a customized improvement plan:';
    const consultLines = doc.splitTextToSize(consultText, pageWidth - 2 * margin - 20);
    consultLines.forEach(line => {
        doc.text(line, margin + 20, yPos);
        yPos += 6;
    });
    
    yPos += 10;
    doc.setTextColor(130, 24, 116);
    doc.setFont(undefined, 'bold');
    doc.text('Contact Barry Taylor', margin + 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text('barry.taylor@midulstermega.com', margin + 20, yPos + 8);
    
    yPos += 20;
    
    // Training Options
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('3. Explore Training Options', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const trainingText = 'We offer flexible training programs tailored to your needs:';
    const trainingLines = doc.splitTextToSize(trainingText, pageWidth - 2 * margin - 20);
    trainingLines.forEach(line => {
        doc.text(line, margin + 20, yPos);
        yPos += 6;
    });
    
    yPos += 10;
    doc.text('• Team Training (5-10 people)', margin + 30, yPos);
    yPos += 6;
    doc.text('• Individual Certification', margin + 30, yPos);
    yPos += 6;
    doc.text('• Customized Workshops', margin + 30, yPos);
    
    yPos += 15;
    
    // Special Offer
    doc.setDrawColor(130, 24, 116);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 20, 'S');
    
    doc.setTextColor(108, 117, 125);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const offerText = 'Special Offer: Contact Barry Taylor for information about special pricing and packages available for MEGA.';
    const offerLines = doc.splitTextToSize(offerText, pageWidth - 2 * margin - 10);
    offerLines.forEach(line => {
        doc.text(line, margin + 5, yPos + 5);
        yPos += 5;
    });
    
    yPos += 30;
    
    // Links
    doc.setTextColor(21, 158, 218);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Learn more:', margin, yPos);
    
    // Add clickable hyperlinks
    doc.setTextColor(0, 0, 255);
    doc.textWithLink('MEGA Website', margin + 40, yPos, { url: 'https://www.midulstermega.com' });
    doc.setTextColor(21, 158, 218);
    doc.text('|', margin + 110, yPos);
    doc.setTextColor(0, 0, 255);
    doc.textWithLink('Kaizen Academy', margin + 120, yPos, { url: 'https://www.kaizenacademy.org' });
    
    // Footer on all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(240, 240, 240);
        doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
        
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth - 10, pageHeight - 8, { align: 'right' });
    }
    
    // Save the PDF
    const fileName = `MEGA_Assessment_${assessmentData.company_name || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [0, 0, 0];
}

function getRecommendationsList(overallPercentage) {
    let recommendations = [];
    
    if (overallPercentage < 32) {
        recommendations = [
            'Start with leadership development and basic LEAN training to establish foundational understanding and commitment',
            'Implement visual management boards to make work and problems visible at the gemba level',
            'Focus on identifying and eliminating obvious waste to build momentum and demonstrate benefits',
            'Establish basic 5S and workplace organization practices to improve workplace efficiency'
        ];
    } else if (overallPercentage < 49) {
        recommendations = [
            'Develop standardized work processes and procedures to ensure consistency and predictability',
            'Train team members in systematic problem-solving and root cause analysis techniques',
            'Establish daily improvement meetings and systematic review processes',
            'Implement basic flow and pull concepts in key processes to reduce bottlenecks'
        ];
    } else if (overallPercentage < 67) {
        recommendations = [
            'Optimize processes for flow and pull systems to reduce bottlenecks and improve delivery',
            'Map and analyze customer value streams to identify non-value-added activities',
            'Implement advanced problem-solving methodologies and statistical process control',
            'Deepen continuous improvement practices and cultural integration'
        ];
    } else {
        recommendations = [
            'Pursue operational excellence through advanced LEAN tools and techniques',
            'Benchmark against industry best practices and world-class organizations',
            'Drive breakthrough innovations through creative problem-solving and experimentation',
            'Develop advanced supplier partnerships and value stream integration'
        ];
    }
    
    return recommendations;
}

// ============================================
// GENERATE SPIDER/RADAR CHART
// ============================================
async function generateSpiderChart(results) {
    return new Promise((resolve) => {
        // Create temporary canvas with larger dimensions
        const canvas = document.createElement('canvas');
        canvas.width = 1000;  // Increased from 600
        canvas.height = 1000; // Increased from 600
        canvas.style.width = '1000px';
        canvas.style.height = '1000px';
        const ctx = canvas.getContext('2d');
        ctx.scale(1000/600, 1000/600);  // Scale to maintain quality
        
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
                            font: { size: 16 }  // Increased from 12
                        },
                        pointLabels: {
                            font: { 
                                size: 16,  // Increased from 11
                                weight: 'bold',
                                family: 'Arial'
                            },
                            padding: 20  // Add more padding for better readability
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

function getScoreStatus(percentage) {
    if (percentage >= 83) {
        return { label: 'Advanced', color: '#059669' };
    } else if (percentage >= 67) {
        return { label: 'Developing', color: '#0891b2' };
    } else if (percentage >= 50) {
        return { label: 'Emerging', color: '#f59e0b' };
    } else {
        return { label: 'Novice', color: '#dc2626' };
    }
}

// ============================================
// PDF EXPORT FROM PREVIEW
// ============================================
async function confirmExportPDF() {
    try {
        if (!window.previewAssessment) {
            throw new Error('No assessment data available for export');
        }
        
        await generateSimplePDF(window.previewAssessment);
        
        // Close preview after successful export
        closePDFPreview();
        
    } catch (error) {
        console.error('Error exporting PDF from preview:', error);
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Failed to export PDF: ' + error.message);
        } else {
            alert('Failed to export PDF: ' + error.message);
        }
    }
}

function closePDFPreview() {
    const modal = document.getElementById('pdfPreviewModal');
    if (modal) {
        modal.style.display = 'none';
    }
    window.previewAssessment = null;
}

// ============================================
// DASHBOARD CONTENT LOADING FUNCTIONS
// ============================================
function loadDashboardDetailedScores() {
    if (!window.currentAssessmentData || !window.currentAssessmentData.results) {
        return;
    }
    
    const container = document.getElementById('dashboardDetailedScoresContainer');
    if (!container) return;
    
    const results = window.currentAssessmentData.results;
    const overallPercentage = results.overallPercentage || 0;
    
    let html = `
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #821874; margin-bottom: 20px;">Detailed Dimension Analysis</h2>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                <h3>Overall LEAN Maturity: ${overallPercentage}%</h3>
                <div style="font-size: 24px; font-weight: bold; color: #821874;">${getScoreStatus(overallPercentage).label}</div>
            </div>
            
            <div class="detailed-scores">
    `;
    
    if (results.dimensions) {
        results.dimensions.forEach((dimension, index) => {
            const percentage = dimension.percentage || 0;
            const status = getScoreStatus(percentage);
            
            html += `
                <div style="margin-bottom: 20px; padding: 20px; border-left: 4px solid ${status.color}; background: #f8f9fa; border-radius: 8px;">
                    <h4 style="margin: 0 0 15px 0; color: #333;">${dimension.dimension}</h4>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span style="font-size: 18px; font-weight: bold;">${dimension.score || 0}/5.0</span>
                        <span style="font-size: 16px; font-weight: bold; color: ${status.color};">${percentage.toFixed(1)}%</span>
                    </div>
                    <div style="background: #e9ecef; height: 8px; border-radius: 4px; margin-bottom: 10px;">
                        <div style="background: ${status.color}; height: 100%; width: ${percentage}%; border-radius: 4px;"></div>
                    </div>
                    <div style="font-weight: bold; color: ${status.color};">${status.label}</div>
                </div>
            `;
        });
    }
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function loadDashboardInsights() {
    if (!window.currentAssessmentData || !window.currentAssessmentData.results) {
        return;
    }
    
    const container = document.getElementById('dashboardInsightsSection');
    if (!container) return;
    
    const results = window.currentAssessmentData.results;
    
    container.innerHTML = generateDetailedInsights(results);
}