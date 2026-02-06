// ============================================
// FIREBASE AUTHENTICATION MODULE
// ============================================

// Global variables accessible to all files
window.currentUser = null;
window.currentUserProfile = null;
window.currentAssessmentData = null;
window.currentIndividualAssessment = null;
window.currentAssessmentId = null;

// ============================================
// INITIALIZATION
// ============================================
async function initializeAuth() {
    try {
        // Listen for auth state changes
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                await handleAuthenticatedUser(user);
            } else {
                showAuthSection();
            }
        });

    } catch (error) {
        console.error('Auth initialization error:', error);
        showAuthSection();
    }
}

async function handleAuthenticatedUser(user) {
    window.currentUser = user;
    
    try {
        // Get user profile from Firestore
        const userDoc = await db.collection('profiles').doc(user.uid).get();
        
        if (userDoc.exists) {
            window.currentUserProfile = userDoc.data();
        } else {
            // Create basic profile if it doesn't exist
            const profileData = {
                email: user.email,
                display_name: user.displayName || user.email.split('@')[0],
                role: 'user',
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await db.collection('profiles').doc(user.uid).set(profileData);
            window.currentUserProfile = profileData;
        }
        
        showAuthenticatedUI();
        
    } catch (error) {
        console.error('Error handling authenticated user:', error);
        
        // Check if it's a permission error
        if (error.message && error.message.includes('Missing or insufficient permissions')) {
            console.warn('Firebase security rules need to be deployed. Using fallback mode.');
            // Create a basic profile in memory for testing
            window.currentUserProfile = {
                email: user.email,
                display_name: user.displayName || user.email.split('@')[0],
                role: 'user'
            };
        }
        
        // Still show UI even if profile fetch fails
        showAuthenticatedUI();
    }
}

async function createUserProfile(user) {
    try {
        const displayName = user.displayName || user.email.split('@')[0];
        
        const profileData = {
            uid: user.uid,
            email: user.email,
            role: 'user',
            display_name: displayName,
            is_active: true,
            created_at: firebase.firestore.FieldValue.serverTimestamp(),
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('profiles').doc(user.uid).set(profileData);
        
        window.currentUserProfile = { ...profileData, id: user.uid };
        console.log('Profile created:', window.currentUserProfile);
        
    } catch (error) {
        console.error('Error creating profile:', error);
    }
}

async function updateUserProfile(userId, updates) {
    try {
        const updateData = {
            ...updates,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('profiles').doc(userId).update(updateData);
        
        if (userId === window.currentUser?.uid) {
            window.currentUserProfile = { ...window.currentUserProfile, ...updates };
            console.log('Profile updated:', window.currentUserProfile);
        }
        
        return { data: window.currentUserProfile, error: null };
    } catch (error) {
        console.error('Error updating profile:', error);
        return { data: null, error };
    }
}

function showAuthenticatedUI() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('mainNavigation').style.display = 'flex';
    
    // Show dashboard actions
    const dashboardActions = document.getElementById('dashboardActions');
    if (dashboardActions) {
        dashboardActions.style.display = 'block';
    }
    
    // Show and populate user menu
    const userMenu = document.getElementById('userMenu');
    if (userMenu && window.currentUser) {
        userMenu.style.display = 'block';
        
        // Update user name
        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            userNameEl.textContent = window.currentUserProfile?.name || window.currentUser.email.split('@')[0];
        }
        
        // Update user email
        const userEmailEl = document.getElementById('userEmail');
        if (userEmailEl) {
            userEmailEl.textContent = window.currentUser.email;
        }
        
        // Update user role
        const userRoleEl = document.getElementById('userRole');
        if (userRoleEl) {
            userRoleEl.textContent = isAdmin() ? 'Admin' : 'Regular User';
        }
        
        // Update user initial
        const userInitialEl = document.getElementById('userInitial');
        if (userInitialEl) {
            const name = window.currentUserProfile?.name || window.currentUser.email;
            userInitialEl.textContent = name.charAt(0).toUpperCase();
        }
    }
    
    if (isAdmin()) {
        document.getElementById('adminNav').style.display = 'block';
        loadAdminDashboard();
    } else {
        document.getElementById('adminNav').style.display = 'none';
    }
    
    if (typeof loadUserAssessments === 'function') {
        loadUserAssessments();
    }
    showPanel('assessment');
    
    // Set assessment date (only if element exists to avoid error)
    const assessmentDateElement = document.getElementById('assessmentDate');
    if (assessmentDateElement) {
        assessmentDateElement.value = new Date().toISOString().split('T')[0];
    }
}

function showAuthSection() {
    // Hide all panels first
    const allPanels = document.querySelectorAll('.panel');
    allPanels.forEach((panel) => {
        panel.style.display = 'none';
        panel.classList.remove('active');
    });
    
    // Specifically hide assessment panel
    const assessmentPanel = document.getElementById('assessmentPanel');
    if (assessmentPanel) {
        assessmentPanel.style.display = 'none';
    }
    
    // Hide all other authenticated panels specifically
    const panelsToHide = ['dashboardPanel', 'savedPanel', 'assessmentResultsPanel', 'adminPanel'];
    panelsToHide.forEach(panelId => {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.style.display = 'none';
        }
    });
    
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('mainNavigation').style.display = 'none';
    
    // Hide dashboard actions
    const dashboardActions = document.getElementById('dashboardActions');
    if (dashboardActions) {
        dashboardActions.style.display = 'none';
    }
    
    // Hide user menu
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        userMenu.style.display = 'none';
    }
    
    // IMPORTANT: Restore form elements visibility
    const emailField = document.getElementById('signinEmail');
    const passwordField = document.getElementById('signinPassword');
    const emailLabel = document.querySelector('label[for="signinEmail"]');
    const passwordLabel = document.querySelector('label[for="signinPassword"]');
    
    if (emailField) emailField.style.display = '';
    if (passwordField) passwordField.style.display = '';
    if (emailLabel) emailLabel.style.display = '';
    if (passwordLabel) passwordLabel.style.display = '';
    
    // Remove any loading animation that might be stuck
    const loadingElement = document.getElementById('signinLoading');
    if (loadingElement) {
        loadingElement.remove();
    }
    
    window.currentUser = null;
    window.currentUserProfile = null;
    
    // Reset sign-in button state
    const signinBtn = document.querySelector('button[onclick="handleSignIn()"]');
    if (signinBtn) {
        signinBtn.disabled = false;
        signinBtn.innerHTML = 'Sign In';
    }
    
    // Reset social sign-in buttons
    document.querySelectorAll('.btn-social').forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
    });
    
    // Clear form fields
    const signinEmail = document.getElementById('signinEmail');
    const signinPassword = document.getElementById('signinPassword');
    if (signinEmail) signinEmail.value = '';
    if (signinPassword) signinPassword.value = '';
}

