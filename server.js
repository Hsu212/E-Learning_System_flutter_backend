const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Import Routes
const importRoutes = require('./backend_elearning/routes/import');
const syncRoutes = require('./backend_elearning/routes/sync');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow requests from Flutter Web
app.use(express.json()); // Parse JSON bodies

// --- SUPABASE CONFIGURATION ---
// 1. Get these from your Supabase Dashboard -> Project Settings -> API
// 2. Use the "Service Role Key" for the backend (bypasses Row Level Security for admin tasks)
const SUPABASE_URL = 'https://imrxgzzrvhezsdrdnreb.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcnhnenpydmhlenNkcmRucmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MTAyNjYsImV4cCI6MjA4MDA4NjI2Nn0.NMjp5wxhGDhaWaqGxeKSsZbG-2gNi_65new_N4u-cZU'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Middleware to inject Supabase client into every request
// This allows routes to use `req.supabase` to query the database
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

console.log('✅ Supabase Client Initialized');

// Routes
app.use('/api/students', importRoutes); // e.g., POST /api/students/preview-students
app.use('/api', syncRoutes);            // e.g., GET /api/sync

// Health Check (for Wake-up Script)
app.get('/', (req, res) => {
  res.send('Supabase Backend is running...');
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});