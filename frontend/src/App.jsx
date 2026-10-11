import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import RiskMeter from './components/RiskMeter';
import FlagCard from './components/FlagCard';
import {
  FileText,
  Sparkles,
  Clipboard,
  Trash2,
  Check,
  Copy,
  AlertOctagon,
  ShieldCheck,
  Filter,
  CheckCircle,
  ExternalLink,
  FileUp,
  FileCheck2,
  Loader2,
  X,
} from 'lucide-react';

export default function App() {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractingPdf, setExtractingPdf] = useState(false);
  const [uploadedPdf, setUploadedPdf] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [serverStatus, setServerStatus] = useState({
    checking: true,
    connected: false,
    apiKeyConfigured: false,
  });

  // Theme state: defaults to dark or saved preference
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('tandc_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  const resultsRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sync theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tandc_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Check backend server health
  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setServerStatus({
          checking: false,
          connected: true,
          apiKeyConfigured: Boolean(data.apiKeyConfigured),
        });
      } else {
        setServerStatus({
          checking: false,
          connected: false,
          apiKeyConfigured: false,
        });
      }
    } catch {
      setServerStatus({
        checking: false,
        connected: false,
        apiKeyConfigured: false,
      });
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handle paste from clipboard
  const handlePasteClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setInputText(clipText);
        setUploadedPdf(null);
        setError(null);
      }
    } catch {
      alert('Unable to read clipboard automatically. Please paste using Ctrl+V / Cmd+V.');
    }
  };

  // Reusable summarize function
  const executeSummarize = async (textToSummarize) => {
    const text = textToSummarize || inputText;
    if (!text || text.trim().length < 50) {
      setError('Please provide at least 50 characters of Terms and Conditions text.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      const responseData = await res.json();

      if (!res.ok || !responseData.success) {
        throw new Error(responseData.error || 'Failed to analyze the document.');
      }

      setResult(responseData.data);
      // Smooth scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError(err.message || 'An error occurred while contacting the server.');
    } finally {
      setLoading(false);
      checkHealth();
    }
  };

  // Handle PDF file upload & extraction
  const handlePdfFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('Please select a valid PDF file (.pdf).');
      return;
    }

    setExtractingPdf(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });

      const responseData = await res.json();

      if (!res.ok || !responseData.success) {
        throw new Error(responseData.error || 'Failed to extract text from PDF.');
      }

      const extractedText = responseData.data.text;
      setInputText(extractedText);
      setUploadedPdf({
        name: responseData.data.fileName,
        pages: responseData.data.numPages,
        size: responseData.data.fileSize,
      });

      // Automatically trigger summary on the extracted content
      await executeSummarize(extractedText);
    } catch (err) {
      setError(err.message || 'Failed to upload or parse PDF.');
    } finally {
      setExtractingPdf(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Clear all fields
  const handleClear = () => {
    setInputText('');
    setUploadedPdf(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Copy summary to clipboard
  const handleCopySummary = () => {
    if (!result?.summary) return;
    navigator.clipboard.writeText(result.summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const charCount = inputText.length;

  const filteredFlags = result?.redFlags?.filter((flag) => {
    if (severityFilter === 'all') return true;
    return (flag.severity || '').toLowerCase() === severityFilter;
  }) || [];

  const highCount = result?.redFlags?.filter((f) => (f.severity || '').toLowerCase() === 'high').length || 0;
  const medCount = result?.redFlags?.filter((f) => (f.severity || '').toLowerCase() === 'medium').length || 0;
  const lowCount = result?.redFlags?.filter((f) => (f.severity || '').toLowerCase() === 'low').length || 0;

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-dark)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-main)',
      }}
    >
      <Header
        serverStatus={serverStatus}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 flex flex-col gap-8">
        {/* API Key Missing Alert banner if backend is up but no key set */}
        {serverStatus.connected && !serverStatus.apiKeyConfigured && (
          <div
            className="p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border shadow-sm"
            style={{
              backgroundColor: 'var(--color-warning-bg)',
              borderColor: 'var(--color-warning)',
              color: 'var(--text-primary)',
            }}
          >
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-lg text-lg shrink-0 mt-0.5">⚠️</span>
              <div>
                <p className="font-semibold text-sm m-0">Gemini API Key Required</p>
                <p className="text-xs m-0 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Open <code className="px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>backend/.env</code> and set: <code className="px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}>GEMINI_API_KEY=your_key</code>
                </p>
              </div>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-transform hover:scale-105 flex items-center gap-1 shrink-0 text-white shadow-sm"
              style={{ backgroundColor: 'var(--color-warning)' }}
            >
              Get Free Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Hero & Description */}
        <section className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
            Understand What You're Signing
          </h2>
          <p className="text-sm sm:text-base m-0 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Paste text or upload a PDF of any Terms of Service, Privacy Policy, or EULA.
          </p>
        </section>

        {/* Input Card */}
        <section
          className="p-5 flex flex-col gap-4 transition-colors duration-200"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--bg-card-border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            className="flex flex-wrap items-center justify-between gap-3 pb-2.5"
            style={{ borderBottom: '1px solid var(--bg-card-border)' }}
          >
            <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              <FileText className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
              <span>Terms & Conditions Content</span>
            </div>

            {/* Hidden File Input & Upload PDF Button */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handlePdfFileSelect}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={extractingPdf || loading}
                className="px-3.5 py-1.5 text-xs font-semibold flex items-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border hover:opacity-90 active:scale-95"
                style={{
                  backgroundColor: 'var(--color-accent-bg)',
                  borderColor: 'var(--color-accent-bg)',
                  color: 'var(--color-accent)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                {extractingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting PDF...</span>
                  </>
                ) : (
                  <>
                    <FileUp className="w-3.5 h-3.5" />
                    <span>Upload PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Uploaded PDF info pill */}
          {uploadedPdf && (
            <div
              className="flex items-center justify-between px-3.5 py-2.5 border text-xs animate-in fade-in"
              style={{
                backgroundColor: 'var(--color-accent-bg)',
                borderColor: 'var(--color-accent)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
              }}
            >
              <div className="flex items-center gap-2 truncate">
                <FileCheck2 className="w-4 h-4 shrink-0" style={{ color: 'var(--color-accent)' }} />
                <span className="font-semibold truncate">{uploadedPdf.name}</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  ({uploadedPdf.pages} {uploadedPdf.pages === 1 ? 'page' : 'pages'}
                  {uploadedPdf.size ? ` • ${(uploadedPdf.size / 1024).toFixed(1)} KB` : ''})
                </span>
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold border"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--color-accent)',
                    color: 'var(--color-accent)',
                  }}
                >
                  Extracted
                </span>
              </div>
              <button
                type="button"
                onClick={handleClear}
                title="Remove file and clear text"
                className="p-1 rounded transition cursor-pointer ml-2 shrink-0 hover:opacity-75"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Textarea */}
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (error) setError(null);
              }}
              rows={10}
              placeholder="Paste your Terms and Conditions text here, or click 'Upload PDF' above to extract and analyze directly from a PDF file..."
              className="w-full p-4 text-sm resize-y transition leading-relaxed focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--bg-card-border)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
              }}
            />
          </div>

          {/* Toolbar under textarea */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>{charCount.toLocaleString()} characters</span>
              <span>•</span>
              <span>{wordCount.toLocaleString()} words</span>

              {(inputText || uploadedPdf) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="transition flex items-center gap-1 cursor-pointer ml-2 hover:opacity-80"
                  style={{ color: 'var(--color-loss)' }}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="px-3.5 py-2 border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer hover:opacity-90 shadow-sm"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--bg-card-border)',
                  color: 'var(--text-secondary)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <Clipboard className="w-3.5 h-3.5" /> Paste
              </button>

              <button
                type="button"
                onClick={() => executeSummarize()}
                disabled={loading || extractingPdf || !inputText.trim()}
                className="flex-1 sm:flex-initial px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md hover:opacity-95 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, var(--color-accent), var(--color-purple))',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Analyzing with Gemini...</span>
                  </>
                ) : (
                  <>
                    <span>Summarize & Flag</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              className="p-3.5 border text-sm flex items-start gap-2.5 rounded-xl shadow-sm"
              style={{
                backgroundColor: 'var(--color-loss-bg)',
                borderColor: 'var(--color-loss)',
                color: 'var(--color-loss)',
              }}
            >
              <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">Error:</span> {error}
              </div>
            </div>
          )}
        </section>

        {/* Results Section */}
        {result && (
          <section ref={resultsRef} className="space-y-6 pt-2">
            <div
              className="flex items-center justify-between pb-2"
              style={{ borderBottom: '1px solid var(--bg-card-border)' }}
            >
              <div className="flex items-center gap-2 font-bold text-lg">
                <ShieldCheck className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                <h3 className="m-0 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  Analysis Results
                </h3>
              </div>
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                Model: <code style={{ color: 'var(--text-secondary)' }}>{result.modelUsed || 'gemini-3.8-flash'}</code>
              </span>
            </div>

            {/* Risk Assessment Meter */}
            <RiskMeter
              riskLevel={result.riskLevel}
              riskScore={result.riskScore}
              riskExplanation={result.riskExplanation}
            />

            {/* Concise Summary Paragraph Card */}
            <div
              className="p-6 transition-colors duration-200"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--bg-card-border)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5"
                  style={{ color: 'var(--color-accent)' }}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Summary Overview
                </div>
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="px-2.5 py-1 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer border hover:opacity-90"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--bg-card-border)',
                    color: 'var(--text-secondary)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {copiedSummary ? (
                    <>
                      <Check className="w-3.5 h-3.5" style={{ color: 'var(--color-profit)' }} /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Summary
                    </>
                  )}
                </button>
              </div>
              <p
                className="text-base leading-relaxed m-0 font-normal"
                style={{ color: 'var(--text-primary)' }}
              >
                {result.summary}
              </p>
            </div>

            {/* Flagged Points Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-base font-bold m-0 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <span>Important Flagged Points & Red Flags</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--bg-card-border)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {result.redFlags?.length || 0}
                    </span>
                  </h4>
                  <p className="text-xs m-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Clauses that restrict your rights, monetize your personal data, or impose unilateral terms.
                  </p>
                </div>

                {/* Filter Tabs */}
                {result.redFlags?.length > 0 && (
                  <div
                    className="flex items-center gap-1 p-1 rounded-xl text-xs self-start sm:self-auto border"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--bg-card-border)',
                    }}
                  >
                    <Filter className="w-3 h-3 ml-1.5 mr-0.5" style={{ color: 'var(--text-muted)' }} />
                    <button
                      type="button"
                      onClick={() => setSeverityFilter('all')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-medium ${
                        severityFilter === 'all' ? 'shadow-sm font-semibold' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: severityFilter === 'all' ? 'var(--bg-surface)' : 'transparent',
                        color: 'var(--text-primary)',
                      }}
                    >
                      All ({result.redFlags.length})
                    </button>
                    {highCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setSeverityFilter('high')}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-medium ${
                          severityFilter === 'high' ? 'font-bold' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: severityFilter === 'high' ? 'var(--color-loss-bg)' : 'transparent',
                          color: 'var(--color-loss)',
                        }}
                      >
                        High ({highCount})
                      </button>
                    )}
                    {medCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setSeverityFilter('medium')}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-medium ${
                          severityFilter === 'medium' ? 'font-bold' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: severityFilter === 'medium' ? 'var(--color-warning-bg)' : 'transparent',
                          color: 'var(--color-warning)',
                        }}
                      >
                        Medium ({medCount})
                      </button>
                    )}
                    {lowCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setSeverityFilter('low')}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-medium ${
                          severityFilter === 'low' ? 'font-bold' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: severityFilter === 'low' ? 'var(--color-accent-bg)' : 'transparent',
                          color: 'var(--color-accent)',
                        }}
                      >
                        Notice ({lowCount})
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Flags List */}
              {filteredFlags.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {filteredFlags.map((flag, idx) => (
                    <FlagCard key={idx} flag={flag} index={idx} />
                  ))}
                </div>
              ) : (
                <div
                  className="text-center py-8 rounded-xl border text-sm"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--bg-card-border)',
                    color: 'var(--text-muted)',
                  }}
                >
                  No flagged points match the selected filter.
                </div>
              )}
            </div>

            {/* Fair / Positive Provisions (if present) */}
            {result.positivePoints && result.positivePoints.length > 0 && (
              <div
                className="p-5 border transition-colors duration-200"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--color-profit)',
                  borderRadius: 'var(--radius-xl)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div
                  className="flex items-center gap-2 font-semibold text-sm mb-3"
                  style={{ color: 'var(--color-profit)' }}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Fair or User-Friendly Clauses Detected</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.positivePoints.map((pos, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 border rounded-xl"
                      style={{
                        backgroundColor: 'var(--color-profit-bg)',
                        borderColor: 'var(--color-profit)',
                      }}
                    >
                      <h5
                        className="text-sm font-semibold m-0 mb-1"
                        style={{ color: 'var(--color-profit)' }}
                      >
                        {pos.title}
                      </h5>
                      <p
                        className="text-xs leading-relaxed m-0"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {pos.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer
        className="py-6 text-center text-xs transition-colors duration-200"
        style={{
          borderTop: '1px solid var(--bg-card-border)',
          color: 'var(--text-muted)',
        }}
      >
        <p className="m-0">
          Terms & Conditions Summarizer • Powered by Gemini AI • For informational purposes only.
        </p>
      </footer>
    </div>
  );
}
