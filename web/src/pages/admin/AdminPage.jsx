import { useState, useRef } from 'react';
import '../../styles/shared.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { getAllLoans, approveLoan, rejectLoan, returnLoan, getAllLoanHistory } from '../../api/loanApi';
import { getAssets, createAsset, updateAsset, retireAsset, addAssetImage } from '../../api/assetApi';

const LOAN_STATUS_LABEL = { PENDING_APPROVAL: 'Pending', ON_LOAN: 'On Loan', RETURNED: 'Returned', REJECTED: 'Rejected' };
const LOAN_STATUS_CLASS = { PENDING_APPROVAL: 'badge-pending', ON_LOAN: 'badge-loan', RETURNED: 'badge-returned', REJECTED: 'badge-rejected' };
const ASSET_STATUS_CLASS = { AVAILABLE: 'badge-available', ON_LOAN: 'badge-loan', PENDING_APPROVAL: 'badge-pending', UNDER_MAINTENANCE: 'badge-maintenance', RETIRED: 'badge-retired' };

const ACTION_ICON  = { SUBMITTED: '📤', APPROVED: '✅', REJECTED: '❌', RETURNED: '🔄' };
const ACTION_CLASS = { SUBMITTED: 'hist-submitted', APPROVED: 'hist-approved', REJECTED: 'hist-rejected', RETURNED: 'hist-returned' };

function Toast({ msg, type, onClose }) {
  if (!msg) return null;
  return <div className={`toast toast-${type}`} onClick={onClose}>{msg}</div>;
}

