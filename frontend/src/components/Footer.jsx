import { useState } from 'react';
import { Link } from 'react-router-dom';
import Tooltip from './Tooltip';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleNewsletterSubmit = (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter a valid email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setSuccess('Thanks for subscribing!');
    setEmail('');
  };

  return (
  <footer className="footer">
    <div className="container footer__inner">
      <div className="footer__brand">
        <Tooltip content="The Lighthouse - Fine Dining Restaurant" position="top">
          <span className="footer__logo">🌊 The Lighthouse</span>
        </Tooltip>
        <p className="footer__tagline">Fine Dining. Reimagined.</p>
        
        <div className="footer__socials">
          <Tooltip content="Follow us on Instagram" position="top">
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
          </Tooltip>
          <Tooltip content="Follow us on Facebook" position="top">
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label="Facebook">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 0-1-1h3z" />
              </svg>
            </a>
          </Tooltip>
          <Tooltip content="Follow us on X (formerly Twitter)" position="top">
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label="X">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4l16 16M20 4L4 20" />
              </svg>
            </a>
          </Tooltip>
        </div>
      </div>

      <div className="footer__links">
        <Tooltip content="View our full menu" position="top">
          <Link to="/menu">Menu</Link>
        </Tooltip>
        <Tooltip content="Reserve your table" position="top">
          <Link to="/reserve">Reserve Table</Link>
        </Tooltip>
        <Tooltip content="Sign in to your account" position="top">
          <Link to="/auth">Sign In</Link>
        </Tooltip>
      </div>

      <div className="footer__info">
        <Tooltip content="Visit us at Marine Drive, Mumbai" position="top">
          <p>📍 12, Marine Drive, Mumbai, 400001</p>
        </Tooltip>
        <Tooltip content="Call us for reservations and inquiries" position="top">
          <p>📞 +91 98765 43210</p>
        </Tooltip>
        <Tooltip content="Open 7 days a week, 7 AM to 11 PM" position="top">
          <p>⏰ Mon–Sun · 7 AM – 11 PM</p>
        </Tooltip>

        <form className="footer__newsletter" onSubmit={handleNewsletterSubmit} noValidate>
          <label htmlFor="newsletter-email" className="footer__newsletter-label">Join our newsletter</label>
          <div className="footer__newsletter-row">
            <input
              id="newsletter-email"
              type="email"
              required
              className="footer__newsletter-input"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError('');
                if (success) setSuccess('');
              }}
            />
            <button type="submit" className="footer__newsletter-button">Subscribe</button>
          </div>
          {error && <p className="footer__newsletter-error">{error}</p>}
          {success && <p className="footer__newsletter-success">{success}</p>}
        </form>
      </div>
    </div>

    <div className="footer__bottom">
      <p>© {new Date().getFullYear()} The Lighthouse. All rights reserved.</p>
    </div>

    <style>{`
      .footer {
        background: var(--color-bg-elevated);
        border-top: 1px solid var(--color-border);
        padding: var(--space-2xl) 0 0;
        margin-top: auto;
      }
      .footer__inner {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: var(--space-xl);
        padding-bottom: var(--space-xl);
      }
      .footer__logo {
        font-family: var(--font-serif);
        font-size: 1.4rem;
        color: var(--color-primary);
      }
      .footer__tagline {
        font-size: 0.8rem;
        color: var(--color-text-faint);
        margin-top: 0.25rem;
        letter-spacing: 0.08em;
      }
      .footer__socials {
        display: flex;
        gap: 0.75rem;
        margin-top: 1.2rem;
      }
      .footer__social-link {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: 1px solid var(--color-border);
        color: var(--color-text-muted);
        transition: all var(--transition);
      }
      .footer__social-link:hover {
        color: var(--color-primary);
        border-color: var(--color-border-hover);
        background: rgba(201, 169, 98, 0.08);
        transform: translateY(-2px);
      }
      .footer__social-link svg {
        width: 16px;
        height: 16px;
      }
      .footer__links {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .footer__links a {
        font-size: 0.85rem;
        color: var(--color-text-muted);
        transition: color var(--transition);
        letter-spacing: 0.05em;
      }
      .footer__links a:hover { color: var(--color-primary); }
      .footer__info p {
        font-size: 0.82rem;
        color: var(--color-text-muted);
        margin-bottom: 0.4rem;
      }
      .footer__newsletter {
        margin-top: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .footer__newsletter-label {
        font-size: 0.8rem;
        color: var(--color-text-muted);
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .footer__newsletter-row {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .footer__newsletter-input {
        flex: 1 1 180px;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        background: var(--color-bg);
        color: var(--color-text);
        padding: 0.7rem 0.8rem;
        font-size: 0.9rem;
      }
      .footer__newsletter-button {
        border: none;
        border-radius: var(--radius-sm);
        background: var(--color-primary);
        color: var(--color-bg);
        padding: 0.7rem 0.95rem;
        cursor: pointer;
        font-weight: 600;
      }
      .footer__newsletter-error {
        font-size: 0.8rem;
        color: #f87171;
      }
      .footer__newsletter-success {
        font-size: 0.8rem;
        color: #4ade80;
      }
      .footer__bottom {
        border-top: 1px solid var(--color-border);
        padding: var(--space-md) 0;
        text-align: center;
      }
      .footer__bottom p {
        font-size: 0.75rem;
        color: var(--color-text-faint);
        letter-spacing: 0.05em;
      }
      @media (max-width: 768px) {
        .footer__inner { grid-template-columns: 1fr; gap: var(--space-lg); }
      }
    `}</style>
  </footer>
  );
};

export default Footer;
