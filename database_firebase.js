// ============================================
// FIREBASE DATABASE OPERATIONS
// ============================================

// ============================================
// ASSESSMENT OPERATIONS
// ============================================

async function saveAssessment(assessmentData) {
    try {
        const assessmentWithMetadata = {
            ...assessmentData,
            user_id: currentUser.uid,
            user_email: currentUser.email,
            created_at: firebase.firestore.FieldValue.serverTimestamp(),
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await db.collection('assessments').add(assessmentWithMetadata);
        
        console.log('Assessment saved with ID:', docRef.id);
        return { data: { id: docRef.id, ...assessmentWithMetadata }, error: null };
        
    } catch (error) {
        console.error('Error saving assessment:', error);
        return { data: null, error };
    }
}

async function updateAssessment(assessmentId, assessmentData) {
    try {
        const updateData = {
            ...assessmentData,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('assessments').doc(assessmentId).update(updateData);
        
        // Get updated document
        const updatedDoc = await db.collection('assessments').doc(assessmentId).get();
        const updatedData = { id: updatedDoc.id, ...updatedDoc.data() };
        
        console.log('Assessment updated:', assessmentId);
        return { data: updatedData, error: null };
        
    } catch (error) {
        console.error('Error updating assessment:', error);
        return { data: null, error };
    }
}

async function deleteAssessment(assessmentId) {
    try {
        await db.collection('assessments').doc(assessmentId).delete();
        
        console.log('Assessment deleted:', assessmentId);
        return { error: null };
        
    } catch (error) {
        console.error('Error deleting assessment:', error);
        return { error };
    }
}

async function getUserAssessments() {
    try {
        const snapshot = await db.collection('assessments')
            .where('user_id', '==', currentUser.uid)
            .get();
        
        const assessments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).sort((a, b) => {
            const aDate = convertTimestamp(a.created_at);
            const bDate = convertTimestamp(b.created_at);
            const aTime = aDate ? aDate.getTime() : 0;
            const bTime = bDate ? bDate.getTime() : 0;
            return bTime - aTime;
        });
        
        console.log('User assessments loaded:', assessments.length);
        return { data: assessments, error: null };
        
    } catch (error) {
        console.error('Error fetching user assessments:', error);
        return { data: [], error };
    }
}

async function getAllAssessments() {
    try {
        const snapshot = await db.collection('assessments')
            .orderBy('created_at', 'desc')
            .get();
        
        const assessments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log('All assessments loaded:', assessments.length);
        return { data: assessments, error: null };
        
    } catch (error) {
        console.error('Error fetching all assessments:', error);
        return { data: [], error };
    }
}

async function getAssessmentById(assessmentId) {
    try {
        const doc = await db.collection('assessments').doc(assessmentId).get();
        
        if (doc.exists) {
            return { data: { id: doc.id, ...doc.data() }, error: null };
        } else {
            return { data: null, error: 'Assessment not found' };
        }
        
    } catch (error) {
        console.error('Error fetching assessment:', error);
        return { data: null, error };
    }
}

// ============================================
// ADMIN OPERATIONS
// ============================================

async function getAllUsers() {
    try {
        const snapshot = await db.collection('profiles')
            .where('is_active', '==', true)
            .get();
        
        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).sort((a, b) => {
            const aDate = convertTimestamp(a.created_at);
            const bDate = convertTimestamp(b.created_at);
            const aTime = aDate ? aDate.getTime() : 0;
            const bTime = bDate ? bDate.getTime() : 0;
            return bTime - aTime;
        });
        
        console.log('All users loaded:', users.length);
        return { data: users, error: null };
        
    } catch (error) {
        console.error('Error fetching users:', error);
        return { data: [], error };
    }
}

async function updateUserRole(userId, newRole) {
    try {
        await db.collection('profiles').doc(userId).update({
            role: newRole,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('User role updated:', userId, newRole);
        return { error: null };
        
    } catch (error) {
        console.error('Error updating user role:', error);
        return { error };
    }
}

// ============================================
// ANALYTICS OPERATIONS
// ============================================

async function getAssessmentStats() {
    try {
        const snapshot = await db.collection('assessments').get();
        const assessments = snapshot.docs.map(doc => doc.data());
        
        const stats = {
            totalAssessments: assessments.length,
            averageScore: 0,
            dimensionAverages: {},
            recentAssessments: 0
        };
        
        if (assessments.length > 0) {
            // Calculate average score
            const totalScore = assessments.reduce((sum, assessment) => {
                return sum + (assessment.overall_score || 0);
            }, 0);
            stats.averageScore = (totalScore / assessments.length).toFixed(1);
            
            // Calculate dimension averages
            DIMENSIONS.forEach((dimension, index) => {
                const dimensionScores = assessments.map(assessment => {
                    return assessment.dimension_scores?.[index] || 0;
                });
                const dimensionAvg = dimensionScores.reduce((sum, score) => sum + score, 0) / dimensionScores.length;
                stats.dimensionAverages[dimension.name] = dimensionAvg.toFixed(1);
            });
            
            // Recent assessments (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            stats.recentAssessments = assessments.filter(assessment => {
                const assessmentDate = assessment.created_at?.toDate();
                return assessmentDate && assessmentDate >= thirtyDaysAgo;
            }).length;
        }
        
        return { data: stats, error: null };
        
    } catch (error) {
        console.error('Error fetching assessment stats:', error);
        return { data: null, error };
    }
}

// ============================================
// REAL-TIME LISTENERS
// ============================================

function listenToUserAssessments(callback) {
    if (!currentUser) return null;
    
    return db.collection('assessments')
        .where('user_id', '==', currentUser.uid)
        .orderBy('created_at', 'desc')
        .onSnapshot((snapshot) => {
            const assessments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(assessments);
        }, (error) => {
            console.error('Real-time listener error:', error);
        });
}

function listenToAllAssessments(callback) {
    return db.collection('assessments')
        .orderBy('created_at', 'desc')
        .onSnapshot((snapshot) => {
            const assessments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(assessments);
        }, (error) => {
            console.error('Real-time listener error:', error);
        });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Load user assessments for display
async function loadUserAssessments() {
    try {
        const { data: assessments, error } = await getUserAssessments();
        
        if (error) {
            console.error('Error loading assessments:', error);
            return;
        }
        
        displayUserAssessments(assessments);
        
    } catch (error) {
        console.error('Load assessments error:', error);
    }
}

function displayUserAssessments(assessments) {
    const container = document.getElementById('savedAssessments');
    if (!container) return;
    
    if (assessments.length === 0) {
        container.innerHTML = '<p>No assessments found. Create your first assessment!</p>';
        return;
    }
    
    let html = '';
    assessments.forEach(assessment => {
        html += `
            <div class="assessment-item">
                <div>
                    <strong>${assessment.company_name}</strong><br>
                    <small>${assessment.assessor_name} - ${formatTimestamp(assessment.created_at)}</small>
                </div>
                <div class="assessment-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewAssessment('${assessment.id}')">View</button>
                    <button class="btn btn-sm btn-secondary" onclick="editAssessment('${assessment.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAssessment('${assessment.id}')">Delete</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function convertTimestamp(timestamp) {
    if (!timestamp) return null;
    return timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
}

function formatTimestamp(timestamp) {
    const date = convertTimestamp(timestamp);
    if (!date) return '';
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}
