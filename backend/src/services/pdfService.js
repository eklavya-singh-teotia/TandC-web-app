const { PDFParse } = require('pdf-parse');

/**
 * Extracts plain text and page count from a PDF buffer
 * @param {Buffer} buffer
 * @returns {Promise<{text: string, numPages: number}>}
 */
async function extractTextFromPdf(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Invalid PDF data provided.');
  }

  const parser = new PDFParse({ data: buffer });
  try {
    const parsed = await parser.getText();
    // Clean up artificial page divider markers like "-- 1 of 5 --" if desired, or keep as readable text
    let text = (parsed.text || '').trim();

    if (!text || text.length === 0) {
      throw new Error(
        'No readable text could be extracted from this PDF. The document might be a scanned image or protected.'
      );
    }

    const numPages = parsed.total || (parsed.pages ? parsed.pages.length : 1);

    return {
      text,
      numPages,
    };
  } finally {
    await parser.destroy().catch(() => {});
  }
}

module.exports = {
  extractTextFromPdf,
};