function isAdmin() {
    return window.currentUserProfile && window.currentUserProfile.role === 'admin';
}

// ============================================
// SIGN UP
// ============================================
async function handleSignUp() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
    
    hideError('signupError');
    hideError('signupSuccess');
    
    if (!name || !email || !password || !passwordConfirm) {
        showError('signupError', 'Please fill in all fields');
        return;
    }
    
    if (password !== passwordConfirm) {
        showError('signupError', 'Passwords do not match');
        return;
    }
    
    if (password.length < 8) {
        showError('signupError', 'Password must be at least 8 characters long');
        return;
    }
    
    if (!isValidEmail(email)) {
        showError('signupError', 'Please enter a valid email address');
        return;
    }
    
    const signupBtn = event.target;
    signupBtn.disabled = true;
    signupBtn.innerHTML = '<span class="loading-spinner"></span> Creating account...';
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Update display name
        await userCredential.user.updateProfile({
            displayName: name
        });
        
        showSuccess('signupSuccess', '✓ Account created successfully! You can now sign in.');
        
        document.getElementById('signupName').value = '';
        document.getElementById('signupEmail').value = '';
        document.getElementById('signupPassword').value = '';
        document.getElementById('signupPasswordConfirm').value = '';
        
        setTimeout(() => showAuthTab('signin'), 2000);
        
    } catch (error) {
        console.error('Signup error:', error);
        
        let errorMessage = 'Failed to create account. Please try again.';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email is already registered. Please sign in instead.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak. Please choose a stronger password.';
        }
        
        showError('signupError', errorMessage);
    } finally {
        signupBtn.disabled = false;
        signupBtn.innerHTML = 'Create Account';
    }
}

