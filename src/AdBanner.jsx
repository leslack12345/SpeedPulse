import { useState, useEffect } from 'react';

function safeUrl(url) {
  if (!url) return '#';
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return url;
  } catch {}
  return '#';
}

/**
 * AdBanner — Fetches approved ads from the backend and renders them.
 * Props:
 *   placement — "top" or "mid" to match the ad placement slot.
 */
export default function AdBanner({ placement }) {
  const [ad, setAd] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/get-ads')
      .then(res => res.json())
      .then(ads => {
        // Find an ad matching this placement, fall back to any ad
        const match = ads.find(a => a.placement === placement) || null;
        setAd(match);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [placement]);

  if (!loaded) return null;

  if (!ad) {
    return (
      <div className="ad-placeholder">
        Your ad could be here — <strong>advertise with us</strong>
      </div>
    );
  }

  return (
    <a
      className="ad-banner"
      href={safeUrl(ad.cta_url)}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <span className="ad-label">AD</span>
      <div className="ad-headline">{ad.headline}</div>
      <div className="ad-description">{ad.description}</div>
      {ad.cta_text && <span className="ad-cta">{ad.cta_text} &rarr;</span>}
    </a>
  );
}
