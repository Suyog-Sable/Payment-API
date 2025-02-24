const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Endpoint to handle image uploads and call Python script
app.post('/read-transaction', upload.single('file'), (req, res) => {
  const imagePath = path.resolve(req.file.path);

  const pythonProcess = spawn('python', ['transaction_reader.py', imagePath]);

  let result = '';
  pythonProcess.stdout.on('data', (data) => {
    result += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python error: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    fs.unlinkSync(imagePath); // Delete uploaded image after processing

    if (code !== 0) {
      return res.status(500).json({ error: 'Error processing image.' });
    }

    try {
      const details = JSON.parse(result);
      res.json(details);
    } catch (err) {
      res.status(500).json({ error: 'Failed to parse OCR response.' });
    }
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
