import { Component } from 'react';

/**
 * App-wide React error boundary.
 *
 * Catches render errors from any descendant and shows a friendly fallback
 * instead of an unrecoverable white screen. Async / event-handler errors
 * are NOT caught here — those are handled at the call site (try/catch,
 * react-query error states, etc).
 */
class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surface to the console so the issue is visible in dev tools.

    console.error('ErrorBoundary caught a render error:', error, info);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.assign('/');
  };

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div style={styles.shell}>
        <div style={styles.card}>
          <div style={styles.icon}>⚠️</div>
          <h1 style={styles.title}>Something went wrong</h1>
          <p style={styles.sub}>
            The page hit an unexpected error. You can try again, or head back to
            the home page.
          </p>
          <pre style={styles.err}>
            {error?.message || String(error)}
          </pre>
          <div style={styles.actions}>
            <button style={styles.btnPrimary} onClick={this.handleRetry}>
              Try again
            </button>
            <button style={styles.btnGhost} onClick={this.handleReload}>
              Go to home
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const styles = {
  shell: {
    minHeight: '100vh',
    background: '#1E293B',
    color: '#F1F5F9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    fontFamily: 'DM Sans, system-ui, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: 520,
    background: '#334155',
    border: '1px solid rgba(148,163,184,0.18)',
    borderRadius: 16,
    padding: '32px 28px',
    textAlign: 'center',
    boxShadow: '0 24px 56px rgba(0,0,0,0.4)',
  },
  icon: { fontSize: 40, marginBottom: 8 },
  title: {
    fontFamily: 'Rajdhani, sans-serif',
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 8,
  },
  sub: { color: '#94A3B8', fontSize: 14, marginBottom: 16, lineHeight: 1.5 },
  err: {
    background: 'rgba(239,68,68,0.10)',
    border: '1px solid rgba(239,68,68,0.25)',
    color: '#FCA5A5',
    fontSize: 12,
    padding: 10,
    borderRadius: 8,
    margin: '0 0 18px',
    overflow: 'auto',
    textAlign: 'left',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: 160,
  },
  actions: { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' },
  btnPrimary: {
    background: '#3B82F6',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnGhost: {
    background: 'transparent',
    color: '#F1F5F9',
    border: '1px solid rgba(148,163,184,0.3)',
    borderRadius: 10,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
};

export default ErrorBoundary;
