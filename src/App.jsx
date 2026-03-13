import { useState, useEffect, useRef } from 'react';
import AdBanner from './AdBanner.jsx';
import AdvertiserModal from './AdvertiserModal.jsx';
import GameArcade from './games/GameArcade.jsx';

// Animate a number counting up from 0 to its target value
function useAnimatedValue(target, duration = 800) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (target === null) { setDisplay(0); return; }
    const start = performance.now();
    const from = 0;
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (target - from) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return display;
}

// Calculate a letter grade based on download speed
function getGrade(download, upload, ping) {
  // Weighted score: download matters most
  const score = download * 0.5 + upload * 0.3 + Math.max(0, 100 - ping) * 0.2;
  if (score >= 60) return 'A';
  if (score >= 35) return 'B';
  if (score >= 15) return 'C';
  return 'D';
}

export default function App() {
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState({ download: null, upload: null, ping: null, jitter: null });
  const [done, setDone] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [mobileTab, setMobileTab] = useState('speed');

  // Animated display values
  const dlDisplay = useAnimatedValue(results.download);
  const ulDisplay = useAnimatedValue(results.upload);
  const pingDisplay = useAnimatedValue(results.ping);
  const jitterDisplay = useAnimatedValue(results.jitter);

  async function runTest() {
    setTesting(true);
    setDone(false);
    setResults({ download: null, upload: null, ping: null, jitter: null });

    // ── DOWNLOAD TEST ──
    setStatus('Testing download speed...');
    setProgress(10);
    let downloadMbps = 0;
    try {
      const dlStart = performance.now();
      const resp = await fetch('https://speed.cloudflare.com/__down?bytes=10000000', { cache: 'no-store' });
      const reader = resp.body.getReader();
      let totalBytes = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.length;
        // Update progress as data streams in
        const pct = Math.min((totalBytes / 10000000) * 30, 30);
        setProgress(10 + pct);
      }
      const dlEnd = performance.now();
      const durationSec = (dlEnd - dlStart) / 1000;
      downloadMbps = (totalBytes * 8) / (durationSec * 1000000);
    } catch {
      downloadMbps = 0;
    }
    setResults(prev => ({ ...prev, download: Math.round(downloadMbps * 10) / 10 }));

    // ── UPLOAD TEST ──
    setStatus('Testing upload speed...');
    setProgress(45);
    let uploadMbps = 0;
    try {
      const blob = new Blob([new ArrayBuffer(5000000)]);
      const ulStart = performance.now();
      await fetch('/api/upload-test', { method: 'POST', body: blob });
      const ulEnd = performance.now();
      const durationSec = (ulEnd - ulStart) / 1000;
      uploadMbps = (5000000 * 8) / (durationSec * 1000000);
    } catch {
      uploadMbps = 0;
    }
    setResults(prev => ({ ...prev, upload: Math.round(uploadMbps * 10) / 10 }));
    setProgress(70);

    // ── PING & JITTER TEST ──
    setStatus('Measuring latency...');
    const pings = [];
    for (let i = 0; i < 5; i++) {
      try {
        const pStart = performance.now();
        await fetch('/api/upload-test', { method: 'POST', body: '1', cache: 'no-store' });
        const pEnd = performance.now();
        pings.push(pEnd - pStart);
      } catch {
        pings.push(999);
      }
      setProgress(70 + ((i + 1) / 5) * 25);
    }
    const avgPing = pings.reduce((a, b) => a + b, 0) / pings.length;
    // Jitter = average absolute difference between consecutive pings
    let jitter = 0;
    if (pings.length > 1) {
      let diffs = 0;
      for (let i = 1; i < pings.length; i++) {
        diffs += Math.abs(pings[i] - pings[i - 1]);
      }
      jitter = diffs / (pings.length - 1);
    }

    setResults(prev => ({
      ...prev,
      ping: Math.round(avgPing),
      jitter: Math.round(jitter * 10) / 10,
    }));
    setProgress(100);
    setStatus('Test complete');
    setDone(true);
    setTesting(false);
  }

  const grade = done ? getGrade(results.download, results.upload, results.ping) : null;

  return (
    <div className="app-shell">
      {/* Top Ad Banner — full width */}
      <AdBanner placement="top" />

      <header className="header">
        <h1>Speed<span>Pulse</span></h1>
        <p>Test your internet speed in seconds</p>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="mobile-tabs">
        <button
          className={`mobile-tab ${mobileTab === 'speed' ? 'active' : ''}`}
          onClick={() => setMobileTab('speed')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          Speed Test
        </button>
        <button
          className={`mobile-tab ${mobileTab === 'games' ? 'active' : ''}`}
          onClick={() => setMobileTab('games')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4M8 10v4"/><circle cx="15" cy="11" r="1"/><circle cx="18" cy="14" r="1"/></svg>
          Games
        </button>
      </div>

      {/* Main split layout */}
      <div className="split-layout">
        {/* Left panel — Speed Test */}
        <div className={`panel panel-left ${mobileTab !== 'speed' ? 'mobile-hidden' : ''}`}>
          <button className="start-btn" onClick={runTest} disabled={testing}>
            {testing ? 'Testing...' : done ? 'Run Again' : 'Start Speed Test'}
          </button>

          {/* Progress */}
          {testing && (
            <>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="status-text">{status}</div>
            </>
          )}

          {/* Results */}
          <div className="results-grid">
            <div className="result-card">
              <div className="label">Download</div>
              <div className="value">{results.download !== null ? dlDisplay.toFixed(1) : '—'}</div>
              <div className="unit">Mbps</div>
            </div>
            <div className="result-card">
              <div className="label">Upload</div>
              <div className="value">{results.upload !== null ? ulDisplay.toFixed(1) : '—'}</div>
              <div className="unit">Mbps</div>
            </div>
            <div className="result-card">
              <div className="label">Ping</div>
              <div className="value">{results.ping !== null ? Math.round(pingDisplay) : '—'}</div>
              <div className="unit">ms</div>
            </div>
            <div className="result-card">
              <div className="label">Jitter</div>
              <div className="value">{results.jitter !== null ? jitterDisplay.toFixed(1) : '—'}</div>
              <div className="unit">ms</div>
            </div>
          </div>

          {/* Grade */}
          {done && grade && (
            <div className="grade-container">
              <div className={`grade-badge grade-${grade}`}>{grade}</div>
              <div className="grade-label">Overall Connection Grade</div>
            </div>
          )}

          {/* Mid-Content Ad */}
          <AdBanner placement="mid" />
        </div>

        {/* Right panel — Game Arcade */}
        <div className={`panel panel-right ${mobileTab !== 'games' ? 'mobile-hidden' : ''}`}>
          <GameArcade />
        </div>
      </div>

      {/* Advertiser CTA — full width */}
      <div className="advertiser-cta">
        <p>Want to reach thousands of speed-test users?</p>
        <button onClick={() => setShowModal(true)}>Advertise With Us</button>
      </div>

      {/* Advertiser Modal */}
      {showModal && <AdvertiserModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
