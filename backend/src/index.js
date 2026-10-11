require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { analyzeTerms, isApiKeyConfigured } = require('./services/geminiService');
const { extractTextFromPdf } = require('./services/pdfService');

const app = express();
const PORT = process.env.PORT || 5000;

// Multer memory storage configuration for PDF uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files (.pdf) are allowed.'));
    }
  },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    apiKeyConfigured: isApiKeyConfigured(),
    serverTime: new Date().toISOString(),
  });
});

// PDF text extraction endpoint
app.post('/api/extract-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No PDF file was uploaded. Please attach a PDF under the form field "file".',
      });
    }

    const { text, numPages } = await extractTextFromPdf(req.file.buffer);

    return res.json({
      success: true,
      data: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        numPages,
        text,
      },
    });
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to extract text from the uploaded PDF.',
    });
  }
});

// Main text summarization endpoint
app.post('/api/summarize', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing required field "text" in request body.',
      });
    }

    if (text.trim().length < 50) {
      return res.status(400).json({
        success: false,
        error: 'The provided text is too short. Please paste at least 50 characters of Terms and Conditions.',
      });
    }

    const result = await analyzeTerms(text);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error during summarization:', error);

    const isApiKeyError =
      error.message?.includes('GEMINI_API_KEY') ||
      error.message?.includes('API_KEY_INVALID') ||
      error.message?.includes('API key not valid');

    return res.status(isApiKeyError ? 401 : 500).json({
      success: false,
      error: error.message || 'An unexpected error occurred while analyzing the text.',
    });
  }
});

// Direct PDF upload and summarize in one step endpoint
app.post('/api/summarize-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No PDF file was uploaded.',
      });
    }

    const { text, numPages } = await extractTextFromPdf(req.file.buffer);
    const result = await analyzeTerms(text);

    return res.json({
      success: true,
      data: {
        ...result,
        pdfMeta: {
          fileName: req.file.originalname,
          numPages,
          fileSize: req.file.size,
        },
      },
    });
  } catch (error) {
    console.error('Error analyzing uploaded PDF:', error);
    const isApiKeyError =
      error.message?.includes('GEMINI_API_KEY') ||
      error.message?.includes('API_KEY_INVALID') ||
      error.message?.includes('API key not valid');

    return res.status(isApiKeyError ? 401 : 400).json({
      success: false,
      error: error.message || 'An error occurred while analyzing the PDF.',
    });
  }
});

// Start server
app.listen(PORT, () => {

  console.log(` Terms & Conditions Summarizer Backend running!`);
  console.log(` Listening on: http://localhost:${PORT}`);
  console.log(` Gemini API Key Configured: ${isApiKeyConfigured() ? 'YES' : 'NO '}`);
  console.log(` PDF Upload & Extraction: READY`);

});
