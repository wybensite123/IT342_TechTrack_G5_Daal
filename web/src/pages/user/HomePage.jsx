import { useState, useRef, useEffect } from "react";
import { useNavigate, Link, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAssets, searchAssets } from "../../api/assetApi";
import { submitLoan, getMyLoans } from "../../api/loanApi";
import { getMyWatchlist, addToWatchlist, removeFromWatchlist } from "../../api/watchlistApi";
import { useAuth } from "../../context/AuthContext";
import "./HomePage.css";
const STATUS_LABEL = {
  AVAILABLE:         "Available",
  PENDING_APPROVAL:  "Pending",
  ON_LOAN:           "On Loan",
  UNDER_MAINTENANCE: "Maintenance",
  RETIRED:           "Retired",
};
const STATUS_CSS = {
  AVAILABLE:         "available",
  PENDING_APPROVAL:  "pending",
  ON_LOAN:           "on-loan",
  UNDER_MAINTENANCE: "maintenance",
  RETIRED:           "maintenance",
};

// ── SVG Icons ───────────────────────────────────────────────────────────────
const IconGrid = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const IconCheck = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);
const IconClock = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconSearch = () => (
  <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconSpec = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M2 12h2M20 12h2M17.66 17.66l-1.41-1.41M6.34 17.66l1.41-1.41"/>
  </svg>
);
const IconArrow = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);
const IconArrowMuted = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);
const IconHeart = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

// ── Skeletons ──────────────────────────────────────────────────────────────
const SkeletonStatCard = () => (
  <div className="stat-card skeleton">
    <div className="stat-top"><div className="stat-icon skeleton-pulse" /><div className="stat-trend skeleton-pulse" /></div>
    <div className="stat-num skeleton-pulse" /><div className="stat-label skeleton-pulse" />
  </div>
);
const SkeletonAssetCard = () => (
  <div className="asset-card skeleton">
    <div className="asset-card-img skeleton-pulse"><div className="skeleton-emoji" /><div className="asset-status-float skeleton-pulse" /></div>
    <div className="asset-card-body">
      <div className="asset-category skeleton-pulse" /><div className="asset-name skeleton-pulse" />
      <div className="asset-tag skeleton-pulse" /><div className="asset-meta"><div className="asset-meta-item skeleton-pulse" /></div>
      <div className="asset-card-footer"><div className="btn-request skeleton-pulse" /><div className="wishlist-btn skeleton-pulse" /></div>
    </div>
  </div>
);
const SkeletonActivityItem = () => (
  <div className="activity-item skeleton">
    <div className="activity-dot skeleton-pulse" />
    <div className="activity-text"><div className="activity-msg skeleton-pulse" /><div className="activity-time skeleton-pulse" /></div>
    <div className="activity-status skeleton-pulse" />
  </div>
);

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ message, type, visible }) {
  return <div className={`toast ${type} ${visible ? "show" : ""}`}>{message}</div>;
}

// ── Category emoji ─────────────────────────────────────────────────────────
function assetEmoji(category = "") {
  const c = category.toLowerCase();
  if (c.includes("laptop")) return "💻";
  if (c.includes("projector")) return "📽️";
  if (c.includes("camera")) return "📷";
  if (c.includes("printer")) return "🖨️";
  if (c.includes("network") || c.includes("router")) return "📡";
  if (c.includes("audio")) return "🎧";
  if (c.includes("kit")) return "🔌";
  if (c.includes("monitor") || c.includes("display")) return "🖥️";
  return "📦";
}