// ============================================
// ============================================
async function handleSignIn() {
    const email = document.getElementById('signinEmail').value.trim();
    const password = document.getElementById('signinPassword').value;
    const signinBtn = document.querySelector('button[onclick="handleSignIn()"]');
    
    if (!email || !password) {
        showError('signinError', 'Please enter both email and password.');
        return;
    }
    
    // Show loading state
    signinBtn.disabled = true;
    signinBtn.innerHTML = '<span class="loading-spinner"></span> Signing in...';
    
    // Hide form fields during sign-in process
    const emailField = document.getElementById('signinEmail');
    const passwordField = document.getElementById('signinPassword');
    const emailLabel = emailField.previousElementSibling;
    const passwordLabel = passwordField.previousElementSibling;
    
    // Store original values
    const originalEmail = emailField.value;
    const originalPassword = passwordField.value;
    
    // Hide form elements
    emailField.style.display = 'none';
    passwordField.style.display = 'none';
    emailLabel.style.display = 'none';
    passwordLabel.style.display = 'none';
    
    // Show loading animation
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'signinLoading';
    loadingDiv.style.cssText = `
        text-align: center;
        padding: 40px 20px;
        color: #821874;
        font-size: 16px;
        font-weight: 600;
    `;
    loadingDiv.innerHTML = `
        <div style="margin-bottom: 15px;">
            <div class="loading-spinner" style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #821874; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
        </div>
        <div>Signing in...</div>
    `;
    
    // Insert loading animation after the password field
    passwordField.parentNode.insertBefore(loadingDiv, passwordField.nextSibling);
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        
        // Show success animation
        loadingDiv.innerHTML = `
            <div style="margin-bottom: 15px;">
                <div style="width: 40px; height: 40px; margin: 0 auto; background: #28a745; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                </div>
            </div>
            <div style="color: #28a745;">Signed in successfully!</div>
        `;
        
        console.log('Sign in successful');
        
        // Wait a moment for user to see success message
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Clear form fields AFTER success animation (but keep form hidden)
        document.getElementById('signinEmail').value = '';
        document.getElementById('signinPassword').value = '';
        
        // Remove loading animation
        const loadingElement = document.getElementById('signinLoading');
        if (loadingElement) {
            loadingElement.remove();
        }
        
        // Keep form elements hidden - they'll be shown by auth state change if needed
        // Don't restore form elements here to prevent the brief flash
        
        // The auth state change will handle showing the main app
        
    } catch (error) {
        // Remove loading animation
        const loadingElement = document.getElementById('signinLoading');
        if (loadingElement) {
            loadingElement.remove();
        }
        
        // Restore form elements
        emailField.style.display = '';
        passwordField.style.display = '';
        emailLabel.style.display = '';
        passwordLabel.style.display = '';
        emailField.value = originalEmail;
        passwordField.value = originalPassword;
        
        // Clear any existing error first
        hideError('signinError');
        
        let errorMessage = 'Failed to sign in. Please check your credentials.';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-login-credentials') {
            errorMessage = '❌ Incorrect email or password. Please try again.';
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = '🚫 This account has been disabled. Please contact support.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = '⏰ Too many failed attempts. Please try again later.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = '📧 Invalid email address format.';
        } else if (error.code === 'auth/invalid-credential') {
            errorMessage = '❌ Invalid credentials. Please check your email and password.';
        }
        
        // Direct approach - bypass showError function
        const errorElement = document.getElementById('signinError');
        if (errorElement) {
            errorElement.innerHTML = errorMessage;
            errorElement.style.setProperty('display', 'block', 'important');
            errorElement.style.setProperty('visibility', 'visible', 'important');
            errorElement.style.setProperty('opacity', '1', 'important');
            errorElement.style.setProperty('color', '#dc3545', 'important');
        }
        
        // Reset button state
        signinBtn.disabled = false;
        signinBtn.innerHTML = 'Sign In';
    } finally {
        // Only reset button if there was an error
        if (signinBtn.innerHTML.includes('Signing in')) {
            signinBtn.disabled = false;
            signinBtn.innerHTML = 'Sign In';
        }
    }
}

