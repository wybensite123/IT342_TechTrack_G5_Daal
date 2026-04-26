import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAssets } from '../api/assetApi';
import logo from '../assets/TechTrack.png';
import './LandingPage.css';

const LandingPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, available: 0, loaded: false });
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Only fetch live stats for signed-in users — anon calls trigger the
    // auth interceptor, which would redirect to /login.
    if (!user) {
      setStats(s => ({ ...s, loaded: true }));
      return;
    }
    getAssets(0, 1)
      .then(res => setStats(s => ({ ...s, total: res.totalElements, loaded: true })))
      .catch(() => setStats(s => ({ ...s, loaded: true })));

    getAssets(0, 1, 'AVAILABLE')
      .then(res => setStats(s => ({ ...s, available: res.totalElements })))
      .catch(() => {});
  }, [user]);

  // Scroll-driven UI: shrunk nav, progress bar, back-to-top
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const h = document.documentElement.scrollHeight - window.innerHeight;
        setScrolled(y > 24);
        setShowTop(y > 600);
        setProgress(h > 0 ? Math.min(100, (y / h) * 100) : 0);
        raf = 0;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Reveal-on-scroll for any [data-reveal] element
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    setNavOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="landing">
      {/* Scroll progress bar */}
      <div className="scroll-progress" style={{ width: `${progress}%` }} />

      {/* Navigation */}
      <nav className={`landing-nav ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="landing-container nav-inner">
          <a href="#top" className="nav-brand" onClick={(e) => { e.preventDefault(); scrollToTop(); }}>
            <img src={logo} alt="TechTrack" className="nav-logo" />
            <span className="nav-title">TechTrack</span>
          </a>

          <button
            className="nav-toggle"
            aria-label="Toggle menu"
            onClick={() => setNavOpen(o => !o)}
          >
            <span /><span /><span />
          </button>

          <div className={`nav-links ${navOpen ? 'open' : ''}`}>
            <a href="#features" onClick={scrollTo('features')}>Features</a>
            <a href="#how" onClick={scrollTo('how')}>How it works</a>
            <a href="#roles" onClick={scrollTo('roles')}>For you</a>
            <a href="#stack" onClick={scrollTo('stack')}>Tech</a>
            {user ? (
              <Link to="/dashboard" className="btn btn-primary">Open Dashboard →</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">Sign In</Link>
                <Link to="/register" className="btn btn-primary">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header id="top" className="hero">
        <div className="landing-container hero-grid">
          <div className="hero-copy" data-reveal>
            <span className="eyebrow">Inventory · Loans · Accountability</span>
            <h1 className="hero-title">
              Track every asset.<br />
              <span className="accent">Loan with confidence.</span>
            </h1>
            <p className="hero-sub">
              TechTrack is a modern asset and equipment management platform built for
              schools, labs, and IT teams. Catalogue gear, approve loans in seconds,
              and always know who has what.
            </p>

            <div className="hero-cta">
              {user ? (
                <Link to="/dashboard" className="btn btn-primary btn-lg">
                  Go to Dashboard →
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg">
                    Get Started Free →
                  </Link>
                  <Link to="/login" className="btn btn-ghost btn-lg">
                    Sign In
                  </Link>
                </>
              )}
            </div>

            <div className="hero-stats">
              <div className="stat">
                <div className="stat-value">
                  {user && stats.loaded ? stats.total.toLocaleString() : '∞'}
                </div>
                <div className="stat-label">Assets tracked</div>
              </div>
              <div className="stat">
                <div className="stat-value">
                  {user && stats.loaded ? stats.available.toLocaleString() : '⚡'}
                </div>
                <div className="stat-label">{user ? 'Available now' : 'Real-time'}</div>
              </div>
              <div className="stat">
                <div className="stat-value">24/7</div>
                <div className="stat-label">Web &amp; Mobile</div>
              </div>
            </div>
          </div>

          <div className="hero-art" data-reveal>
            <div className="hero-card hero-card-pop">
              <img src={logo} alt="TechTrack logo" className="hero-logo" />
              <div className="hero-card-meta">
                <div className="dot dot-green" />
                <span>System online</span>
              </div>
              <div className="hero-card-rows">
                <div className="row">
                  <span>Laptop · Lenovo X1</span><span className="pill green">Available</span>
                </div>
                <div className="row">
                  <span>Camera · Canon R5</span><span className="pill amber">On loan</span>
                </div>
                <div className="row">
                  <span>Projector · Epson L1</span><span className="pill green">Available</span>
                </div>
                <div className="row">
                  <span>Tablet · iPad Pro 12.9</span><span className="pill blue">Reserved</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll-down indicator */}
        <button
          type="button"
          className={`scroll-down-hint ${scrolled ? 'fade' : ''}`}
          onClick={scrollTo('features')}
          aria-label="Scroll down"
        >
          <span className="hint-label">Scroll</span>
          <span className="hint-arrow" />
        </button>
      </header>

      {/* Features */}
      <section id="features" className="section">
        <div className="landing-container">
          <h2 className="section-title" data-reveal>Everything you need to manage gear</h2>
          <p className="section-sub" data-reveal>
            From a single laptop to a campus-wide inventory — TechTrack scales with you.
          </p>

          <div className="features-grid" data-reveal>
            <Feature
              icon="📦"
              title="Asset catalogue"
              text="Tag, categorise, and photograph every device. Search by name, serial, or asset tag in milliseconds."
            />
            <Feature
              icon="🔁"
              title="Loan workflow"
              text="Users request, admins approve. Every loan has a clear status, due date, and audit trail."
            />
            <Feature
              icon="🛡️"
              title="Role-based access"
              text="Admins manage the catalogue. Users borrow what they need. Permissions enforced server-side."
            />
            <Feature
              icon="📱"
              title="Mobile companion"
              text="Native Android app for users on the go — request loans and check availability from your pocket."
            />
            <Feature
              icon="⚡"
              title="Real-time status"
              text="Available, on-loan, reserved, retired — the live state of every asset, always one click away."
            />
            <Feature
              icon="🔒"
              title="Secure by design"
              text="HttpOnly refresh tokens, JWT access tokens, and bcrypt-hashed passwords protect every account."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="section section-alt">
        <div className="landing-container">
          <h2 className="section-title" data-reveal>How it works</h2>
          <p className="section-sub" data-reveal>Three steps from sign-up to loaned-out.</p>

          <div className="steps" data-reveal>
            <Step n="1" title="Register your team">
              Create an account, invite teammates, and assign admin roles to the people
              who manage the catalogue.
            </Step>
            <Step n="2" title="Catalogue your assets">
              Add devices with name, category, serial number, and photos. Bulk import
              supported via the admin console.
            </Step>
            <Step n="3" title="Loan with confidence">
              Users request — admins approve. Status updates flow to web and mobile in
              real time.
            </Step>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="section">
        <div className="landing-container">
          <h2 className="section-title" data-reveal>Built for everyone in the loop</h2>
          <div className="roles-grid" data-reveal>
            <div className="role-card">
              <div className="role-badge admin">Admin</div>
              <h3>Full control of the catalogue</h3>
              <ul>
                <li>Create, edit, retire assets</li>
                <li>Approve or reject loan requests</li>
                <li>Track every loan from request to return</li>
                <li>Manage user roles and access</li>
              </ul>
            </div>
            <div className="role-card">
              <div className="role-badge user">User</div>
              <h3>Borrow gear in seconds</h3>
              <ul>
                <li>Browse the live catalogue</li>
                <li>Request a loan with one tap</li>
                <li>See your active and past loans</li>
                <li>Use the web or Android app</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section id="stack" className="section section-alt">
        <div className="landing-container">
          <h2 className="section-title" data-reveal>Modern stack, production ready</h2>
          <p className="section-sub" data-reveal>
            Built on proven technologies trusted by teams worldwide.
          </p>
          <div className="stack-grid" data-reveal>
            <div className="stack-item"><strong>React</strong><span>Web frontend</span></div>
            <div className="stack-item"><strong>Vite</strong><span>Lightning build</span></div>
            <div className="stack-item"><strong>Spring Boot</strong><span>REST backend</span></div>
            <div className="stack-item"><strong>PostgreSQL</strong><span>Relational store</span></div>
            <div className="stack-item"><strong>JWT</strong><span>Stateless auth</span></div>
            <div className="stack-item"><strong>Kotlin</strong><span>Android client</span></div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="landing-container cta-inner" data-reveal>
          <h2>Ready to take control of your inventory?</h2>
          <p>Free to start. Your team will thank you.</p>
          <div className="cta-buttons">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">Open Dashboard →</Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">Create your account</Link>
                <Link to="/login" className="btn btn-ghost btn-lg">I already have an account</Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="landing-container footer-inner">
          <div className="footer-brand">
            <img src={logo} alt="TechTrack" className="footer-logo" />
            <div>
              <div className="footer-title">TechTrack</div>
              <div className="footer-tag">Asset & loan management, simplified.</div>
            </div>
          </div>
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#roles">Roles</a>
            <a href="#stack">Tech</a>
          </div>
          <div className="footer-copy">
            © {new Date().getFullYear()} TechTrack · IT342 G5
          </div>
        </div>
      </footer>

      {/* Back to top */}
      <button
        type="button"
        className={`to-top ${showTop ? 'visible' : ''}`}
        aria-label="Back to top"
        onClick={scrollToTop}
      >
        ↑
      </button>
    </div>
  );
};

const Feature = ({ icon, title, text }) => (
  <div className="feature">
    <div className="feature-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{text}</p>
  </div>
);

const Step = ({ n, title, children }) => (
  <div className="step">
    <div className="step-num">{n}</div>
    <h3>{title}</h3>
    <p>{children}</p>
  </div>
);

export default LandingPage;