// ── Asset Card ─────────────────────────────────────────────────────────────
function AssetCard({ asset, delay, onRequest, onWishlist, inWishlist }) {
  const isAvail = asset.status === "AVAILABLE";
  const statusCss = STATUS_CSS[asset.status] || "maintenance";
  return (
    <div className="asset-card" style={{ animationDelay: `${delay}s` }}>
      <div className="asset-card-img">
        <span>{assetEmoji(asset.category)}</span>
        <span className={`asset-status-float ${statusCss}`}>
          {STATUS_LABEL[asset.status] || asset.status}
        </span>
      </div>
      <div className="asset-card-body">
        <div className="asset-category">{asset.category}</div>
        <div className="asset-name">{asset.name}</div>
        <div className="asset-tag">{asset.assetTag}</div>
        {asset.description && (
          <div className="asset-meta">
            <div className="asset-meta-item"><IconSpec />{asset.description}</div>
          </div>
        )}
        <div className="asset-card-footer">
          <button className="btn-request" disabled={!isAvail} onClick={() => isAvail && onRequest(asset)}>
            {isAvail ? "Request Loan" : (STATUS_LABEL[asset.status] || asset.status)}
          </button>
          <button className={`wishlist-btn ${inWishlist ? "active" : ""}`} title="Watchlist" onClick={() => onWishlist(asset.id)}>
            <IconHeart filled={inWishlist} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Loan Status badge helpers ───────────────────────────────────────────────
const LOAN_DOT = { PENDING_APPROVAL: "amber", ON_LOAN: "blue", RETURNED: "green", REJECTED: "red" };
const LOAN_CSS = { PENDING_APPROVAL: "pending", ON_LOAN: "on-loan", RETURNED: "returned", REJECTED: "rejected" };
const LOAN_LABEL = { PENDING_APPROVAL: "Pending", ON_LOAN: "On Loan", RETURNED: "Returned", REJECTED: "Rejected" };

// ── Main Component ──────────────────────────────────────────────────────────
export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { setMenuOpen } = useOutletContext() ?? {};

  const [search, setSearch]         = useState("");
  const [debouncedSearch, setDS]    = useState("");
  const [filter, setFilter]         = useState("all");
  const [page, setPage]             = useState(0);

  // Watchlist comes from the backend so it persists across reloads
  // and is shared between web and mobile.
  const { data: watchlistPage } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => getMyWatchlist(0, 200),
    enabled: !!user,
    staleTime: 60_000,
  });
  const wishlist = new Set((watchlistPage?.content ?? []).map(a => a.id));
  const [modal, setModal]           = useState(null);
  const [retDate, setRetDate]       = useState("");
  const [purpose, setPurpose]       = useState("");
  const [toast, setToast]           = useState({ msg: "", type: "info", visible: false });
  const toastTimer                  = useRef(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDS(search); setPage(0); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when filter changes
  useEffect(() => { setPage(0); }, [filter]);

  // Map UI filter → backend status param
  const statusParam = {
    all: undefined, available: "AVAILABLE", "on-loan": "ON_LOAN",
    maintenance: "UNDER_MAINTENANCE", pending: "PENDING_APPROVAL",
  }[filter] ?? undefined;

  const isCategoryFilter = ["laptops", "kits", "projectors", "cameras"].includes(filter);

  // Asset query
  const { data: assetPage, isLoading: assetsLoading } = useQuery({
    queryKey: ["assets", debouncedSearch, statusParam, page],
    queryFn: () => debouncedSearch
      ? searchAssets(debouncedSearch, page, 20)
      : getAssets(page, 20, statusParam),
    keepPreviousData: true,
  });

  // Stat counts — parallel queries
  const { data: statsAll }   = useQuery({ queryKey: ["assets-count-all"],  queryFn: () => getAssets(0, 1) });
  const { data: statsAvail } = useQuery({ queryKey: ["assets-count-avail"],queryFn: () => getAssets(0, 1, "AVAILABLE") });
  const { data: statsLoan }  = useQuery({ queryKey: ["assets-count-loan"], queryFn: () => getAssets(0, 1, "ON_LOAN") });
  const { data: statsMaint } = useQuery({ queryKey: ["assets-count-maint"],queryFn: () => getAssets(0, 1, "UNDER_MAINTENANCE") });

  // Recent activity (my loans)
  const { data: myLoansPage, isLoading: loansLoading } = useQuery({
    queryKey: ["my-loans-recent"],
    queryFn: () => getMyLoans(0, 5),
  });

  // Pending loans count for badge
  const pendingCount = myLoansPage?.content.filter(l => l.status === "PENDING_APPROVAL" || l.status === "ON_LOAN").length ?? 0;

  // Loan submit mutation
  const submitMutation = useMutation({
    mutationFn: submitLoan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["my-loans-recent"] });
      qc.invalidateQueries({ queryKey: ["assets-count-avail"] });
      setModal(null);
      showToast(`Loan request for "${modal?.name}" submitted!`, "success");
    },
    onError: (err) => {
      const msg = err?.response?.data?.error?.message || "Failed to submit request.";
      showToast(msg, "error");
    },
  });

  const tomorrowStr = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; })();
  const maxDateStr  = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split("T")[0]; })();

  const showToast = (msg, type = "info") => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type, visible: true });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };

  // Category filter applied client-side after fetch
  const assets = assetPage?.content ?? [];
  const filtered = isCategoryFilter
    ? assets.filter(a => {
        if (filter === "laptops")   return a.category.toLowerCase().includes("laptop");
        if (filter === "kits")      return a.category.toLowerCase().includes("kit");
        if (filter === "projectors")return a.category.toLowerCase().includes("projector");
        if (filter === "cameras")   return a.category.toLowerCase().includes("camera");
        return true;
      })
    : assets;

  const watchlistMut = useMutation({
    mutationFn: ({ id, watched }) => watched ? removeFromWatchlist(id) : addToWatchlist(id),
    onSuccess: (_data, { watched }) => {
      qc.invalidateQueries({ queryKey: ['watchlist'] });
      showToast(watched ? "Removed from Watchlist" : "Added to Watchlist ♥",
                watched ? "info" : "success");
    },
    onError: (err) => {
      showToast(err?.response?.data?.error?.message ?? "Watchlist update failed", "error");
    },
  });

  const toggleWishlist = (id) => {
    if (watchlistMut.isPending) return;
    watchlistMut.mutate({ id, watched: wishlist.has(id) });
  };

  const openModal  = (asset) => { setModal(asset); setRetDate(""); setPurpose(""); };
  const closeModal = () => setModal(null);

  const confirmRequest = () => {
    if (!retDate)    { showToast("Please select a return date.", "error");   return; }
    if (!purpose.trim()) { showToast("Please enter a purpose.", "error"); return; }
    submitMutation.mutate({ assetId: modal.id, purpose, requestedReturnDate: retDate });
  };

  const isAdmin = user?.role === "ROLE_ADMIN";

  return (
    <>
      <div className="content">
        <div className="content-search-row">
          <div className="search-bar">
            <IconSearch />
            <input className="search-input" type="text" placeholder="Search by name, tag, category…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
            {/* STAT CARDS */}
            <div className="stat-grid">
              {!statsAll ? (
                <><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /></>
              ) : (
                <>
                  <div className="stat-card">
                    <div className="stat-top"><div className="stat-icon blue">📦</div></div>
                    <div className="stat-num blue">{statsAll.totalElements}</div>
                    <div className="stat-label">Total Assets</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-top"><div className="stat-icon green">✅</div></div>
                    <div className="stat-num green">{statsAvail?.totalElements ?? "…"}</div>
                    <div className="stat-label">Available Now</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-top"><div className="stat-icon amber">🔄</div></div>
                    <div className="stat-num amber">{statsLoan?.totalElements ?? "…"}</div>
                    <div className="stat-label">On Loan</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-top"><div className="stat-icon red">🔧</div></div>
                    <div className="stat-num red">{statsMaint?.totalElements ?? "…"}</div>
                    <div className="stat-label">Under Maintenance</div>
                  </div>
                </>
              )}
            </div>

            {/* SECTION HEADER */}
            <div className="section-header">
              <div className="section-title">Browse <span>Equipment</span></div>
              {assetPage && !isCategoryFilter && (
                <span style={{ color: "#94A3B8", fontSize: 13 }}>
                  {assetPage.totalElements} asset{assetPage.totalElements !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* FILTER TABS */}
            <div className="filter-tabs">
              {[
                { val: "all",         label: "All" },
                { val: "available",   label: "Available",   dot: "#10B981" },
                { val: "on-loan",     label: "On Loan",     dot: "#3B82F6" },
                { val: "maintenance", label: "Maintenance", dot: "#EF4444" },
                { val: "laptops",     label: "💻 Laptops" },
                { val: "kits",        label: "🔌 Kits" },
                { val: "projectors",  label: "📽 Projectors" },
              ].map(tab => (
                <button key={tab.val} className={`filter-tab ${filter === tab.val ? "active" : ""}`}
                  onClick={() => setFilter(tab.val)}>
                  {tab.dot && <span className="dot-indicator" style={{ background: tab.dot }} />}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ASSET GRID */}
            <div className="asset-grid">
              {assetsLoading ? (
                Array.from({ length: 8 }, (_, i) => <SkeletonAssetCard key={i} />)
              ) : filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🔍</div>
                  <div className="empty-state-title">No Assets Found</div>
                  <div className="empty-state-sub">Try adjusting your search or filter.</div>
                </div>
              ) : (
                filtered.map((a, i) => (
                  <AssetCard key={a.id} asset={a} delay={i * 0.05}
                    onRequest={openModal} onWishlist={toggleWishlist} inWishlist={wishlist.has(a.id)} />
                ))
              )}
            </div>

            {/* PAGINATION */}
            {assetPage && assetPage.totalPages > 1 && (
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
                <button className="btn-back" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span style={{ color: "#94A3B8", lineHeight: "32px", fontSize: 13 }}>
                  Page {page + 1} of {assetPage.totalPages}
                </span>
                <button className="btn-next" disabled={assetPage.last} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}

            {/* BOTTOM ROW */}
            <div className="two-col">
              {/* Recent Activity */}
              <div className="activity-card">
                <div className="section-header" style={{ marginBottom: 0 }}>
                  <div className="section-title" style={{ fontSize: 16 }}>Recent <span>Activity</span></div>
                  <Link to="/loans" className="view-all-btn" style={{ fontSize: 11 }}>All Loans →</Link>
                </div>
                <div className="activity-list">
                  {loansLoading ? (
                    Array.from({ length: 4 }, (_, i) => <SkeletonActivityItem key={i} />)
                  ) : !myLoansPage?.content.length ? (
                    <div style={{ color: "#94A3B8", fontSize: 13, padding: "16px 0" }}>No loan activity yet.</div>
                  ) : (
                    myLoansPage.content.map((loan, i) => (
                      <div className="activity-item" key={loan.id}>
                        <div className={`activity-dot ${LOAN_DOT[loan.status] || "blue"}`}>
                          {loan.status === "RETURNED" ? "✓" : loan.status === "REJECTED" ? "✗" : loan.status === "ON_LOAN" ? "📤" : "⏳"}
                        </div>
                        <div className="activity-text">
                          <div className="activity-msg">
                            {loan.status === "RETURNED" && <><strong>{loan.asset.name}</strong> was returned</>}
                            {loan.status === "ON_LOAN"  && <>You borrowed <strong>{loan.asset.name}</strong></>}
                            {loan.status === "PENDING_APPROVAL" && <>Request for <strong>{loan.asset.name}</strong> awaiting approval</>}
                            {loan.status === "REJECTED" && <>Request for <strong>{loan.asset.name}</strong> was rejected</>}
                          </div>
                          <div className="activity-time">
                            {new Date(loan.requestedAt).toLocaleDateString()} · {loan.asset.assetTag}
                            {loan.requestedReturnDate && ` · Due ${loan.requestedReturnDate}`}
                          </div>
                        </div>
                        <span className={`activity-status ${LOAN_CSS[loan.status] || "pending"}`}>
                          {LOAN_LABEL[loan.status] || loan.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="quick-card">
                <div className="section-title" style={{ fontSize: 16, marginBottom: 0 }}>Quick <span>Actions</span></div>
                <div className="quick-list">
                  {[
                    { icon: "📋", color: "blue",  label: "New Loan Request",  sub: "Browse available equipment above",  action: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
                    { icon: "📊", color: "amber", label: "My Active Loans",   sub: `${pendingCount} active loan${pendingCount !== 1 ? "s" : ""}`, action: () => navigate("/loans") },
                    ...(isAdmin ? [{ icon: "⚙️", color: "red", label: "Admin Panel", sub: "Manage assets & loan queue", action: () => navigate("/admin") }] : []),
                  ].map((item, i) => (
                    <div className="quick-item" key={i} onClick={item.action} style={{ cursor: "pointer" }}>
                      <div className={`quick-item-icon ${item.color}`}>{item.icon}</div>
                      <div className="quick-item-text">
                        <div className="quick-item-label">{item.label}</div>
                        <div className="quick-item-sub">{item.sub}</div>
                      </div>
                      <IconArrowMuted />
                    </div>
                  ))}
                </div>

                {/* Due Soon */}
                {(() => {
                  const dueSoon = myLoansPage?.content.find(l => l.status === "ON_LOAN");
                  if (!dueSoon) return null;
                  const daysLeft = Math.ceil((new Date(dueSoon.requestedReturnDate) - new Date()) / 86400000);
                  return (
                    <div className="due-alert">
                      <div className="due-alert-title">⚠ Due Soon</div>
                      <div className="due-alert-row">
                        <span className="due-alert-name">{dueSoon.asset.name}</span>
                        <span className="due-alert-date">{dueSoon.requestedReturnDate}</span>
                      </div>
                      <div className="due-alert-sub">{dueSoon.asset.assetTag} · {daysLeft > 0 ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining` : "Due today"}</div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

      {/* ─── REQUEST MODAL ─── */}
      <div className={`modal-overlay ${modal ? "open" : ""}`}
        onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
        <div className="modal">
          <div className="modal-header">
            <div className="modal-title">Request Loan</div>
            <button className="modal-close" onClick={closeModal}>✕</button>
          </div>
          {modal && (
            <>
              <div className="modal-asset-info">
                <div className="modal-asset-emoji">{assetEmoji(modal.category)}</div>
                <div>
                  <div className="modal-asset-name">{modal.name}</div>
                  <div className="modal-asset-tag">{modal.assetTag}</div>
                </div>
              </div>
              <div className="modal-field">
                <div className="modal-label">Purpose <span style={{ color: "#EF4444" }}>*</span></div>
                <input className="modal-input" type="text" placeholder="e.g. Lab project for IT342"
                  value={purpose} onChange={e => setPurpose(e.target.value)} />
              </div>
              <div className="modal-field">
                <div className="modal-label">Return Date <span style={{ color: "#EF4444" }}>*</span></div>
                <input className="modal-input" type="date" min={tomorrowStr} max={maxDateStr}
                  value={retDate} onChange={e => setRetDate(e.target.value)} />
              </div>
              <div className="modal-note">
                Return date must be within 7 days. Your request will be reviewed by an IT admin.
              </div>
              <div className="modal-btns">
                <button className="modal-btn-cancel" onClick={closeModal}>Cancel</button>
                <button className="modal-btn-confirm" onClick={confirmRequest}
                  disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? "Submitting…" : "SUBMIT REQUEST →"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <Toast message={toast.msg} type={toast.type} visible={toast.visible} />
    </>
  );
}
