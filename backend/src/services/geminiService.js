const { GoogleGenAI } = require('@google/genai');

/**
 * Validates and retrieves the configured Gemini client
 */
function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    throw new Error(
      'GEMINI_API_KEY is missing or not configured. Please add your Gemini API key to the backend/.env file.'
    );
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Analyzes Terms and Conditions text with Gemini
 * @param {string} text - Terms and conditions raw text
 * @returns {Promise<object>} - Structured summary and flagged points
 */
async function analyzeTerms(text) {
  if (!text || typeof text !== 'string' || text.trim().length < 50) {
    throw new Error('Please provide at least 50 characters of Terms and Conditions text to analyze.');
  }

  const ai = getClient();
  const preferredModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  const systemInstructions = `You are a consumer advocate and legal analyst AI. Your task is to analyze legal agreements, Terms of Service, and Privacy Policies.
Analyze the provided document thoroughly and return a concise, high-impact breakdown for everyday users.

You MUST respond strictly with valid JSON conforming to this format:
{
  "summary": "A clear, concise 2 to 4 sentence plain-English summary of what this agreement means for the user.",
  "riskLevel": "Low" | "Medium" | "High",
  "riskScore": <integer between 1 and 100 representing user risk, where 1-30 is Low, 31-65 is Medium, 66-100 is High>,
  "riskExplanation": "A 1-2 sentence plain-English rationale for the risk level assigned.",
  "redFlags": [
    {
      "severity": "high" | "medium" | "low",
      "category": "Privacy & Data" | "Financial & Billing" | "Legal Rights" | "Account Control" | "Content Ownership" | "Other",
      "title": "Short title of the flagged point (e.g. Mandatory Arbitration & Class Action Waiver)",
      "description": "Clear explanation of what the user is agreeing to and why it is concerning.",
      "clauseQuote": "Brief relevant quote or clause from the text (keep under 30 words)."
    }
  ],
  "positivePoints": [
    {
      "title": "Title of fair clause (e.g. 30-Day Notice for Price Changes)",
      "description": "Brief explanation of why this is user-friendly or transparent."
    }
  ]
}

Ensure the redFlags array highlights clauses like:
- Rights surrendered (arbitration clauses, waivers of right to sue or jury trial)
- Aggressive data collection, selling personal data, or tracking
- Unilateral modification rights (changing terms without notice)
- Auto-renewals, hidden fees, or no-refund policies
- License grants (granting perpetual or commercial rights over user content)
- Immediate account termination or loss of access without cause

Do not output any markdown formatting like \`\`\`json or backticks. Return raw JSON only.`;

  const promptContent = `${systemInstructions}\n\n---\nTERMS AND CONDITIONS TEXT TO ANALYZE:\n${text}\n---`;

  // Try preferred model (gemini-3.8-flash), fallback to other active flash models if needed
  const modelsToTry = [preferredModel, 'gemini-3.7-flash', 'gemini-flash-latest', 'gemini-2.5-flash'];
  let lastError = null;

  for (const model of [...new Set(modelsToTry)]) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: promptContent,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      let rawText = response.text;
      if (!rawText) {
        throw new Error('Received empty response from Gemini API.');
      }

      // Clean any potential markdown wrappers if model outputted them despite instructions
      rawText = rawText.trim();
      if (rawText.startsWith('```json')) {
        rawText = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
      } else if (rawText.startsWith('```')) {
        rawText = rawText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(rawText);

      // Validate core required fields
      return {
        summary: parsed.summary || 'Summary could not be extracted.',
        riskLevel: parsed.riskLevel || 'Medium',
        riskScore: typeof parsed.riskScore === 'number' ? parsed.riskScore : 50,
        riskExplanation: parsed.riskExplanation || '',
        redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
        positivePoints: Array.isArray(parsed.positivePoints) ? parsed.positivePoints : [],
        analyzedAt: new Date().toISOString(),
        modelUsed: model,
      };
    } catch (err) {
      lastError = err;
      // If error is about API key, do not retry other models as all will fail
      if (err.message && (err.message.includes('API_KEY_INVALID') || err.message.includes('API key not valid') || err.message.includes('GEMINI_API_KEY'))) {
        throw err;
      }
      console.warn(`Attempt with model "${model}" failed: ${err.message}. Trying next fallback if available...`);
    }
  }

  throw new Error(`Failed to generate summary: ${lastError?.message || 'Unknown error'}`);
}

module.exports = {
  analyzeTerms,
  isApiKeyConfigured: () => {
    const key = process.env.GEMINI_API_KEY;
    return Boolean(key && key.trim() !== '' && key !== 'your_gemini_api_key_here');
  },
};