// ============================================
// PASSWORD RESET
// ============================================
async function handlePasswordReset() {
    const email = document.getElementById('resetEmail').value.trim();
    
    hideError('resetError');
    hideSuccess('resetSuccess');
    
    if (!email) {
        showError('resetError', 'Please enter your email address');
        return;
    }
    
    if (!isValidEmail(email)) {
        showError('resetError', 'Please enter a valid email address');
        return;
    }
    
    const resetBtn = event.target;
    resetBtn.disabled = true;
    resetBtn.innerHTML = '<span class="loading-spinner"></span> Sending...';
    
    try {
        console.log('Sending password reset to:', email);
        await auth.sendPasswordResetEmail(email);
        console.log('Password reset email sent successfully');
        
        showSuccess('resetSuccess', 
            '✓ Password reset link sent! Please check your email inbox and spam folder.'
        );
        
        document.getElementById('resetEmail').value = '';
        
        // Auto-switch back to sign-in after 3 seconds
        setTimeout(() => {
            showAuthTab('signin');
        }, 3000);
        
    } catch (error) {
        console.error('Password reset error:', error);
        
        let errorMessage = 'Failed to send reset link. Please try again.';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email address.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many requests. Please try again later.';
        }
        
        showError('resetError', errorMessage);
    } finally {
        resetBtn.disabled = false;
        resetBtn.innerHTML = 'Send Reset Link';
    }
}

// ============================================
// SOCIAL SIGN-IN
// ============================================
async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    await handleSocialSignIn(provider, 'Google');
}

async function signInWithMicrosoft() {
    const provider = new firebase.auth.OAuthProvider('microsoft.com');
    provider.setCustomParameters({
        prompt: 'consent',
        tenant: 'common'
    });
    await handleSocialSignIn(provider, 'Microsoft');
}

async function signInWithApple() {
    const provider = new firebase.auth.OAuthProvider('apple.com');
    await handleSocialSignIn(provider, 'Apple');
}

async function handleSocialSignIn(provider, providerName) {
    try {
        showLoadingSpinner();
        
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        console.log(`${providerName} sign-in successful for:`, user.email);
        
        // Create or update user profile in Firestore
        await createOrUpdateUserProfile(user);
        
        // Show success and proceed
        showAuthenticatedUI();
        
    } catch (error) {
        console.error(`${providerName} sign-in error:`, error);
        
        let errorMessage = `Failed to sign in with ${providerName}`;
        
        if (error.code === 'auth/popup-closed-by-user') {
            return; // User closed the popup, don't show error
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = 'Popup was blocked. Please allow popups and try again.';
        } else if (error.code === 'auth/cancelled-popup-request') {
            return; // User cancelled, don't show error
        }
        
        showError('signinError', errorMessage);
    } finally {
        hideLoadingSpinner();
    }
}

