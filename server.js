const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const port = 3000;

// Multer configuration
const upload = multer({ dest: 'uploads/' });

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Transaction Reader API',
      version: '1.0.0',
      description: 'API to extract transaction details from uploaded images',
    },
  },
  apis: ['./server.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /read-transaction:
 *   post:
 *     summary: Upload an image to extract transaction details
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Extracted transaction details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Error processing the image
 */
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
    fs.unlinkSync(imagePath); // Clean up uploaded file

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
  console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
});
