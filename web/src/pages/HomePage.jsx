import { useState, useRef } from "react";
import "./HomePage.css";
import logo from '../assets/TechTrack.png';

// ── Asset Data ──────────────────────────────────────────────────────────────
const ASSETS = [
  { id:1,  emoji:"💻", name:"Dell Latitude 5420",    tag:"TAG-0042", category:"Laptop",     status:"available",   spec:"Intel i5 · 8GB RAM · 256GB SSD",      loc:"Lab 301" },
  { id:2,  emoji:"💻", name:"Lenovo ThinkPad E14",   tag:"TAG-0043", category:"Laptop",     status:"available",   spec:"Intel i7 · 16GB RAM · 512GB SSD",     loc:"Lab 301" },
  { id:3,  emoji:"🖥️", name:"HP EliteBook 840",      tag:"TAG-0044", category:"Laptop",     status:"on-loan",     spec:"Intel i5 · 8GB RAM · 256GB SSD",      loc:"Lab 302" },
  { id:4,  emoji:"🔌", name:"Arduino Starter Kit",   tag:"TAG-0087", category:"Kit",        status:"on-loan",     spec:"Uno R3 + sensors + breadboard",        loc:"Storage A" },
  { id:5,  emoji:"🍓", name:"Raspberry Pi 4 Kit",    tag:"TAG-0055", category:"Kit",        status:"available",   spec:"4GB RAM · case + SD card",             loc:"Storage A" },
  { id:6,  emoji:"📽️", name:"EPSON EB-S41",          tag:"TAG-0013", category:"Projector",  status:"pending",     spec:"3300 Lumens · SVGA · HDMI",            loc:"AV Room" },
  { id:7,  emoji:"📷", name:"Canon EOS 90D",         tag:"TAG-0061", category:"Camera",     status:"available",   spec:"32.5MP · 4K Video · WiFi",             loc:"Media Lab" },
  { id:8,  emoji:"🔧", name:"Network Toolkit Pro",   tag:"TAG-0099", category:"Kit",        status:"maintenance", spec:"Crimper, tester, RJ45 plugs",          loc:"IT Office" },
  { id:9,  emoji:"💻", name:'MacBook Pro 14"',        tag:"TAG-0031", category:"Laptop",     status:"available",   spec:"M3 · 16GB RAM · 512GB SSD",           loc:"Faculty Room" },
  { id:10, emoji:"📡", name:"TP-Link Wifi 6 Router", tag:"TAG-0078", category:"Networking", status:"available",   spec:"AX3000 · Dual Band · MU-MIMO",         loc:"Storage B" },
  { id:11, emoji:"🖨️", name:"HP LaserJet Pro M404", tag:"TAG-0022", category:"Printer",    status:"maintenance", spec:"40ppm · USB · LAN · 1200dpi",          loc:"Print Station" },
  { id:12, emoji:"🎧", name:"Sony WH-1000XM5",       tag:"TAG-0065", category:"Audio",      status:"available",   spec:"ANC · 30hr battery · USB-C",           loc:"Media Lab" },
];