async function createOrUpdateUserProfile(user) {
    const userRef = db.collection('profiles').doc(user.uid);
    const userDoc = await userRef.get();
    
    const profileData = {
        email: user.email,
        display_name: user.displayName || user.email.split('@')[0],
        auth_provider: user.providerData[0]?.providerId || 'email',
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (!userDoc.exists) {
        // New user - create profile
        profileData.created_at = firebase.firestore.FieldValue.serverTimestamp();
        profileData.role = 'user'; // Default role
        profileData.is_active = true;
        
        await userRef.set(profileData);
        console.log('Created new user profile for:', user.email);
    } else {
        // Existing user - update profile
        await userRef.update(profileData);
        console.log('Updated user profile for:', user.email);
    }
    
    // Set global variables
    currentUser = user;
    currentUserProfile = profileData;
}
async function userLogout() {
    showLogoutModal();
}

function forceCleanLogout() {
    // Use the same comprehensive cleanup as handleSignOut
    handleSignOut();
}

// ============================================
// LOGOUT MODAL
// ============================================
function showLogoutModal() {
    // Create modal if it doesn't exist
    let modal = document.getElementById('logoutModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'logoutModal';
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
                <div style="background: linear-gradient(135deg, #821874 0%, #159eda 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h2 style="margin: 0;">👋 Sign Out</h2>
                </div>
                <div style="padding: 30px; text-align: center;">
                    <p style="margin-bottom: 20px; color: #2d2d2d;">Are you sure you want to sign out of your account?</p>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button onclick="closeLogoutModal()" class="btn btn-secondary" style="min-width: 100px;">Cancel</button>
                        <button onclick="confirmLogout()" class="btn btn-danger" style="min-width: 100px;">Sign Out</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    modal.style.display = 'block';
}

function closeLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function confirmLogout() {
    closeLogoutModal();
    
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Firebase sign out error:', error);
        // Force logout even if API fails
        forceCleanLogout();
    }
}

function handleSignOut() {
    window.currentUser = null;
    window.currentUserProfile = null;
    window.currentAssessmentData = null;
    window.currentIndividualAssessment = null;
    window.currentAssessmentId = null;
    
    // Hide navigation completely
    const navigation = document.getElementById('mainNavigation');
    if (navigation) {
        navigation.style.display = 'none';
    }
    
    // Hide dashboard actions
    const dashboardActions = document.getElementById('dashboardActions');
    if (dashboardActions) {
        dashboardActions.style.display = 'none';
    }
    
    // Hide ALL panels immediately
    document.querySelectorAll('.panel').forEach(panel => {
        panel.style.display = 'none';
        panel.classList.remove('active');
    });
    
    // Show auth section immediately
    const authSection = document.getElementById('authSection');
    if (authSection) {
        authSection.style.display = 'block';
        authSection.classList.add('active');
    }
    
    // Clear ALL assessment-related content
    clearAllAssessmentContent();
    
    // Clear saved assessments list
    const savedAssessments = document.getElementById('savedAssessments');
    if (savedAssessments) {
        savedAssessments.innerHTML = '';
    }
    
    // Clear dashboard content
    const overviewTab = document.getElementById('overviewTab');
    if (overviewTab) {
        overviewTab.innerHTML = '';
    }
    
    const detailedTab = document.getElementById('detailedTab');
    if (detailedTab) {
        detailedTab.innerHTML = '';
    }
    
    const feedbackTab = document.getElementById('feedbackTab');
    if (feedbackTab) {
        feedbackTab.innerHTML = '';
    }
    
    // Clear assessment form
    const assessmentForm = document.getElementById('assessmentForm');
    if (assessmentForm) {
        assessmentForm.reset();
    }
    
    // Clear results containers
    const resultsContainer = document.getElementById('resultsContainer');
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
        resultsContainer.style.display = 'none';
    }
    
    // Clear dashboard panels
    const enhancedResultsGrid = document.getElementById('enhancedResultsGrid');
    if (enhancedResultsGrid) {
        enhancedResultsGrid.innerHTML = '';
    }
    
    const detailedScoresContainer = document.getElementById('detailedScoresContainer');
    if (detailedScoresContainer) {
        detailedScoresContainer.innerHTML = '';
    }
    
    const feedbackSection = document.getElementById('feedbackSection');
    if (feedbackSection) {
        feedbackSection.innerHTML = '';
    }
    
    // Hide PDF export buttons
    const previewDashboardPDF = document.getElementById('previewDashboardPDF');
    const exportDashboardPDF = document.getElementById('exportDashboardPDF');
    const previewIndividualPDF = document.getElementById('previewIndividualPDF');
    const exportIndividualPDF = document.getElementById('exportIndividualPDF');
    
    if (previewDashboardPDF) previewDashboardPDF.style.display = 'none';
    if (exportDashboardPDF) exportDashboardPDF.style.display = 'none';
    if (previewIndividualPDF) previewIndividualPDF.style.display = 'none';
    if (exportIndividualPDF) exportIndividualPDF.style.display = 'none';
    
    // Clear admin filters
    const filterUser = document.getElementById('filterUser');
    const filterCompany = document.getElementById('filterCompany');
    const filterStatus = document.getElementById('filterStatus');
    
    if (filterUser) filterUser.value = '';
    if (filterCompany) filterCompany.value = '';
    if (filterStatus) filterStatus.value = 'all';
    
    // Reset auth form to sign in
    showAuthTab('signin');
    
    // Clear form fields and reset button states
    const signinEmail = document.getElementById('signinEmail');
    const signinPassword = document.getElementById('signinPassword');
    if (signinEmail) signinEmail.value = '';
    if (signinPassword) signinPassword.value = '';
    
    // Reset sign-in button state
    const signinBtn = document.querySelector('button[onclick="handleSignIn()"]');
    if (signinBtn) {
        signinBtn.disabled = false;
        signinBtn.innerHTML = 'Sign In';
    }
    
    // Reset social sign-in buttons
    document.querySelectorAll('.btn-social').forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
    });
    
    // Clear any notifications
    clearAllNotifications();
    
    // Clear browser history to prevent back button access
    if (window.history && window.history.pushState) {
        window.history.pushState('auth', null, './');
        window.onpopstate = function(event) {
            if (event.state === 'auth') {
                // User tried to go back - keep them on auth page
                window.history.pushState('auth', null, './');
            }
        };
    }
    
    // Force page reload to ensure complete cleanup
    setTimeout(() => {
        // Clear any remaining content before reload
        document.body.innerHTML = '';
        // Reload with cache busting
        window.location.href = window.location.href + '?t=' + Date.now();
    }, 50);
}

