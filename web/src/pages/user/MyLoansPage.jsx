import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/shared.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { getMyLoans, returnLoan } from '../../api/loanApi';

const STATUS_LABEL = {
  PENDING_APPROVAL: 'Pending',
  ON_LOAN: 'On Loan',
  RETURNED: 'Returned',
  REJECTED: 'Rejected',
};
const STATUS_CLASS = {
  PENDING_APPROVAL: 'badge-pending',
  ON_LOAN: 'badge-loan',
  RETURNED: 'badge-returned',
  REJECTED: 'badge-rejected',
};

function Toast({ msg, type, onClose }) {
  if (!msg) return null;
  return (
    <div className={`toast toast-${type}`} onClick={onClose}>
      {msg}
    </div>
  );
}

export default function MyLoansPage() {
  const { user, logout } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState('active');
  const [returnModal, setReturnModal] = useState(null);
  const [condition, setCondition] = useState('GOOD');
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(0);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const { data: loanPage, isLoading } = useQuery({
    queryKey: ['my-loans', page],
    queryFn: () => getMyLoans(page, 20),
  });

  const loans = loanPage?.content ?? [];
  const active = loans.filter(l => l.status === 'PENDING_APPROVAL' || l.status === 'ON_LOAN');
  const past = loans.filter(l => l.status === 'RETURNED' || l.status === 'REJECTED');
  const displayed = tab === 'active' ? active : past;

  const returnMut = useMutation({
    mutationFn: ({ id, cond }) => returnLoan(id, cond),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-loans'] });
      setReturnModal(null);
      showToast('Asset returned successfully!');
    },
    onError: (err) => {
      showToast(err?.response?.data?.message ?? 'Return failed.', 'error');
    },
  });

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <>
    <main className="main-content">
        <Toast msg={toast?.msg} type={toast?.type} onClose={() => setToast(null)} />

        <header className="page-header">
          <div>
            <h1 className="page-title">My Loans</h1>
            <p className="page-subtitle">Track your borrowed equipment</p>
          </div>
        </header>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab-btn ${tab === 'active' ? 'tab-active' : ''}`}
            onClick={() => setTab('active')}
          >
            Active
            {active.length > 0 && <span className="tab-badge">{active.length}</span>}
          </button>
          <button
            className={`tab-btn ${tab === 'past' ? 'tab-active' : ''}`}
            onClick={() => setTab('past')}
          >
            Past
            {past.length > 0 && <span className="tab-badge tab-badge-muted">{past.length}</span>}
          </button>
        </div>

        {/* Loan Cards */}
        {isLoading ? (
          <div className="skeleton-list">
            {[1, 2, 3].map(i => <div key={i} className="skeleton-card" />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon">{tab === 'active' ? '📭' : '🗂️'}</p>
            <p className="empty-text">No {tab} loans</p>
            {tab === 'active' && (
              <Link to="/dashboard" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                Browse Assets
              </Link>
            )}
          </div>
        ) : (
          <div className="loan-list">
            {displayed.map(loan => (
              <div key={loan.id} className="loan-card">
                <div className="loan-card-header">
                  <div>
                    <h3 className="loan-asset-name">{loan.asset.name}</h3>
                    <p className="loan-asset-tag">{loan.asset.assetTag} · {loan.asset.category}</p>
                  </div>
                  <span className={`status-badge ${STATUS_CLASS[loan.status]}`}>
                    {STATUS_LABEL[loan.status]}
                  </span>
                </div>

                <div className="loan-card-body">
                  <div className="loan-detail">
                    <span className="detail-label">Purpose</span>
                    <span className="detail-value">{loan.purpose}</span>
                  </div>
                  <div className="loan-detail">
                    <span className="detail-label">Requested</span>
                    <span className="detail-value">{new Date(loan.requestedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="loan-detail">
                    <span className="detail-label">Due Date</span>
                    <span className="detail-value">{new Date(loan.requestedReturnDate).toLocaleDateString()}</span>
                  </div>
                  {loan.approvedAt && (
                    <div className="loan-detail">
                      <span className="detail-label">Approved</span>
                      <span className="detail-value">{new Date(loan.approvedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  {loan.actualReturnDate && (
                    <div className="loan-detail">
                      <span className="detail-label">Returned</span>
                      <span className="detail-value">{new Date(loan.actualReturnDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {loan.conditionOnReturn && (
                    <div className="loan-detail">
                      <span className="detail-label">Condition</span>
                      <span className={`detail-value ${loan.conditionOnReturn === 'DAMAGED' ? 'text-danger' : 'text-success'}`}>
                        {loan.conditionOnReturn}
                      </span>
                    </div>
                  )}
                  {loan.rejectionReason && (
                    <div className="loan-detail loan-detail-full">
                      <span className="detail-label">Rejection Reason</span>
                      <span className="detail-value text-danger">{loan.rejectionReason}</span>
                    </div>
                  )}
                </div>

                {loan.status === 'ON_LOAN' && (
                  <div className="loan-card-footer">
                    <button
                      className="btn-primary btn-sm"
                      onClick={() => { setReturnModal(loan); setCondition('GOOD'); }}
                    >
                      Return Asset
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {(loanPage?.totalPages ?? 0) > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span className="page-info">Page {page + 1} of {loanPage.totalPages}</span>
            <button className="page-btn" disabled={loanPage.last} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </main>

      {/* Return Modal */}
      {returnModal && (
        <div className="modal-backdrop" onClick={() => setReturnModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Return Asset</h2>
            <p className="modal-subtitle">Returning: <strong>{returnModal.asset.name}</strong></p>

            <div className="form-group">
              <label className="form-label">Condition on Return</label>
              <div className="radio-group">
                <label className={`radio-option ${condition === 'GOOD' ? 'radio-selected' : ''}`}>
                  <input type="radio" name="condition" value="GOOD" checked={condition === 'GOOD'} onChange={() => setCondition('GOOD')} />
                  ✅ Good
                </label>
                <label className={`radio-option ${condition === 'DAMAGED' ? 'radio-selected radio-danger' : ''}`}>
                  <input type="radio" name="condition" value="DAMAGED" checked={condition === 'DAMAGED'} onChange={() => setCondition('DAMAGED')} />
                  ⚠️ Damaged
                </label>
              </div>
              {condition === 'DAMAGED' && (
                <p className="form-hint text-danger">Asset will be marked for maintenance.</p>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setReturnModal(null)}>Cancel</button>
              <button
                className={`btn-primary ${condition === 'DAMAGED' ? 'btn-danger' : ''}`}
                disabled={returnMut.isPending}
                onClick={() => returnMut.mutate({ id: returnModal.id, cond: condition })}
              >
                {returnMut.isPending ? 'Returning…' : 'Confirm Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
