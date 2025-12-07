const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Helper to find a key in a row case-insensitively
const findKey = (row, potentialKeys) => {
  const rowKeys = Object.keys(row).map(k => k.toLowerCase().trim());
  for (const pk of potentialKeys) {
    const foundIndex = rowKeys.indexOf(pk.toLowerCase());
    if (foundIndex !== -1) {
      return Object.keys(row)[foundIndex]; // Return the actual key from the row
    }
  }
  return null;
};

router.post('/preview-students', upload.single('file'), async (req, res) => {
  const results = [];
  
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  console.log("Processing file:", req.file.path); // DEBUG LOG

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      console.log("CSV Raw Rows:", results.length); // DEBUG LOG
      
      const previewData = [];
      
      for (const row of results) {
        // 1. Smart Column Detection
        // Look for 'id', 'studentId', 'mssv', 'code'
        const idKey = findKey(row, ['id', 'studentId', 'student_id', 'mssv', 'code']);
        // Look for 'name', 'fullname', 'full name'
        const nameKey = findKey(row, ['name', 'fullname', 'full name', 'student name']);
        // Look for 'email', 'mail'
        const emailKey = findKey(row, ['email', 'mail', 'e-mail']);

        const studentId = idKey ? row[idKey].trim() : null;
        const name = nameKey ? row[nameKey].trim() : 'Unknown Name';
        
        // If no ID found, skip row
        if (!studentId) {
            console.log("Skipping row (No ID found):", row);
            continue; 
        }

        const email = emailKey ? row[emailKey].trim() : `${studentId}@tdtu.edu.vn`;

        // 2. Check Database for Duplicates
        const { data: existingUser } = await req.supabase
          .from('users') 
          .select('student_id')
          .eq('student_id', studentId)
          .maybeSingle(); // Use maybeSingle to avoid errors on null
        
        previewData.push({
          name: name,
          email: email,
          studentId: studentId,
          status: existingUser ? 'duplicate' : 'valid_new' 
        });
      }
      
      console.log("Processed entries:", previewData.length); // DEBUG LOG

      fs.unlinkSync(req.file.path); // Cleanup
      res.json(previewData); 
    })
    .on('error', (err) => {
        console.error("CSV Parse Error:", err);
        res.status(500).json({ error: "Failed to parse CSV" });
    });
});

module.exports = router;