function clearAllAssessmentContent() {
    // Hide all panels first
    document.querySelectorAll('.panel').forEach(panel => {
        panel.style.display = 'none';
        panel.classList.remove('active');
    });
    
    // Clear saved assessments list
    const savedAssessments = document.getElementById('savedAssessments');
    if (savedAssessments) {
        savedAssessments.innerHTML = '';
    }
    
    // Clear dashboard content
    const overviewTab = document.getElementById('overviewTab');
    if (overviewTab) {
        overviewTab.innerHTML = '';
    }
    
    const detailedTab = document.getElementById('detailedTab');
    if (detailedTab) {
        detailedTab.innerHTML = '';
    }
    
    const feedbackTab = document.getElementById('feedbackTab');
    if (feedbackTab) {
        feedbackTab.innerHTML = '';
    }
    
    // Clear assessment form
    const assessmentForm = document.getElementById('assessmentForm');
    if (assessmentForm) {
        assessmentForm.reset();
    }
    
    // Clear results containers
    const resultsContainer = document.getElementById('resultsContainer');
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
        resultsContainer.style.display = 'none';
    }
    
    // Clear dashboard panels
    const enhancedResultsGrid = document.getElementById('enhancedResultsGrid');
    if (enhancedResultsGrid) {
        enhancedResultsGrid.innerHTML = '';
    }
    
    const detailedScoresContainer = document.getElementById('detailedScoresContainer');
    if (detailedScoresContainer) {
        detailedScoresContainer.innerHTML = '';
    }
    
    const feedbackSection = document.getElementById('feedbackSection');
    if (feedbackSection) {
        feedbackSection.innerHTML = '';
    }
    
    // Hide PDF export buttons
    const previewDashboardPDF = document.getElementById('previewDashboardPDF');
    const exportDashboardPDF = document.getElementById('exportDashboardPDF');
    if (previewDashboardPDF) previewDashboardPDF.style.display = 'none';
    if (exportDashboardPDF) exportDashboardPDF.style.display = 'none';
    
    // Clear any assessment results panels
    const assessmentResultsPanel = document.getElementById('assessmentResultsPanel');
    if (assessmentResultsPanel) {
        assessmentResultsPanel.innerHTML = '';
        assessmentResultsPanel.style.display = 'none';
    }
    
    // Clear individual assessment results
    const individualOverviewTab = document.getElementById('individualOverviewTab');
    const individualDetailedTab = document.getElementById('individualDetailedTab');
    const individualFeedbackTab = document.getElementById('individualFeedbackTab');
    
    if (individualOverviewTab) individualOverviewTab.innerHTML = '';
    if (individualDetailedTab) individualDetailedTab.innerHTML = '';
    if (individualFeedbackTab) individualFeedbackTab.innerHTML = '';
    
    // Reset assessment date to today
    const assessmentDate = document.getElementById('assessmentDate');
    if (assessmentDate) {
        assessmentDate.value = new Date().toISOString().split('T')[0];
    }
}

