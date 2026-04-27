import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyWatchlist, removeFromWatchlist } from '../../api/watchlistApi';
import { submitLoan } from '../../api/loanApi';
import '../../styles/shared.css';
import './WatchlistPage.css';

const STATUS_LABEL = {
  AVAILABLE: 'Available',
  PENDING_APPROVAL: 'Pending',
  ON_LOAN: 'On Loan',
  UNDER_MAINTENANCE: 'Maintenance',
  RETIRED: 'Retired',
};
const STATUS_CSS = {
  AVAILABLE: 'available',
  PENDING_APPROVAL: 'pending',
  ON_LOAN: 'on-loan',
  UNDER_MAINTENANCE: 'maintenance',
  RETIRED: 'maintenance',
};

const IconHeart = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 24 24"
       fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

function Toast({ msg, type, onClose }) {
  if (!msg) return null;
  return <div className={`toast toast-${type}`} onClick={onClose}>{msg}</div>;
}

export default function WatchlistPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [purpose, setPurpose] = useState('');
  const [retDate, setRetDate] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: pageData, isLoading, isError } = useQuery({
    queryKey: ['watchlist', page],
    queryFn: () => getMyWatchlist(page, 20),
  });

  const items = pageData?.content ?? [];

  const removeMut = useMutation({
    mutationFn: (assetId) => removeFromWatchlist(assetId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlist'] });
      showToast('Removed from Watchlist', 'info');
    },
    onError: (e) => showToast(e?.response?.data?.error?.message ?? 'Could not remove', 'error'),
  });

  const loanMut = useMutation({
    mutationFn: (payload) => submitLoan(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlist'] });
      qc.invalidateQueries({ queryKey: ['my-loans'] });
      setModal(null);
      setPurpose('');
      setRetDate('');
      showToast('Loan request submitted!', 'success');
    },
    onError: (e) => showToast(e?.response?.data?.error?.message ?? 'Loan request failed', 'error'),
  });

  const submitLoanForm = (e) => {
    e.preventDefault();
    if (!modal) return;
    if (!purpose.trim()) { showToast('Please describe the purpose', 'error'); return; }
    if (!retDate)        { showToast('Please pick a return date', 'error'); return; }
    loanMut.mutate({
      assetId: modal.id,
      purpose: purpose.trim(),
      requestedReturnDate: retDate,
    });
  };

  return (
    <main className="main-content">
      <Toast msg={toast?.msg} type={toast?.type} onClose={() => setToast(null)} />

      <header className="page-header">
        <div>
          <h1 className="page-title">My Watchlist</h1>
          <p className="page-subtitle">Assets you've saved for later</p>
        </div>
      </header>

      {isLoading ? (
        <div className="skeleton-list">
          {[1, 2, 3].map(i => <div key={i} className="skeleton-card" />)}
        </div>
      ) : isError ? (
        <div className="empty-state">
          <p className="empty-icon">⚠️</p>
          <p className="empty-text">Could not load your watchlist.</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon">♡</p>
          <p className="empty-text">No assets saved yet.</p>
          <Link to="/dashboard" className="btn-primary"
                style={{ marginTop: '1rem', display: 'inline-block' }}>
            Browse Assets
          </Link>
        </div>
      ) : (
        <div className="wl-grid">
          {items.map(asset => {
            const isAvail = asset.status === 'AVAILABLE';
            return (
              <div key={asset.id} className="wl-card">
                <div className="wl-head">
                  <div>
                    <div className="wl-category">{asset.category}</div>
                    <div className="wl-name">{asset.name}</div>
                    <div className="wl-tag">{asset.assetTag}</div>
                  </div>
                  <span className={`wl-status wl-status-${STATUS_CSS[asset.status] ?? 'maintenance'}`}>
                    {STATUS_LABEL[asset.status] ?? asset.status}
                  </span>
                </div>

                {asset.description && (
                  <p className="wl-desc">{asset.description}</p>
                )}

                <div className="wl-footer">
                  <button
                    className="btn-primary btn-sm"
                    disabled={!isAvail}
                    onClick={() => isAvail && setModal(asset)}
                  >
                    {isAvail ? 'Request Loan' : (STATUS_LABEL[asset.status] ?? asset.status)}
                  </button>
                  <button
                    className="wl-remove"
                    title="Remove from watchlist"
                    disabled={removeMut.isPending}
                    onClick={() => removeMut.mutate(asset.id)}
                  >
                    <IconHeart filled />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(pageData?.totalPages ?? 0) > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="page-info">Page {page + 1} of {pageData.totalPages}</span>
          <button className="page-btn" disabled={pageData.last}
                  onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <form className="modal" onClick={e => e.stopPropagation()} onSubmit={submitLoanForm}>
            <h2 className="modal-title">Request Loan</h2>
            <p className="modal-subtitle">For: <strong>{modal.name}</strong></p>

            <div className="form-group">
              <label className="form-label">Purpose</label>
              <textarea
                className="form-input"
                rows={3}
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="What will you use this asset for?"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Expected return date</label>
              <input
                className="form-input"
                type="date"
                value={retDate}
                onChange={e => setRetDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary"
                      onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="btn-primary"
                      disabled={loanMut.isPending}>
                {loanMut.isPending ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