export default function AdminPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [section, setSection] = useState('loans');
  const [loanPage, setLoanPage]   = useState(0);
  const [assetPage, setAssetPage] = useState(0);
  const [histPage, setHistPage]   = useState(0);
  const [toast, setToast] = useState(null);

  // Loan modals
  const [rejectModal, setRejectModal]   = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [returnModal, setReturnModal]   = useState(null);
  const [condition, setCondition]       = useState('GOOD');

  // Asset modals
  const [assetModal, setAssetModal] = useState(null);
  const [assetForm, setAssetForm]   = useState({ name: '', category: '', description: '', serialNumber: '', assetTag: '' });
  const [imageFile, setImageFile]   = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [retireConfirm, setRetireConfirm] = useState(null);
  const fileInputRef = useRef(null);

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
  const { data: histData, isLoading: histLoading } = useQuery({
    queryKey: ['loan-history', histPage],
    queryFn: () => getAllLoanHistory(histPage, 50),
    enabled: section === 'history',
  });

  // Loan mutations
  const approveMut = useMutation({
    mutationFn: approveLoan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-loans'] });
      qc.invalidateQueries({ queryKey: ['loan-history'] });
      showToast('Loan approved!');
    },
    onError: (e) => showToast(e?.response?.data?.error?.message ?? 'Approve failed.', 'error'),
  });
  const rejectMut = useMutation({
    mutationFn: ({ id, reason }) => rejectLoan(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-loans'] });
      qc.invalidateQueries({ queryKey: ['loan-history'] });
      setRejectModal(null);
      showToast('Loan rejected.');
    },
    onError: (e) => showToast(e?.response?.data?.error?.message ?? 'Reject failed.', 'error'),
  });
  const returnMut = useMutation({
    mutationFn: ({ id, cond }) => returnLoan(id, cond),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-loans'] });
      qc.invalidateQueries({ queryKey: ['admin-assets'] });
      qc.invalidateQueries({ queryKey: ['loan-history'] });
      setReturnModal(null);
      showToast('Asset returned!');
    },
    onError: (e) => showToast(e?.response?.data?.error?.message ?? 'Return failed.', 'error'),
  });

  // Asset mutations
  const createMut = useMutation({
    mutationFn: createAsset,
    onSuccess: async (newAsset) => {
      if (imageFile) {
        try { await addAssetImage(newAsset.id, imageFile, true); } catch (_) {}
      }
      qc.invalidateQueries({ queryKey: ['admin-assets'] });
      qc.invalidateQueries({ queryKey: ['assets'] });
      closeAssetModal();
      showToast('Asset created!');
    },
    onError: (e) => showToast(e?.response?.data?.error?.message ?? 'Create failed.', 'error'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateAsset(id, data),
    onSuccess: async (updatedAsset) => {
      if (imageFile) {
        try { await addAssetImage(updatedAsset.id, imageFile, true); } catch (_) {}
      }
      qc.invalidateQueries({ queryKey: ['admin-assets'] });
      qc.invalidateQueries({ queryKey: ['assets'] });
      closeAssetModal();
      showToast('Asset updated!');
    },
    onError: (e) => showToast(e?.response?.data?.error?.message ?? 'Update failed.', 'error'),
  });
  const retireMut = useMutation({
    mutationFn: retireAsset,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-assets'] });
      qc.invalidateQueries({ queryKey: ['assets'] });
      setRetireConfirm(null);
      showToast('Asset retired.');
    },
    onError: (e) => showToast(e?.response?.data?.error?.message ?? 'Retire failed.', 'error'),
  });

  const openCreateAsset = () => {
    setAssetForm({ name: '', category: '', description: '', serialNumber: '', assetTag: '' });
    setImageFile(null);
    setImagePreview(null);
    setAssetModal('create');
  };
  const openEditAsset = (asset) => {
    setAssetForm({ name: asset.name, category: asset.category, description: asset.description ?? '', serialNumber: asset.serialNumber ?? '', assetTag: asset.assetTag });
    setImageFile(null);
    setImagePreview(null);
    setAssetModal(asset);
  };
  const closeAssetModal = () => {
    setAssetModal(null);
    setImageFile(null);
    setImagePreview(null);
  };
  const handleImagePick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };
  const submitAsset = () => {
    const data = {
      name: assetForm.name.trim(),
      category: assetForm.category.trim(),
      assetTag: assetForm.assetTag.trim(),
      description: assetForm.description.trim() || undefined,
      serialNumber: assetForm.serialNumber.trim() || undefined,
    };
    if (assetModal === 'create') createMut.mutate(data);
    else updateMut.mutate({ id: assetModal.id, data });
  };

  const loans  = loansData?.content  ?? [];
  const assets = assetsData?.content ?? [];
  const history = histData?.content  ?? [];
  const pendingCount = loans.filter(l => l.status === 'PENDING_APPROVAL').length;

  return (
    <>
      <main className="main-content">
        <Toast msg={toast?.msg} type={toast?.type} onClose={() => setToast(null)} />

        <header className="page-header">
          <div>
            <h1 className="page-title">Admin Panel</h1>
            <p className="page-subtitle">Manage loans, assets, and activity history</p>
          </div>
        </header>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab-btn ${section === 'loans' ? 'tab-active' : ''}`} onClick={() => setSection('loans')}>
            Loan Queue
            {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
          </button>
          <button className={`tab-btn ${section === 'assets' ? 'tab-active' : ''}`} onClick={() => setSection('assets')}>
            Assets
          </button>
          <button className={`tab-btn ${section === 'history' ? 'tab-active' : ''}`} onClick={() => setSection('history')}>
            History
          </button>
        </div>

        {/* ── LOAN QUEUE ── */}
        {section === 'loans' && (
          <>
            {loansLoading ? (
              <div className="skeleton-list">{[1,2,3].map(i => <div key={i} className="skeleton-card" />)}</div>
            ) : loans.length === 0 ? (
              <div className="empty-state"><p className="empty-icon">📭</p><p className="empty-text">No loans yet</p></div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Borrower</th><th>Asset</th><th>Purpose</th>
                      <th>Due Date</th><th>Requested</th><th>Status</th><th>Actions</th>
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
                        <td className="text-muted text-sm">{new Date(loan.requestedAt).toLocaleDateString()}</td>
                        <td><span className={`status-badge ${LOAN_STATUS_CLASS[loan.status]}`}>{LOAN_STATUS_LABEL[loan.status]}</span></td>
                        <td>
                          <div className="action-btns">
                            {loan.status === 'PENDING_APPROVAL' && (
                              <>
                                <button className="btn-xs btn-success" onClick={() => approveMut.mutate(loan.id)} disabled={approveMut.isPending}>Approve</button>
                                <button className="btn-xs btn-danger"  onClick={() => { setRejectModal(loan); setRejectReason(''); }}>Reject</button>
                              </>
                            )}
                            {loan.status === 'ON_LOAN' && (
                              <button className="btn-xs btn-primary" onClick={() => { setReturnModal(loan); setCondition('GOOD'); }}>Return</button>
                            )}
                            {loan.status === 'REJECTED' && (
                              <span className="text-muted text-sm" title={loan.rejectionReason}>Rejected</span>
                            )}
                            {loan.status === 'RETURNED' && (
                              <span className="text-muted text-sm">Done</span>
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
              <div className="empty-state"><p className="empty-icon">📦</p><p className="empty-text">No assets yet</p></div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Image</th><th>Name</th><th>Category</th><th>Asset Tag</th><th>Serial No.</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {assets.map(asset => {
                      const primaryImg = asset.images?.find(i => i.primary) ?? asset.images?.[0];
                      const imgUrl = primaryImg
                        ? `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'}/files/${primaryImg.filePath}`
                        : null;
                      return (
                        <tr key={asset.id}>
                          <td>
                            {imgUrl
                              ? <img src={imgUrl} alt={asset.name} className="asset-thumb" />
                              : <div className="asset-thumb-placeholder">📦</div>
                            }
                          </td>
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
                      );
                    })}
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

        {/* ── HISTORY ── */}
        {section === 'history' && (
          <>
            {histLoading ? (
              <div className="skeleton-list">{[1,2,3,4].map(i => <div key={i} className="skeleton-card" />)}</div>
            ) : history.length === 0 ? (
              <div className="empty-state"><p className="empty-icon">📋</p><p className="empty-text">No activity yet</p></div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Action</th><th>Loan #</th><th>Borrower</th><th>Asset</th><th>Actor</th><th>Notes</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {history.map(h => (
                      <tr key={h.id}>
                        <td>
                          <span className={`history-badge ${ACTION_CLASS[h.action] ?? ''}`}>
                            {ACTION_ICON[h.action] ?? '•'} {h.action}
                          </span>
                        </td>
                        <td className="text-muted text-sm">#{h.loanId}</td>
                        <td>
                          <div className="borrower-name">{h.borrowerName}</div>
                          <div className="borrower-email">{h.borrowerEmail}</div>
                        </td>
                        <td>
                          <div className="asset-name">{h.assetName}</div>
                          <div className="asset-tag">{h.assetTag}</div>
                        </td>
                        <td className="text-sm">{h.actorName ?? '—'}</td>
                        <td className="purpose-cell text-muted text-sm">{h.notes ?? '—'}</td>
                        <td className="text-muted text-sm">
                          {new Date(h.createdAt).toLocaleDateString()}<br />
                          <span style={{ fontSize: 11 }}>{new Date(h.createdAt).toLocaleTimeString()}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {(histData?.totalPages ?? 0) > 1 && (
              <div className="pagination">
                <button className="page-btn" disabled={histPage === 0} onClick={() => setHistPage(p => p - 1)}>← Prev</button>
                <span className="page-info">Page {histPage + 1} of {histData.totalPages}</span>
                <button className="page-btn" disabled={histData.last} onClick={() => setHistPage(p => p + 1)}>Next →</button>
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
              <textarea className="form-input" rows={3} placeholder="Provide a reason for rejection..."
                value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setRejectModal(null)}>Cancel</button>
              <button className="btn-danger" disabled={!rejectReason.trim() || rejectMut.isPending}
                onClick={() => rejectMut.mutate({ id: rejectModal.id, reason: rejectReason.trim() })}>
                {rejectMut.isPending ? 'Rejecting…' : 'Reject Loan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RETURN MODAL ── */}
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
              <button className={`btn-primary ${condition === 'DAMAGED' ? 'btn-danger' : ''}`}
                disabled={returnMut.isPending}
                onClick={() => returnMut.mutate({ id: returnModal.id, cond: condition })}>
                {returnMut.isPending ? 'Processing…' : 'Confirm Return'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ASSET CREATE / EDIT MODAL ── */}
      {assetModal && (
        <div className="modal-backdrop" onClick={closeAssetModal}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{assetModal === 'create' ? 'Add New Asset' : 'Edit Asset'}</h2>

            {/* Image upload */}
            <div className="image-upload-row">
              <div className="image-preview-box" onClick={() => fileInputRef.current?.click()}>
                {imagePreview
                  ? <img src={imagePreview} alt="preview" className="image-preview-img" />
                  : <div className="image-preview-placeholder">
                      <span style={{ fontSize: 28 }}>📷</span>
                      <span className="image-preview-label">Click to upload photo</span>
                    </div>
                }
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png"
                style={{ display: 'none' }} onChange={handleImagePick} />
              {imageFile && (
                <button className="btn-xs btn-secondary" style={{ marginTop: 6 }}
                  onClick={() => { setImageFile(null); setImagePreview(null); }}>
                  Remove
                </button>
              )}
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Name <span className="required">*</span></label>
                <input className="form-input" value={assetForm.name}
                  onChange={e => setAssetForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. MacBook Pro 14" />
              </div>
              <div className="form-group">
                <label className="form-label">Category <span className="required">*</span></label>
                <input className="form-input" value={assetForm.category}
                  onChange={e => setAssetForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Laptop" />
              </div>
              <div className="form-group">
                <label className="form-label">Asset Tag <span className="required">*</span></label>
                <input className="form-input" value={assetForm.assetTag}
                  onChange={e => setAssetForm(f => ({ ...f, assetTag: e.target.value }))} placeholder="e.g. ASSET-001" />
              </div>
              <div className="form-group">
                <label className="form-label">Serial Number</label>
                <input className="form-input" value={assetForm.serialNumber}
                  onChange={e => setAssetForm(f => ({ ...f, serialNumber: e.target.value }))} placeholder="Optional" />
              </div>
              <div className="form-group form-group-full">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2} value={assetForm.description}
                  onChange={e => setAssetForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={closeAssetModal}>Cancel</button>
              <button className="btn-primary"
                disabled={!assetForm.name.trim() || !assetForm.category.trim() || !assetForm.assetTag.trim() || createMut.isPending || updateMut.isPending}
                onClick={submitAsset}>
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
    </>
  );
}