function clearAllNotifications() {
    // Clear success notifications
    const successNotification = document.getElementById('successNotification');
    if (successNotification) {
        successNotification.style.display = 'none';
    }
    
    // Clear error notifications
    const errorNotification = document.getElementById('errorNotification');
    if (errorNotification) {
        errorNotification.style.display = 'none';
    }
    
    // Clear any auth error messages
    const signinError = document.getElementById('signinError');
    const signupError = document.getElementById('signupError');
    const resetError = document.getElementById('resetError');
    const resetSuccess = document.getElementById('resetSuccess');
    
    if (signinError) signinError.style.display = 'none';
    if (signupError) signupError.style.display = 'none';
    if (resetError) resetError.style.display = 'none';
    if (resetSuccess) resetSuccess.style.display = 'none';
}

// ============================================
// UI HELPERS
// ============================================
function showLoadingSpinner() {
    // Add loading spinner to buttons
    const buttons = document.querySelectorAll('.btn-social');
    buttons.forEach(btn => {
        if (!btn.querySelector('.loading-spinner')) {
            btn.disabled = true;
            btn.style.opacity = '0.7';
        }
    });
}

function hideLoadingSpinner() {
    // Remove loading spinner from buttons
    const buttons = document.querySelectorAll('.btn-social');
    buttons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
    });
}

function showAuthTab(tab) {
    document.getElementById('signinForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'none';
    
    document.getElementById('signinTab').classList.remove('active');
    document.getElementById('signupTab').classList.remove('active');
    
    if (tab === 'signin') {
        document.getElementById('signinForm').style.display = 'block';
        document.getElementById('signinTab').classList.add('active');
    } else if (tab === 'signup') {
        document.getElementById('signupForm').style.display = 'block';
        document.getElementById('signupTab').classList.add('active');
    } else if (tab === 'forgot') {
        document.getElementById('forgotPasswordForm').style.display = 'block';
    }
}

function showForgotPassword() {
    showAuthTab('forgot');
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = message;
        element.style.setProperty('display', 'block', 'important');
        element.style.setProperty('visibility', 'visible', 'important');
        element.style.setProperty('opacity', '1', 'important');
        element.style.setProperty('color', '#dc3545', 'important');
        element.style.setProperty('font-size', '14px', 'important');
    }
}

function hideError(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.style.display = 'none';
}

function hideSuccess(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.style.display = 'none';
}

