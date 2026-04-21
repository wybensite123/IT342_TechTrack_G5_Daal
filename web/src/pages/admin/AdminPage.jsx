import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/shared.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { getAllLoans, approveLoan, rejectLoan, returnLoan } from '../../api/loanApi';
import { getAssets, createAsset, updateAsset, retireAsset } from '../../api/assetApi';

const LOAN_STATUS_LABEL = { PENDING_APPROVAL: 'Pending', ON_LOAN: 'On Loan', RETURNED: 'Returned', REJECTED: 'Rejected' };
const LOAN_STATUS_CLASS = { PENDING_APPROVAL: 'badge-pending', ON_LOAN: 'badge-loan', RETURNED: 'badge-returned', REJECTED: 'badge-rejected' };
const ASSET_STATUS_CLASS = { AVAILABLE: 'badge-available', ON_LOAN: 'badge-loan', PENDING_APPROVAL: 'badge-pending', UNDER_MAINTENANCE: 'badge-maintenance', RETIRED: 'badge-retired' };

function Toast({ msg, type, onClose }) {
  if (!msg) return null;
  return <div className={`toast toast-${type}`} onClick={onClose}>{msg}</div>;
}

export default function AdminPage() {
  const { user, logout } = useAuth();
  const qc = useQueryClient();
  const [section, setSection] = useState('loans');
  const [loanPage, setLoanPage] = useState(0);
  const [assetPage, setAssetPage] = useState(0);
  const [toast, setToast] = useState(null);

  // Loan modals
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [returnModal, setReturnModal] = useState(null);
  const [condition, setCondition] = useState('GOOD');

  // Asset modals
  const [assetModal, setAssetModal] = useState(null); // null | 'create' | asset-object (edit)
  const [assetForm, setAssetForm] = useState({ name: '', category: '', description: '', serialNumber: '', assetTag: '' });
  const [retireConfirm, setRetireConfirm] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Queries
  const { data: loansData, isLoading: loansLoading } = useQuery({
    queryKey: ['all-loans', loanPage],
    queryFn: () => getAllLoans(loanPage, 50),
  });
  const { data: assetsData, isLoading: assetsLoading } = useQuery({
    queryKey: ['admin-assets', assetPage],
    queryFn: () => getAssets(assetPage, 20),
  });

  // Loan mutations
  const approveMut = useMutation({
    mutationFn: approveLoan,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-loans'] }); showToast('Loan approved!'); },
    onError: (e) => showToast(e?.response?.data?.message ?? 'Approve failed.', 'error'),
  });
  const rejectMut = useMutation({
    mutationFn: ({ id, reason }) => rejectLoan(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-loans'] }); setRejectModal(null); showToast('Loan rejected.'); },
    onError: (e) => showToast(e?.response?.data?.message ?? 'Reject failed.', 'error'),
  });
  const returnMut = useMutation({
    mutationFn: ({ id, cond }) => returnLoan(id, cond),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-loans'] }); qc.invalidateQueries({ queryKey: ['admin-assets'] }); setReturnModal(null); showToast('Asset returned!'); },
    onError: (e) => showToast(e?.response?.data?.message ?? 'Return failed.', 'error'),
  });

  // Asset mutations
  const createMut = useMutation({
    mutationFn: createAsset,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-assets'] }); setAssetModal(null); showToast('Asset created!'); },
    onError: (e) => showToast(e?.response?.data?.message ?? 'Create failed.', 'error'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateAsset(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-assets'] }); setAssetModal(null); showToast('Asset updated!'); },
    onError: (e) => showToast(e?.response?.data?.message ?? 'Update failed.', 'error'),
  });
  const retireMut = useMutation({
    mutationFn: retireAsset,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-assets'] }); setRetireConfirm(null); showToast('Asset retired.'); },
    onError: (e) => showToast(e?.response?.data?.message ?? 'Retire failed.', 'error'),
  });

  const openCreateAsset = () => {
    setAssetForm({ name: '', category: '', description: '', serialNumber: '', assetTag: '' });
    setAssetModal('create');
  };
  const openEditAsset = (asset) => {
    setAssetForm({ name: asset.name, category: asset.category, description: asset.description ?? '', serialNumber: asset.serialNumber ?? '', assetTag: asset.assetTag });
    setAssetModal(asset);
  };
  const submitAsset = () => {
    const data = { name: assetForm.name.trim(), category: assetForm.category.trim(), assetTag: assetForm.assetTag.trim(), description: assetForm.description.trim() || undefined, serialNumber: assetForm.serialNumber.trim() || undefined };
    if (assetModal === 'create') createMut.mutate(data);
    else updateMut.mutate({ id: assetModal.id, data });
  };

  const loans = loansData?.content ?? [];
  const assets = assetsData?.content ?? [];
  const initials = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() : '?';

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">T</div>
          <span className="logo-text">TechTrack</span>
        </div>
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item">
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </Link>
          <Link to="/loans" className="nav-item">
            <span className="nav-icon">📋</span>
            <span>My Loans</span>
          </Link>
          <Link to="/admin" className="nav-item active">
            <span className="nav-icon">⚙️</span>
            <span>Admin Panel</span>
          </Link>
        </nav>
        <div className="sidebar-footer">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <p className="user-name">{user?.firstName} {user?.lastName}</p>
            <p className="user-role">Administrator</p>
          </div>
          <button className="logout-btn" onClick={logout} title="Logout">↩</button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <Toast msg={toast?.msg} type={toast?.type} onClose={() => setToast(null)} />

        <header className="page-header">
          <div>
            <h1 className="page-title">Admin Panel</h1>
            <p className="page-subtitle">Manage loans and assets</p>
          </div>
        </header>

        {/* Section Tabs */}
        <div className="tabs">
          <button className={`tab-btn ${section === 'loans' ? 'tab-active' : ''}`} onClick={() => setSection('loans')}>
            Loan Queue
            {loans.filter(l => l.status === 'PENDING_APPROVAL').length > 0 && (
              <span className="tab-badge">{loans.filter(l => l.status === 'PENDING_APPROVAL').length}</span>
            )}
          </button>
          <button className={`tab-btn ${section === 'assets' ? 'tab-active' : ''}`} onClick={() => setSection('assets')}>
            Assets
          </button>
        </div>

        {/* ── LOAN QUEUE ── */}
        {section === 'loans' && (
          <>
            {loansLoading ? (
              <div className="skeleton-list">{[1,2,3].map(i => <div key={i} className="skeleton-card" />)}</div>
            ) : loans.length === 0 ? (
              <div className="empty-state">
                <p className="empty-icon">📭</p>
                <p className="empty-text">No loans yet</p>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Borrower</th>
                      <th>Asset</th>
                      <th>Purpose</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map(loan => (
                      <tr key={loan.id}>
                        <td>
                          <div className="borrower-name">{loan.borrower.firstName} {loan.borrower.lastName}</div>
                          <div className="borrower-email">{loan.borrower.email}</div>
                        </td>
                        <td>
                          <div className="asset-name">{loan.asset.name}</div>
                          <div className="asset-tag">{loan.asset.assetTag}</div>
                        </td>
                        <td className="purpose-cell">{loan.purpose}</td>
                        <td>{new Date(loan.requestedReturnDate).toLocaleDateString()}</td>
                        <td><span className={`status-badge ${LOAN_STATUS_CLASS[loan.status]}`}>{LOAN_STATUS_LABEL[loan.status]}</span></td>
                        <td>
                          <div className="action-btns">
                            {loan.status === 'PENDING_APPROVAL' && (
                              <>
                                <button className="btn-xs btn-success" onClick={() => approveMut.mutate(loan.id)} disabled={approveMut.isPending}>Approve</button>
                                <button className="btn-xs btn-danger" onClick={() => { setRejectModal(loan); setRejectReason(''); }}>Reject</button>
                              </>
                            )}
                            {loan.status === 'ON_LOAN' && (
                              <button className="btn-xs btn-primary" onClick={() => { setReturnModal(loan); setCondition('GOOD'); }}>Return</button>
                            )}
                            {(loan.status === 'RETURNED' || loan.status === 'REJECTED') && (
                              <span className="text-muted text-sm">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {(loansData?.totalPages ?? 0) > 1 && (
              <div className="pagination">
                <button className="page-btn" disabled={loanPage === 0} onClick={() => setLoanPage(p => p - 1)}>← Prev</button>
                <span className="page-info">Page {loanPage + 1} of {loansData.totalPages}</span>
                <button className="page-btn" disabled={loansData.last} onClick={() => setLoanPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </>
        )}

        {/* ── ASSETS ── */}
        {section === 'assets' && (
          <>
            <div className="section-toolbar">
              <button className="btn-primary" onClick={openCreateAsset}>+ Add Asset</button>
            </div>
            {assetsLoading ? (
              <div className="skeleton-list">{[1,2,3].map(i => <div key={i} className="skeleton-card" />)}</div>
            ) : assets.length === 0 ? (
              <div className="empty-state">
                <p className="empty-icon">📦</p>
                <p className="empty-text">No assets yet</p>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Asset Tag</th>
                      <th>Serial No.</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map(asset => (
                      <tr key={asset.id}>
                        <td className="asset-name-cell">{asset.name}</td>
                        <td>{asset.category}</td>
                        <td><code className="mono">{asset.assetTag}</code></td>
                        <td>{asset.serialNumber ?? <span className="text-muted">—</span>}</td>
                        <td><span className={`status-badge ${ASSET_STATUS_CLASS[asset.status] ?? ''}`}>{asset.status.replace(/_/g, ' ')}</span></td>
                        <td>
                          <div className="action-btns">
                            <button className="btn-xs btn-secondary" onClick={() => openEditAsset(asset)}>Edit</button>
                            {asset.status !== 'RETIRED' && (
                              <button className="btn-xs btn-danger" onClick={() => setRetireConfirm(asset)}>Retire</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {(assetsData?.totalPages ?? 0) > 1 && (
              <div className="pagination">
                <button className="page-btn" disabled={assetPage === 0} onClick={() => setAssetPage(p => p - 1)}>← Prev</button>
                <span className="page-info">Page {assetPage + 1} of {assetsData.totalPages}</span>
                <button className="page-btn" disabled={assetsData.last} onClick={() => setAssetPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── REJECT MODAL ── */}
      {rejectModal && (
        <div className="modal-backdrop" onClick={() => setRejectModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Reject Loan</h2>
            <p className="modal-subtitle">Loan #{rejectModal.id} — {rejectModal.borrower.firstName} {rejectModal.borrower.lastName}</p>
            <div className="form-group">
              <label className="form-label">Rejection Reason <span className="required">*</span></label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Provide a reason for rejection..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setRejectModal(null)}>Cancel</button>
              <button
                className="btn-danger"
                disabled={!rejectReason.trim() || rejectMut.isPending}
                onClick={() => rejectMut.mutate({ id: rejectModal.id, reason: rejectReason.trim() })}
              >
                {rejectMut.isPending ? 'Rejecting…' : 'Reject Loan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RETURN MODAL (admin) ── */}
      {returnModal && (
        <div className="modal-backdrop" onClick={() => setReturnModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Process Return</h2>
            <p className="modal-subtitle">Asset: <strong>{returnModal.asset.name}</strong></p>
            <div className="form-group">
              <label className="form-label">Condition on Return</label>
              <div className="radio-group">
                <label className={`radio-option ${condition === 'GOOD' ? 'radio-selected' : ''}`}>
                  <input type="radio" name="cond" value="GOOD" checked={condition === 'GOOD'} onChange={() => setCondition('GOOD')} />
                  ✅ Good
                </label>
                <label className={`radio-option ${condition === 'DAMAGED' ? 'radio-selected radio-danger' : ''}`}>
                  <input type="radio" name="cond" value="DAMAGED" checked={condition === 'DAMAGED'} onChange={() => setCondition('DAMAGED')} />
                  ⚠️ Damaged
                </label>
              </div>
              {condition === 'DAMAGED' && <p className="form-hint text-danger">Asset will be sent for maintenance.</p>}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setReturnModal(null)}>Cancel</button>
              <button
                className={`btn-primary ${condition === 'DAMAGED' ? 'btn-danger' : ''}`}
                disabled={returnMut.isPending}
                onClick={() => returnMut.mutate({ id: returnModal.id, cond: condition })}
              >
                {returnMut.isPending ? 'Processing…' : 'Confirm Return'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ASSET CREATE / EDIT MODAL ── */}
      {assetModal && (
        <div className="modal-backdrop" onClick={() => setAssetModal(null)}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{assetModal === 'create' ? 'Add New Asset' : 'Edit Asset'}</h2>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Name <span className="required">*</span></label>
                <input className="form-input" value={assetForm.name} onChange={e => setAssetForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. MacBook Pro 14" />
              </div>
              <div className="form-group">
                <label className="form-label">Category <span className="required">*</span></label>
                <input className="form-input" value={assetForm.category} onChange={e => setAssetForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Laptop" />
              </div>
              <div className="form-group">
                <label className="form-label">Asset Tag <span className="required">*</span></label>
                <input className="form-input" value={assetForm.assetTag} onChange={e => setAssetForm(f => ({ ...f, assetTag: e.target.value }))} placeholder="e.g. ASSET-001" />
              </div>
              <div className="form-group">
                <label className="form-label">Serial Number</label>
                <input className="form-input" value={assetForm.serialNumber} onChange={e => setAssetForm(f => ({ ...f, serialNumber: e.target.value }))} placeholder="Optional" />
              </div>
              <div className="form-group form-group-full">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2} value={assetForm.description} onChange={e => setAssetForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setAssetModal(null)}>Cancel</button>
              <button
                className="btn-primary"
                disabled={!assetForm.name.trim() || !assetForm.category.trim() || !assetForm.assetTag.trim() || createMut.isPending || updateMut.isPending}
                onClick={submitAsset}
              >
                {(createMut.isPending || updateMut.isPending) ? 'Saving…' : assetModal === 'create' ? 'Create Asset' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RETIRE CONFIRM ── */}
      {retireConfirm && (
        <div className="modal-backdrop" onClick={() => setRetireConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Retire Asset</h2>
            <p className="modal-body-text">Are you sure you want to retire <strong>{retireConfirm.name}</strong>? This cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setRetireConfirm(null)}>Cancel</button>
              <button className="btn-danger" disabled={retireMut.isPending} onClick={() => retireMut.mutate(retireConfirm.id)}>
                {retireMut.isPending ? 'Retiring…' : 'Retire Asset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
