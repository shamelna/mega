// Database Monitor for Supabase
// This script helps maintain database activity to prevent "database not used frequently" warnings

const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_ANON_KEY } = require('./config');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Configuration
const CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
const TABLES_TO_MONITOR = ['assessments', 'users', 'responses']; // Add your table names here

// Keep track of last activity
let lastActivity = new Date();

/**
 * Performs a lightweight query to keep the database active
 */
async function performKeepAlive() {
    try {
        const { data, error } = await supabase
            .from('assessments')
            .select('id')
            .limit(1);
            
        if (error) throw error;
        
        lastActivity = new Date();
        console.log(`[${new Date().toISOString()}] Keep-alive query successful`);
        return true;
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Keep-alive failed:`, error.message);
        return false;
    }
}

/**
 * Gets basic database statistics
 */
async function getDatabaseStats() {
    const stats = {
        timestamp: new Date().toISOString(),
        tables: {}
    };

    try {
        // Get row counts for each table
        for (const table of TABLES_TO_MONITOR) {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
                
            if (!error) {
                stats.tables[table] = { rowCount: count };
            }
        }
        
        return stats;
    } catch (error) {
        console.error('Error getting database stats:', error.message);
        return { error: error.message };
    }
}

/**
 * Main monitoring function
 */
async function monitorDatabase() {
    console.log(`[${new Date().toISOString()}] Starting database monitoring...`);
    
    // Initial keep-alive
    await performKeepAlive();
    
    // Set up periodic checks
    const intervalId = setInterval(async () => {
        const stats = await getDatabaseStats();
        console.log(`[${new Date().toISOString()}] Database stats:`, JSON.stringify(stats, null, 2));
        
        // If no activity in the last 12 hours, run a keep-alive
        const hoursSinceLastActivity = (new Date() - lastActivity) / (1000 * 60 * 60);
        if (hoursSinceLastActivity >= 12) {
            await performKeepAlive();
        }
    }, CHECK_INTERVAL);
    
    // Handle process termination
    process.on('SIGINT', async () => {
        clearInterval(intervalId);
        console.log('Stopping database monitoring...');
        process.exit(0);
    });
}

// Export functions for testing
module.exports = {
    performKeepAlive,
    getDatabaseStats,
    monitorDatabase
};

// Run the monitor if this file is executed directly
if (require.main === module) {
    monitorDatabase();
}
