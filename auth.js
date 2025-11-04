// ============================================
// AUTHENTICATION MODULE
// ============================================

let currentUser = null;
let currentUserProfile = null;

// ============================================
// INITIALIZATION
// ============================================
async function initializeAuth() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Session error:', error);
            return;
        }
        
        if (session) {
            await handleAuthenticatedUser(session.user);
        } else {
            showAuthSection();
        }

        // Listen for auth state changes
        supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event);
            
            if (event === 'SIGNED_IN' && session) {
                await handleAuthenticatedUser(session.user);
            } else if (event === 'SIGNED_OUT') {
                handleSignOut();
            } else if (event === 'TOKEN_REFRESHED' && session) {
                console.log('Token refreshed successfully');
            }
        });

    } catch (error) {
        console.error('Auth initialization error:', error);
        showAuthSection();
    }
}

async function handleAuthenticatedUser(user) {
    currentUser = user;
    
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        
        if (error) {
            console.error('Error fetching profile:', error);
            await createUserProfile(user);
        } else {
            currentUserProfile = profile;
            console.log('User profile loaded:', profile);
            
            // Update profile if full_name is missing but available in metadata
            if (!profile.full_name && user.user_metadata?.full_name) {
                await updateUserProfile(user.id, { full_name: user.user_metadata.full_name });
            }
        }
        
        showAuthenticatedUI();
        
    } catch (error) {
        console.error('Profile fetch error:', error);
        showAuthenticatedUI();
    }
}

async function createUserProfile(user) {
    try {
        const fullName = user.user_metadata?.full_name || user.email.split('@')[0];
        
        const { data, error } = await supabase
            .from('profiles')
            .insert([
                {
                    id: user.id,
                    email: user.email,
                    role: 'user',
                    full_name: fullName,
                    is_active: true
                }
            ])
            .select()
            .single();
        
        if (error) throw error;
        
        currentUserProfile = data;
        console.log('Profile created:', data);
        
    } catch (error) {
        console.error('Error creating profile:', error);
    }
}

async function updateUserProfile(userId, updates) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
        
        if (error) throw error;
        
        if (data && userId === currentUser?.id) {
            currentUserProfile = data;
            console.log('Profile updated:', data);
        }
        
        return { data, error: null };
    } catch (error) {
        console.error('Error updating profile:', error);
        return { data: null, error };
    }
}

function showAuthenticatedUI() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('mainNavigation').style.display = 'flex';
    
    if (isAdmin()) {
        document.getElementById('adminNav').style.display = 'block';
        loadAdminDashboard();
    } else {
        document.getElementById('adminNav').style.display = 'none';
    }
    
    loadUserAssessments();
    showPanel('assessment');
    document.getElementById('assessmentDate').value = new Date().toISOString().split('T')[0];
}

function showAuthSection() {
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('mainNavigation').style.display = 'none';
    currentUser = null;
    currentUserProfile = null;
}

function isAdmin() {
    return currentUserProfile && currentUserProfile.role === 'admin';
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
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name
                }
            }
        });
        
        if (error) throw error;
        
        if (data.user && data.user.identities && data.user.identities.length === 0) {
            showError('signupError', 'This email is already registered. Please sign in instead.');
        } else {
            showSuccess('signupSuccess', 
                '✓ Account created successfully! ' + 
                (data.user.confirmation_sent_at ? 
                    'Please check your email to confirm your account.' : 
                    'You can now sign in.')
            );
            
            document.getElementById('signupName').value = '';
            document.getElementById('signupEmail').value = '';
            document.getElementById('signupPassword').value = '';
            document.getElementById('signupPasswordConfirm').value = '';
            
            setTimeout(() => showAuthTab('signin'), 2000);
        }
        
    } catch (error) {
        console.error('Signup error:', error);
        showError('signupError', error.message || 'Failed to create account. Please try again.');
    } finally {
        signupBtn.disabled = false;
        signupBtn.innerHTML = 'Create Account';
    }
}

// ============================================
// SIGN IN
// ============================================
async function handleSignIn() {
    const email = document.getElementById('signinEmail').value.trim();
    const password = document.getElementById('signinPassword').value;
    
    hideError('signinError');
    
    if (!email || !password) {
        showError('signinError', 'Please enter both email and password');
        return;
    }
    
    if (!isValidEmail(email)) {
        showError('signinError', 'Please enter a valid email address');
        return;
    }
    
    const signinBtn = event.target;
    signinBtn.disabled = true;
    signinBtn.innerHTML = '<span class="loading-spinner"></span> Signing in...';
    
    try {
        // Clear any stale session first
        await supabase.auth.signOut();
        
        // Small delay to ensure cleanup is complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        console.log('Sign in successful:', data.user.email);
        
        document.getElementById('signinEmail').value = '';
        document.getElementById('signinPassword').value = '';
        
    } catch (error) {
        console.error('Sign in error:', error);
        
        let errorMessage = 'Failed to sign in. Please check your credentials.';
        if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Please confirm your email address before signing in. Check your inbox.';
        } else if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password. Please try again.';
        }
        
        showError('signinError', errorMessage);
        signinBtn.disabled = false;
        signinBtn.innerHTML = 'Sign In';
    }
}

// ============================================
// PASSWORD RESET
// ============================================
async function handlePasswordReset() {
    const email = document.getElementById('resetEmail').value.trim();
    
    hideError('resetError');
    hideError('resetSuccess');
    
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
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin
        });
        
        if (error) throw error;
        
        showSuccess('resetSuccess', 
            '✓ Password reset link sent! Please check your email inbox and spam folder.'
        );
        
        document.getElementById('resetEmail').value = '';
        
    } catch (error) {
        console.error('Password reset error:', error);
        showError('resetError', error.message || 'Failed to send reset link. Please try again.');
    } finally {
        resetBtn.disabled = false;
        resetBtn.innerHTML = 'Send Reset Link';
    }
}

// ============================================
// SIGN OUT
// ============================================
async function userLogout() {
    if (confirm('Are you sure you want to logout?')) {
        try {
            const { error } = await supabase.auth.signOut();
            
            if (error) throw error;
            
            console.log('User signed out successfully');
            handleSignOut();
            
        } catch (error) {
            console.error('Sign out error:', error);
            alert('Error signing out. Please try again.');
        }
    }
}

function handleSignOut() {
    currentUser = null;
    currentUserProfile = null;
    
    showAuthSection();
    
    document.getElementById('savedAssessments').innerHTML = '';
    document.getElementById('adminAssessments').innerHTML = '';
    
    showPanel('assessment');
}

// ============================================
// UI HELPERS
// ============================================
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
    }
}

function showForgotPassword() {
    document.getElementById('signinForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'block';
    
    document.getElementById('signinTab').classList.remove('active');
    document.getElementById('signupTab').classList.remove('active');
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
}

function hideError(elementId) {
    const element = document.getElementById(elementId);
    element.style.display = 'none';
}

function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
