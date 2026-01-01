// ============================================
// SUPABASE TO FIREBASE MIGRATION SCRIPT
// ============================================

// This script migrates data from Supabase to Firebase
// Run this in your browser console after both Supabase and Firebase are initialized

// Supabase configuration (keep your existing config)
const SUPABASE_URL = 'https://hammdlesdcmenhronfml.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhbW1kbGVzZGNtZW5ocm9uZm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMzUwMTYsImV4cCI6MjA3NzYxMTAxNn0.pFmZoSrCLCSMLrbBmTh3L-MMdJ6GL-5G-NKDr4YIV6g';

// Initialize Supabase (for migration only)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Migration progress tracking
let migrationStats = {
    profiles: { total: 0, migrated: 0, errors: 0 },
    assessments: { total: 0, migrated: 0, errors: 0 }
};

// ============================================
// MAIN MIGRATION FUNCTION
// ============================================
async function migrateFromSupabaseToFirebase() {
    console.log('🚀 Starting migration from Supabase to Firebase...');
    
    try {
        // Step 1: Migrate Profiles
        await migrateProfiles();
        
        // Step 2: Migrate Assessments
        await migrateAssessments();
        
        // Step 3: Display migration summary
        displayMigrationSummary();
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

// ============================================
// PROFILES MIGRATION
// ============================================
async function migrateProfiles() {
    console.log('📥 Fetching profiles from Supabase...');
    
    try {
        const { data: profiles, error } = await supabaseClient
            .from('profiles')
            .select('*');
        
        if (error) throw error;
        
        migrationStats.profiles.total = profiles.length;
        console.log(`Found ${profiles.length} profiles to migrate`);
        
        for (const profile of profiles) {
            try {
                await migrateProfile(profile);
                migrationStats.profiles.migrated++;
            } catch (error) {
                console.error(`❌ Failed to migrate profile ${profile.id}:`, error);
                migrationStats.profiles.errors++;
            }
        }
        
    } catch (error) {
        console.error('❌ Failed to fetch profiles:', error);
    }
}

async function migrateProfile(profile) {
    // Transform Supabase profile to Firebase format
    const firebaseProfile = {
        uid: profile.id,
        email: profile.email,
        role: profile.role || 'user',
        display_name: profile.full_name || profile.email.split('@')[0],
        is_active: profile.is_active !== false,
        created_at: convertSupabaseTimestamp(profile.created_at),
        updated_at: convertSupabaseTimestamp(profile.updated_at)
    };
    
    // Save to Firebase
    await db.collection('profiles').doc(profile.id).set(firebaseProfile);
    console.log(`✅ Migrated profile: ${profile.email}`);
}

// ============================================
// ASSESSMENTS MIGRATION
// ============================================
async function migrateAssessments() {
    console.log('📥 Fetching assessments from Supabase...');
    
    try {
        const { data: assessments, error } = await supabaseClient
            .from('assessments')
            .select('*');
        
        if (error) throw error;
        
        migrationStats.assessments.total = assessments.length;
        console.log(`Found ${assessments.length} assessments to migrate`);
        
        for (const assessment of assessments) {
            try {
                await migrateAssessment(assessment);
                migrationStats.assessments.migrated++;
            } catch (error) {
                console.error(`❌ Failed to migrate assessment ${assessment.id}:`, error);
                migrationStats.assessments.errors++;
            }
        }
        
    } catch (error) {
        console.error('❌ Failed to fetch assessments:', error);
    }
}

async function migrateAssessment(assessment) {
    // Transform Supabase assessment to Firebase format
    const firebaseAssessment = {
        user_id: assessment.user_id,
        user_email: assessment.user_email,
        company_name: assessment.company_name,
        assessor_name: assessment.assessor_name,
        assessment_date: assessment.assessment_date,
        responses: assessment.responses || {},
        dimension_scores: assessment.dimension_scores || [],
        overall_score: assessment.overall_score || 0,
        status: assessment.status || 'completed',
        created_at: convertSupabaseTimestamp(assessment.created_at),
        updated_at: convertSupabaseTimestamp(assessment.updated_at)
    };
    
    // Save to Firebase
    const docRef = await db.collection('assessments').add(firebaseAssessment);
    console.log(`✅ Migrated assessment: ${assessment.company_name} (ID: ${docRef.id})`);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function convertSupabaseTimestamp(timestamp) {
    if (!timestamp) return firebase.firestore.FieldValue.serverTimestamp();
    
    // Handle different timestamp formats from Supabase
    const date = new Date(timestamp);
    return firebase.firestore.Timestamp.fromDate(date);
}

function displayMigrationSummary() {
    console.log('\n🎉 Migration Summary:');
    console.log('==================');
    console.log(`Profiles: ${migrationStats.profiles.migrated}/${migrationStats.profiles.total} migrated, ${migrationStats.profiles.errors} errors`);
    console.log(`Assessments: ${migrationStats.assessments.migrated}/${migrationStats.assessments.total} migrated, ${migrationStats.assessments.errors} errors`);
    
    const totalMigrated = migrationStats.profiles.migrated + migrationStats.assessments.migrated;
    const totalItems = migrationStats.profiles.total + migrationStats.assessments.total;
    const totalErrors = migrationStats.profiles.errors + migrationStats.assessments.errors;
    
    console.log(`\nTotal: ${totalMigrated}/${totalItems} items migrated successfully`);
    
    if (totalErrors > 0) {
        console.log(`⚠️ ${totalErrors} items failed to migrate. Check console for details.`);
    } else {
        console.log('✅ All data migrated successfully!');
    }
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================
async function validateMigration() {
    console.log('🔍 Validating migration...');
    
    // Check profiles
    const profilesSnapshot = await db.collection('profiles').get();
    console.log(`✅ Firebase profiles: ${profilesSnapshot.size}`);
    
    // Check assessments
    const assessmentsSnapshot = await db.collection('assessments').get();
    console.log(`✅ Firebase assessments: ${assessmentsSnapshot.size}`);
    
    // Check a sample profile
    if (profilesSnapshot.size > 0) {
        const sampleProfile = profilesSnapshot.docs[0].data();
        console.log('Sample profile:', sampleProfile);
    }
    
    // Check a sample assessment
    if (assessmentsSnapshot.size > 0) {
        const sampleAssessment = assessmentsSnapshot.docs[0].data();
        console.log('Sample assessment:', sampleAssessment);
    }
}

// ============================================
// ROLLBACK FUNCTION (if needed)
// ============================================
async function rollbackMigration() {
    if (!confirm('⚠️ This will delete all migrated data from Firebase. Are you sure?')) {
        return;
    }
    
    console.log('🔄 Rolling back migration...');
    
    try {
        // Delete all assessments
        const assessmentsSnapshot = await db.collection('assessments').get();
        const batch = db.batch();
        
        assessmentsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        console.log('✅ Deleted all assessments from Firebase');
        
        // Delete all profiles
        const profilesSnapshot = await db.collection('profiles').get();
        const profileBatch = db.batch();
        
        profilesSnapshot.docs.forEach(doc => {
            profileBatch.delete(doc.ref);
        });
        
        await profileBatch.commit();
        console.log('✅ Deleted all profiles from Firebase');
        console.log('🔄 Rollback completed');
        
    } catch (error) {
        console.error('❌ Rollback failed:', error);
    }
}

// ============================================
// USAGE INSTRUCTIONS
// ============================================
console.log(`
🚀 Supabase to Firebase Migration Tool
=====================================

To run the migration:

1. Open your application in the browser
2. Open browser console (F12)
3. Run: migrateFromSupabaseToFirebase()

Other useful commands:
- validateMigration() - Check if migration was successful
- rollbackMigration() - Delete all migrated data (use with caution!)

Note: Make sure both Supabase and Firebase are initialized before running migration.
`);

// Export functions for global access
window.migrateFromSupabaseToFirebase = migrateFromSupabaseToFirebase;
window.validateMigration = validateMigration;
window.rollbackMigration = rollbackMigration;