function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ============================================
// USER MENU FUNCTIONS
// ============================================
function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    const arrow = document.querySelector('.dropdown-arrow');
    
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        arrow.style.transform = 'rotate(0deg)';
    } else {
        dropdown.classList.add('show');
        arrow.style.transform = 'rotate(180deg)';
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    
    if (userMenu && !userMenu.contains(event.target)) {
        dropdown.classList.remove('show');
        const arrow = document.querySelector('.dropdown-arrow');
        if (arrow) arrow.style.transform = 'rotate(0deg)';
    }
});

function showEditProfileModal() {
    if (!window.currentUser || !window.currentUserProfile) {
        showErrorMessage('User information not available');
        return;
    }
    
    // Populate modal with current user data
    document.getElementById('editProfileUserId').value = window.currentUser.uid;
    document.getElementById('editProfileName').value = window.currentUserProfile.name || '';
    document.getElementById('editProfileEmail').value = window.currentUser.email;
    
    // Clear messages
    hideError('editProfileError');
    hideSuccess('editProfileSuccess');
    
    // Show modal
    document.getElementById('editProfileModal').style.display = 'block';
    
    // Close dropdown
    document.getElementById('userDropdown').classList.remove('show');
}

function closeEditProfileModal() {
    document.getElementById('editProfileModal').style.display = 'none';
    document.getElementById('editProfileName').value = '';
    document.getElementById('editProfileEmail').value = '';
}

async function saveProfileChanges() {
    try {
        const userId = document.getElementById('editProfileUserId').value;
        const newName = document.getElementById('editProfileName').value.trim();
        
        if (!newName) {
            showError('editProfileError', 'Please enter your name');
            return;
        }
        
        hideError('editProfileError');
        
        // Update profile in Firestore
        await db.collection('profiles').doc(userId).update({
            name: newName,
            updated_at: new Date()
        });
        
        // Update local profile
        window.currentUserProfile.name = newName;
        
        // Update UI
        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            userNameEl.textContent = newName;
        }
        
        // Update user initial
        const userInitialEl = document.getElementById('userInitial');
        if (userInitialEl) {
            userInitialEl.textContent = newName.charAt(0).toUpperCase();
        }
        
        showSuccess('editProfileSuccess', 'Profile updated successfully!');
        
        // Close modal after delay
        setTimeout(() => {
            closeEditProfileModal();
        }, 2000);
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showError('editProfileError', 'Failed to update profile. Please try again.');
    }
}

function showChangePasswordModal() {
    // Clear form
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmNewPassword').value = '';
    
    // Clear messages
    hideError('changePasswordError');
    hideSuccess('changePasswordSuccess');
    
    // Show modal
    document.getElementById('changePasswordModal').style.display = 'block';
    
    // Close dropdown
    document.getElementById('userDropdown').classList.remove('show');
}

function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'none';
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmNewPassword').value = '';
}

async function changePassword() {
    try {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;
        
        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            showError('changePasswordError', 'Please fill in all password fields');
            return;
        }
        
        if (newPassword.length < 8) {
            showError('changePasswordError', 'New password must be at least 8 characters long');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showError('changePasswordError', 'New passwords do not match');
            return;
        }
        
        hideError('changePasswordError');
        
        // Re-authenticate user
        const credential = firebase.auth.EmailAuthProvider.credential(
            window.currentUser.email,
            currentPassword
        );
        
        await window.currentUser.reauthenticateWithCredential(credential);
        
        // Update password
        await window.currentUser.updatePassword(newPassword);
        
        showSuccess('changePasswordSuccess', 'Password changed successfully!');
        
        // Close modal after delay
        setTimeout(() => {
            closeChangePasswordModal();
        }, 2000);
        
    } catch (error) {
        console.error('Error changing password:', error);
        if (error.code === 'auth/wrong-password') {
            showError('changePasswordError', 'Current password is incorrect');
        } else if (error.code === 'auth/weak-password') {
            showError('changePasswordError', 'New password is too weak');
        } else {
            showError('changePasswordError', 'Failed to change password. Please try again.');
        }
    }
}
