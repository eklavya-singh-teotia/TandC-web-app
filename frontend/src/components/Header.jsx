import React from 'react';
import { ShieldAlert, Sparkles, CheckCircle2, AlertCircle, AlertTriangle, Sun, Moon } from 'lucide-react';

export default function Header({ serverStatus, theme, onToggleTheme }) {
  const isLight = theme === 'light';

  return (
    <header
      className="sticky top-0 z-20 backdrop-blur transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--bg-card-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-10 w-auto max-w-[140px] object-contain transition-transform hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = document.getElementById('header-fallback-icon');
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div
            id="header-fallback-icon"
            className="w-10 h-10 rounded-xl items-center justify-center shadow-md hidden"
            style={{
              background: 'linear-gradient(135deg, var(--color-accent), var(--color-purple))',
              color: '#ffffff',
            }}
          >
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
                T&C Summarizer
              </h1>
        
            </div>
            <p className="text-xs m-0" style={{ color: 'var(--text-secondary)' }}>
              Cut through legal jargon and spot hidden red flags in seconds
            </p>
          </div>
        </div>

        {/* Right side controls: Server status + Light/Dark theme toggle */}
        <div className="flex items-center gap-3 text-xs">
          {/* Server status indicator */}
          <div>
            {serverStatus.checking ? (
              <span
                className="px-3 py-1 rounded-full flex items-center gap-1.5 border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-muted)',
                  borderColor: 'var(--bg-card-border)',
                }}
              >
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--text-muted)' }} />
                Checking backend...
              </span>
            ) : !serverStatus.connected ? (
              <span
                className="px-3 py-1 rounded-full flex items-center gap-1.5 border"
                style={{
                  backgroundColor: 'var(--color-loss-bg)',
                  color: 'var(--color-loss)',
                  borderColor: 'var(--color-loss)',
                }}
                title="Make sure backend server is running on port 5000"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Backend Offline (Port 5000)
              </span>
            ) : !serverStatus.apiKeyConfigured ? (
              <span
                className="px-3 py-1 rounded-full flex items-center gap-1.5 border"
                style={{
                  backgroundColor: 'var(--color-warning-bg)',
                  color: 'var(--color-warning)',
                  borderColor: 'var(--color-warning)',
                }}
                title="Add GEMINI_API_KEY in backend/.env"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                API Key Missing
              </span>
            ) : (
              <span
                className="px-3 py-1 rounded-full flex items-center gap-1.5 border font-medium"
                style={{
                  backgroundColor: 'var(--color-profit-bg)',
                  color: 'var(--color-profit)',
                  borderColor: 'var(--color-profit)',
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Api Ready
              </span>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            className="p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer hover:opacity-90 active:scale-95 shadow-sm"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--bg-card-border)',
              color: 'var(--text-primary)',
            }}
          >
            {isLight ? (
              <Moon className="w-4 h-4 text-slate-700" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
