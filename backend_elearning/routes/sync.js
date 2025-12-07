const express = require('express');
const router = express.Router();

router.get('/sync', async (req, res) => {
  try {
    // 1. Get the "since" timestamp from the request
    // Supabase expects ISO strings for timestamp comparisons
    const lastSync = req.query.since 
      ? new Date(req.query.since).toISOString() 
      : new Date(0).toISOString();
    
    // 2. Query Supabase tables for records updated AFTER that time
    // Note: Ensure your Supabase tables are named 'courses', 'assignments', 'users' 
    // and have a column named 'updated_at'.
    
    const { data: courses, error: courseError } = await req.supabase
      .from('courses')
      .select('*')
      .gt('updated_at', lastSync);

    const { data: assignments, error: assignError } = await req.supabase
      .from('assignments')
      .select('*')
      .gt('updated_at', lastSync);

    const { data: users, error: userError } = await req.supabase
      .from('users')
      .select('*')
      .gt('updated_at', lastSync);

    // Check for DB errors
    if (courseError || assignError || userError) {
      console.error("Supabase Sync Error:", courseError || assignError || userError);
      return res.status(500).json({ error: "Database sync failed" });
    }

    // 3. Return the data
    res.json({
      timestamp: new Date(), // Current server time for the next sync
      changes: {
        courses: courses || [],
        assignments: assignments || [],
        users: users || []
      }
    });

  } catch (err) {
    console.error("Sync Route Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;