const STATUS_LABEL = {
  available:   "Available",
  "on-loan":   "On Loan",
  pending:     "Pending",
  maintenance: "Maintenance",
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
const IconInfo = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconHeart = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const IconWatchlist = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const IconClock = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconFile = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IconSearch = () => (
  <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconBell = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconSpec = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M2 12h2M20 12h2M17.66 17.66l-1.41-1.41M6.34 17.66l1.41-1.41"/>
  </svg>
);
const IconPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

// ── Toast ───────────────────────────────────────────────────────────────────
function Toast({ message, type, visible }) {
  return (
    <div className={`toast ${type} ${visible ? "show" : ""}`}>
      {message}
    </div>
  );
}

// ── Asset Card ──────────────────────────────────────────────────────────────
function AssetCard({ asset, delay, onRequest, onWishlist, inWishlist }) {
  const isAvail = asset.status === "available";
  return (
    <div className="asset-card" style={{ animationDelay: `${delay}s` }}>
      <div className="asset-card-img">
        <span>{asset.emoji}</span>
        <span className={`asset-status-float ${asset.status}`}>
          {STATUS_LABEL[asset.status]}
        </span>
      </div>
      <div className="asset-card-body">
        <div className="asset-category">{asset.category}</div>
        <div className="asset-name">{asset.name}</div>
        <div className="asset-tag">{asset.tag}</div>
        <div className="asset-meta">
          <div className="asset-meta-item">
            <IconSpec />
            {asset.spec}
          </div>
        </div>
        <div className="asset-meta">
          <div className="asset-meta-item">
            <IconPin />
            {asset.loc}
          </div>
        </div>
        <div className="asset-card-footer">
          <button
            className="btn-request"
            disabled={!isAvail}
            onClick={() => isAvail && onRequest(asset.id)}
          >
            {isAvail ? "Request Loan" : STATUS_LABEL[asset.status]}
          </button>
          <button
            className={`wishlist-btn ${inWishlist ? "active" : ""}`}
            title="Add to Watchlist"
            onClick={() => onWishlist(asset.id)}
          >
            <IconHeart filled={inWishlist} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function HomePage() {
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState("all");
  const [wishlist, setWishlist]   = useState(new Set());
  const [modal, setModal]         = useState(null);   // asset object or null
  const [retDate, setRetDate]     = useState("");
  const [note, setNote]           = useState("");
  const [toast, setToast]         = useState({ msg: "", type: "info", visible: false });
  const [menuOpen, setMenuOpen]   = useState(false);
  const toastTimer                = useRef(null);

  // Compute tomorrow for date min
  const tomorrowStr = (() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  // Toast helper
  const showToast = (msg, type = "info") => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type, visible: true });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };

  // Filter logic
  const filtered = ASSETS.filter(a => {
    const matchFilter =
      filter === "all"         ? true :
      filter === "available"   ? a.status === "available" :
      filter === "on-loan"     ? a.status === "on-loan" :
      filter === "maintenance" ? a.status === "maintenance" :
      filter === "laptops"     ? a.category === "Laptop" :
      filter === "kits"        ? a.category === "Kit" :
      filter === "projectors"  ? a.category === "Projector" : true;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      a.name.toLowerCase().includes(q) ||
      a.tag.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  // Wishlist toggle
  const toggleWishlist = (id) => {
    setWishlist(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); showToast("Removed from Watchlist", "info"); }
      else               { next.add(id);   showToast("Added to Watchlist ♥",   "success"); }
      return next;
    });
  };

  // Modal
  const openModal  = (id) => {
    setModal(ASSETS.find(a => a.id === id));
    setRetDate(""); setNote("");
  };
  const closeModal = () => setModal(null);
  const confirmRequest = () => {
    if (!retDate) { showToast("Please select a return date.", "error"); return; }
    closeModal();
    showToast(`Request for ${modal.name} submitted!`, "success");
  };

  return (
    <>
      {/* Background */}
      <div className="tt-body-bg" />
      <div className="orb orb-a" />
      <div className="orb orb-b" />

      <div className="app">
        {/* ─── SIDEBAR BACKDROP ─── */}
        {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}

        {/* ─── SIDEBAR ─── */}
        <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
          <button className="sidebar-close" onClick={() => setMenuOpen(false)}>✕</button>
          <div className="sidebar-logo">
            <img src={logo} alt="TechTrack" />
          </div>

          <p className="nav-section-label">Main Menu</p>

          <a className="nav-item active" href="#" onClick={() => setMenuOpen(false)}>
            <IconGrid /> Asset Catalog
          </a>
          <a className="nav-item" href="#" onClick={() => setMenuOpen(false)}>
            <IconCheck /> My Loans
            <span className="nav-badge blue">3</span>
          </a>
          <a className="nav-item" href="#" onClick={() => setMenuOpen(false)}>
            <IconInfo /> Pending Requests
            <span className="nav-badge">2</span>
          </a>
          <a className="nav-item" href="#" onClick={() => setMenuOpen(false)}>
            <IconWatchlist /> Watchlist
          </a>

          <p className="nav-section-label">History</p>
          <a className="nav-item" href="#" onClick={() => setMenuOpen(false)}>
            <IconClock /> Loan History
          </a>
          <a className="nav-item" href="#" onClick={() => setMenuOpen(false)}>
            <IconFile /> Reports
          </a>

          <div className="sidebar-footer">
            <div className="user-chip">
              <div className="user-avatar">JD</div>
              <div className="user-info">
                <div className="user-name">Juan dela Cruz</div>
                <div className="user-role">Student · CIT</div>
              </div>
              <IconChevron />
            </div>
          </div>
        </aside>

        {/* ─── MAIN ─── */}
        <div className="main">
          {/* TOPBAR */}
          <header className="topbar">
            <button className="hamburger" onClick={() => setMenuOpen(true)} title="Open menu">
              <span /><span /><span />
            </button>
            <div className="topbar-title">Asset <span>Catalog</span></div>

            <div className="search-bar">
              <IconSearch />
              <input
                className="search-input"
                type="text"
                placeholder="Search assets by name, tag, or category…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="topbar-actions">
              <div className="icon-btn" title="Notifications">
                <IconBell />
                <div className="notif-dot" />
              </div>
              <div className="icon-btn" title="Settings">
                <IconSettings />
              </div>
              <div className="topbar-avatar">JD</div>
            </div>
          </header>

          {/* CONTENT */}
          <div className="content">
            {/* STAT CARDS */}
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon blue">📦</div>
                  <span className="stat-trend up">+4 today</span>
                </div>
                <div className="stat-num blue">172</div>
                <div className="stat-label">Total Assets</div>
              </div>
              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon green">✅</div>
                  <span className="stat-trend up">124 ready</span>
                </div>
                <div className="stat-num green">124</div>
                <div className="stat-label">Available Now</div>
              </div>
              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon amber">🔄</div>
                  <span className="stat-trend neu">active</span>
                </div>
                <div className="stat-num amber">35</div>
                <div className="stat-label">On Loan</div>
              </div>
              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon red">🔧</div>
                  <span className="stat-trend down">needs attn</span>
                </div>
                <div className="stat-num red">13</div>
                <div className="stat-label">Under Maintenance</div>
              </div>
            </div>

            {/* ASSET CATALOG HEADER */}
            <div className="section-header">
              <div className="section-title">Browse <span>Equipment</span></div>
              <button className="view-all-btn">
                View All <IconArrow />
              </button>
            </div>

            {/* FILTER TABS */}
            <div className="filter-tabs">
              {[
                { val:"all",         label:"All",         count:172 },
                { val:"available",   label:"Available",   count:124, dot:"#10B981" },
                { val:"on-loan",     label:"On Loan",     count:35,  dot:"#3B82F6" },
                { val:"maintenance", label:"Maintenance", count:13,  dot:"#EF4444" },
                { val:"laptops",     label:"💻 Laptops" },
                { val:"kits",        label:"🔌 Kits" },
                { val:"projectors",  label:"📽 Projectors" },
              ].map(tab => (
                <button
                  key={tab.val}
                  className={`filter-tab ${filter === tab.val ? "active" : ""}`}
                  onClick={() => setFilter(tab.val)}
                >
                  {tab.dot && <span className="dot-indicator" style={{ background: tab.dot }} />}
                  {tab.label}
                  {tab.count !== undefined && <span className="tab-count">{tab.count}</span>}
                </button>
              ))}
            </div>

            {/* ASSET GRID */}
            <div className="asset-grid">
              {filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🔍</div>
                  <div className="empty-state-title">No Assets Found</div>
                  <div className="empty-state-sub">Try adjusting your search or filter.</div>
                </div>
              ) : (
                filtered.map((a, i) => (
                  <AssetCard
                    key={a.id}
                    asset={a}
                    delay={i * 0.05}
                    onRequest={openModal}
                    onWishlist={toggleWishlist}
                    inWishlist={wishlist.has(a.id)}
                  />
                ))
              )}
            </div>

            {/* BOTTOM ROW */}
            <div className="two-col">
              {/* Recent Activity */}
              <div className="activity-card">
                <div className="section-header" style={{ marginBottom: 0 }}>
                  <div className="section-title" style={{ fontSize: 16 }}>Recent <span>Activity</span></div>
                  <button className="view-all-btn" style={{ fontSize: 11 }}>All History →</button>
                </div>
                <div className="activity-list">
                  {[
                    {
                      dot:"green", icon:"✓",
                      msg: <><strong>Dell Latitude 5420</strong> was returned successfully</>,
                      time:"2 hours ago · TAG-0042", status:"returned", statusLabel:"Returned"
                    },
                    {
                      dot:"blue", icon:"📤",
                      msg: <>You borrowed <strong>Arduino Starter Kit</strong></>,
                      time:"Yesterday · TAG-0087 · Due Mar 5", status:"on-loan", statusLabel:"On Loan"
                    },
                    {
                      dot:"amber", icon:"⏳",
                      msg: <>Request for <strong>EPSON EB-S41</strong> is awaiting admin approval</>,
                      time:"2 days ago · TAG-0013", status:"pending", statusLabel:"Pending"
                    },
                    {
                      dot:"red", icon:"✗",
                      msg: <>Request for <strong>Raspberry Pi 4</strong> was rejected</>,
                      time:"3 days ago · TAG-0055 · Already borrowed", status:"rejected", statusLabel:"Rejected"
                    },
                  ].map((item, i) => (
                    <div className="activity-item" key={i}>
                      <div className={`activity-dot ${item.dot}`}>{item.icon}</div>
                      <div className="activity-text">
                        <div className="activity-msg">{item.msg}</div>
                        <div className="activity-time">{item.time}</div>
                      </div>
                      <span className={`activity-status ${item.status}`}>{item.statusLabel}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="quick-card">
                <div className="section-title" style={{ fontSize: 16, marginBottom: 0 }}>Quick <span>Actions</span></div>
                <div className="quick-list">
                  {[
                    { icon:"📋", color:"blue",  label:"New Loan Request",  sub:"Browse and request available equipment",  toast:"Opening loan request form…" },
                    { icon:"↩️", color:"green", label:"Return Equipment",   sub:"Mark a borrowed item as returned",         toast:"Opening return form…" },
                    { icon:"📊", color:"amber", label:"My Active Loans",    sub:"3 active · 2 due this week",               toast:"Loading your active loans…" },
                  ].map((item, i) => (
                    <div className="quick-item" key={i} onClick={() => showToast(item.toast, "info")}>
                      <div className={`quick-item-icon ${item.color}`}>{item.icon}</div>
                      <div className="quick-item-text">
                        <div className="quick-item-label">{item.label}</div>
                        <div className="quick-item-sub">{item.sub}</div>
                      </div>
                      <IconArrowMuted />
                    </div>
                  ))}
                </div>

                {/* Due Soon Alert */}
                <div className="due-alert">
                  <div className="due-alert-title">⚠ Due Soon</div>
                  <div className="due-alert-row">
                    <span className="due-alert-name">Arduino Starter Kit</span>
                    <span className="due-alert-date">Mar 5</span>
                  </div>
                  <div className="due-alert-sub">TAG-0087 · 6 days remaining</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── REQUEST MODAL ─── */}
      <div
        className={`modal-overlay ${modal ? "open" : ""}`}
        onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
      >
        <div className="modal">
          <div className="modal-header">
            <div className="modal-title">Request Loan</div>
            <button className="modal-close" onClick={closeModal}>✕</button>
          </div>
          {modal && (
            <>
              <div className="modal-asset-info">
                <div className="modal-asset-emoji">{modal.emoji}</div>
                <div>
                  <div className="modal-asset-name">{modal.name}</div>
                  <div className="modal-asset-tag">{modal.tag}</div>
                </div>
              </div>
              <div className="modal-field">
                <div className="modal-label">
                  Return Date <span style={{ color: "#EF4444" }}>*</span>
                </div>
                <input
                  className="modal-input"
                  type="date"
                  min={tomorrowStr}
                  value={retDate}
                  onChange={e => setRetDate(e.target.value)}
                />
              </div>
              <div className="modal-field">
                <div className="modal-label">Purpose / Notes</div>
                <input
                  className="modal-input"
                  type="text"
                  placeholder="e.g. Lab project for IT342 subject"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>
              <div className="modal-note">
                Your request will be reviewed by an IT administrator. You will be notified once approved.
              </div>
              <div className="modal-btns">
                <button className="modal-btn-cancel" onClick={closeModal}>Cancel</button>
                <button className="modal-btn-confirm" onClick={confirmRequest}>SUBMIT REQUEST →</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── TOAST ─── */}
      <Toast message={toast.msg} type={toast.type} visible={toast.visible} />
    </>
  );
}
