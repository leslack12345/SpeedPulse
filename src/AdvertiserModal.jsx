import { useState } from 'react';

const TIERS = [
  { id: 'starter', name: 'Starter', price: 49, desc: 'Top banner ad placement' },
  { id: 'mid-content', name: 'Mid-Content', price: 79, desc: 'In-content ad slot' },
  { id: 'pro', name: 'Pro', price: 129, desc: 'Both placements + priority' },
];

/**
 * AdvertiserModal — Pricing tiers + submission form for advertisers.
 * Props:
 *   onClose — callback to close the modal.
 */
export default function AdvertiserModal({ onClose }) {
  const [selectedTier, setSelectedTier] = useState(null);
  const [form, setForm] = useState({
    business_name: '',
    contact_name: '',
    email: '',
    website: '',
    headline: '',
    description: '',
  });
  const [honeypot, setHoneypot] = useState('');
  const [loadedAt] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedTier) return;

    // Bot detection: honeypot filled or submitted too fast (under 3 seconds)
    if (honeypot || Date.now() - loadedAt < 3000) {
      setSubmitted(true); // Fake success so bot thinks it worked
      return;
    }

    setSubmitting(true);
    try {
      const resp = await fetch('/api/submit-advertiser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, package: selectedTier }),
      });
      if (resp.ok) {
        setSubmitted(true);
      }
    } catch {
      // Silently fail — user sees no change
    }
    setSubmitting(false);
  }

  // Click on overlay background to close
  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  if (submitted) {
    return (
      <div className="modal-overlay" onClick={handleOverlayClick}>
        <div className="modal">
          <div className="success-message">
            <div className="checkmark">&#10003;</div>
            <h3>Application Submitted!</h3>
            <p>We&apos;ll review your ad and get back to you within 24 hours.</p>
            <button className="submit-btn" onClick={onClose} style={{ marginTop: '1.5rem' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <h2>Advertise on SpeedPulse</h2>
        <p className="subtitle">Reach thousands of users testing their internet speed daily.</p>

        {/* Pricing Tiers */}
        <div className="pricing-tiers">
          {TIERS.map(tier => (
            <div
              key={tier.id}
              className={`tier-card ${selectedTier === tier.id ? 'selected' : ''}`}
              onClick={() => setSelectedTier(tier.id)}
            >
              <div className="tier-name">{tier.name}</div>
              <div className="tier-price">${tier.price}</div>
              <div className="tier-freq">/month</div>
              <div className="tier-desc">{tier.desc}</div>
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Business Name</label>
            <input
              required
              value={form.business_name}
              onChange={e => update('business_name', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Contact Name</label>
            <input
              required
              value={form.contact_name}
              onChange={e => update('contact_name', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => update('email', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Website</label>
            <input
              placeholder="yoursite.com"
              value={form.website}
              onChange={e => update('website', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Ad Headline</label>
            <input
              required
              maxLength={60}
              value={form.headline}
              onChange={e => update('headline', e.target.value)}
            />
            <div className="char-count">{form.headline.length}/60</div>
          </div>
          <div className="form-group">
            <label>Ad Description</label>
            <textarea
              required
              maxLength={120}
              value={form.description}
              onChange={e => update('description', e.target.value)}
            />
            <div className="char-count">{form.description.length}/120</div>
          </div>

          {/* Honeypot — invisible to users, bots auto-fill it */}
          <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
            <label>Company URL</label>
            <input
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={e => setHoneypot(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={!selectedTier || submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}
