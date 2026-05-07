import { useState, useRef, useMemo, useEffect } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getMyLoans, getAllLoans } from '../api/loanApi';
import { uploadProfilePicture, getProfilePictureUrl } from '../api/profileApi';
import logo from '../assets/TechTrack.png';
import '../pages/user/HomePage.css';

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
const IconSettings = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M2 12h2M20 12h2M17.66 17.66l-1.41-1.41M6.34 17.66l1.41-1.41"/>
  </svg>
);
const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconCamera = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);
const IconHeartNav = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const PAGE_TITLES = {
  '/dashboard': { prefix: 'Asset',   accent: 'Catalog'  },
  '/loans':     { prefix: 'My',      accent: 'Loans'    },
  '/watchlist': { prefix: 'My',      accent: 'Watchlist'},
  '/admin':     { prefix: 'Admin',   accent: 'Panel'    },
  '/profile':   { prefix: 'My',      accent: 'Profile'  },
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen]       = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [uploading, setUploading]     = useState(false);
  const fileRef = useRef(null);
  const location = useLocation();

  const isAdmin      = user?.role === 'ROLE_ADMIN';
  const userInitials = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() : '?';
  const userFullName = user ? `${user.firstName} ${user.lastName}` : '';
  const avatarUrl    = user?.profilePicture ? getProfilePictureUrl(user.profilePicture) : null;
  const pageTitle    = PAGE_TITLES[location.pathname] ?? { prefix: 'TechTrack', accent: '' };
  const homePath     = isAdmin ? '/admin' : '/dashboard';

  // ── Borrower loans (used for "My Loans" badge + borrower notifications) ──
  const { data: myLoansPage } = useQuery({
    queryKey: ['my-loans-recent'],
    queryFn: () => getMyLoans(0, 50),
    enabled: !!user && !isAdmin,
    refetchInterval: 30_000,
  });
  // ── Admin: all loans (for pending notifications) ──
  const { data: allLoansPage } = useQuery({
    queryKey: ['all-loans-notif'],
    queryFn: () => getAllLoans(0, 50),
    enabled: !!user && isAdmin,
    refetchInterval: 30_000,
  });

  const myLoans  = myLoansPage?.content  ?? [];
  const allLoans = allLoansPage?.content ?? [];

  const pendingCount = myLoans.filter(l => l.status === 'PENDING_APPROVAL').length;

  // ── Build notification feed ──
  const notifications = useMemo(() => {
    if (isAdmin) {
      return allLoans
        .filter(l => l.status === 'PENDING_APPROVAL')
        .slice(0, 10)
        .map(l => ({
          id: `pending-${l.id}`,
          icon: '📥',
          title: 'New loan request',
          body: `${l.borrower.firstName} ${l.borrower.lastName} requested ${l.asset.name}`,
          time: l.requestedAt,
          link: '/admin',
          tone: 'pending',
        }));
    }
    return myLoans
      .filter(l => ['APPROVED', 'REJECTED', 'ON_LOAN', 'RETURNED'].includes(l.status))
      .slice(0, 10)
      .map(l => {
        const map = {
          APPROVED: { icon: '✅', title: 'Loan approved',   tone: 'approved', body: `Your loan for "${l.asset.name}" was approved.` },
          ON_LOAN:  { icon: '✅', title: 'Loan approved',   tone: 'approved', body: `Your loan for "${l.asset.name}" was approved.` },
          REJECTED: { icon: '❌', title: 'Loan rejected',   tone: 'rejected', body: `Your loan for "${l.asset.name}" was rejected${l.rejectionReason ? ': ' + l.rejectionReason : '.'}` },
          RETURNED: { icon: '🔄', title: 'Loan returned',   tone: 'returned', body: `"${l.asset.name}" return processed.` },
        };
        const info = map[l.status];
        return {
          id: `loan-${l.id}-${l.status}`,
          ...info,
          time: l.approvedAt || l.rejectedAt || l.returnedAt || l.requestedAt,
          link: '/loans',
        };
      });
  }, [isAdmin, allLoans, myLoans]);

  // ── Unread tracking via localStorage ──
  const lastSeenKey = user ? `notif_seen_${user.id}` : null;
  const [lastSeen, setLastSeen] = useState(() => {
    if (!lastSeenKey) return 0;
    return Number(localStorage.getItem(lastSeenKey)) || 0;
  });
  const unreadCount = notifications.filter(n => new Date(n.time).getTime() > lastSeen).length;

  useEffect(() => {
    if (notifOpen && lastSeenKey && notifications.length > 0) {
      const newest = Math.max(...notifications.map(n => new Date(n.time).getTime()));
      localStorage.setItem(lastSeenKey, String(newest));
      setLastSeen(newest);
    }
  }, [notifOpen, notifications, lastSeenKey]);

  const navClass = ({ isActive }) => `nav-item${isActive ? ' active' : ''}`;
  const close    = () => setMenuOpen(false);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const updated = await uploadProfilePicture(file);
      // updateUser is needed; we'll keep it simple by reloading auth elsewhere
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60_000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d ago`;
    return new Date(iso).toLocaleDateString();
  };

  return (
    <>
      <div className="tt-body-bg" />
      <div className="orb orb-a" />
      <div className="orb orb-b" />

      <div className="app">
        {menuOpen && <div className="sidebar-backdrop" onClick={close} />}

        <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
          <button className="sidebar-close" onClick={close}>✕</button>
          <Link to={homePath} className="sidebar-logo" onClick={close} title="Go to dashboard">
            <img src={logo} alt="TechTrack" />
          </Link>

          <p className="nav-section-label">Main Menu</p>

          <NavLink className={navClass} to="/dashboard" onClick={close}>
            <IconGrid /> Asset Catalog
          </NavLink>

          {!isAdmin && (
            <NavLink className={navClass} to="/loans" onClick={close}>
              <IconCheck /> My Loans
              {pendingCount > 0 && (
                <span className="nav-badge blue">{pendingCount}</span>
              )}
            </NavLink>
          )}

          {!isAdmin && (
            <NavLink className={navClass} to="/watchlist" onClick={close}>
              <IconHeartNav /> Watchlist
            </NavLink>
          )}

          {isAdmin && (
            <NavLink className={navClass} to="/admin" onClick={close}>
              <IconSettings /> Admin Panel
            </NavLink>
          )}

          <div className="sidebar-footer">
            <NavLink to="/profile" className={({ isActive }) => `user-chip${isActive ? ' active' : ''}`} onClick={close} title="Open profile">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="user-avatar-img" />
              ) : (
                <div className="user-avatar">{userInitials}</div>
              )}
              <div className="user-info">
                <div className="user-name">{userFullName}</div>
                <div className="user-role">
                  {isAdmin ? 'Admin' : 'Student'} · {user?.department || 'CIT'}
                </div>
              </div>
            </NavLink>
          </div>
        </aside>

        {/* Main area — topbar stays fixed, content scrolls */}
        <div className="main">
          <header className="topbar">
            <button className="hamburger" onClick={() => setMenuOpen(true)}>
              <span /><span /><span />
            </button>

            <div className="topbar-title">
              {pageTitle.prefix}{pageTitle.accent && <> <span>{pageTitle.accent}</span></>}
            </div>

            <div className="topbar-actions">
              {/* Notifications */}
              <button
                className="notif-trigger"
                onClick={() => setNotifOpen(o => !o)}
                title="Notifications"
                aria-label="Notifications"
              >
                <IconBell />
                {unreadCount > 0 && (
                  <span className="notif-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="profile-backdrop" onClick={() => setNotifOpen(false)} />
                  <div className="notif-dropdown">
                    <div className="notif-header">
                      <span className="notif-title">Notifications</span>
                      <span className="notif-count">{notifications.length}</span>
                    </div>
                    <div className="notif-list">
                      {notifications.length === 0 ? (
                        <div className="notif-empty">
                          <span style={{ fontSize: 28 }}>🔔</span>
                          <p>You're all caught up</p>
                        </div>
                      ) : notifications.map(n => (
                        <button
                          key={n.id}
                          className={`notif-item notif-${n.tone}`}
                          onClick={() => { setNotifOpen(false); navigate(n.link); }}
                        >
                          <span className="notif-icon">{n.icon}</span>
                          <div className="notif-body">
                            <div className="notif-item-title">{n.title}</div>
                            <div className="notif-item-msg">{n.body}</div>
                            <div className="notif-item-time">{formatTime(n.time)}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="notif-footer">
                      <button
                        className="notif-link"
                        onClick={() => { setNotifOpen(false); navigate(isAdmin ? '/admin' : '/loans'); }}
                      >
                        {isAdmin ? 'Manage loan queue →' : 'View all loans →'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Profile button */}
              <div className="profile-trigger" onClick={() => setProfileOpen(p => !p)} title={userFullName}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="topbar-avatar-img" />
                ) : (
                  <div className="topbar-avatar">{userInitials}</div>
                )}
              </div>

              {/* Profile dropdown */}
              {profileOpen && (
                <>
                  <div className="profile-backdrop" onClick={() => setProfileOpen(false)} />
                  <div className="profile-dropdown">

                    {/* Avatar + name header */}
                    <div className="profile-drop-header">
                      <div
                        className="profile-avatar-wrap"
                        onClick={() => fileRef.current?.click()}
                        title="Click to change photo"
                      >
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="avatar" className="profile-avatar-img" />
                        ) : (
                          <div className="profile-avatar-initials">{userInitials}</div>
                        )}
                        <div className="profile-avatar-overlay"><IconCamera /></div>
                      </div>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png"
                        style={{ display: 'none' }}
                        onChange={handlePhotoChange}
                      />
                      <div className="profile-info">
                        <div className="profile-name">{userFullName}</div>
                        <span className={`profile-role-badge ${isAdmin ? 'admin' : 'student'}`}>
                          {isAdmin ? '⚙ Admin' : '🎓 Student'}
                        </span>
                      </div>
                    </div>

                    <div className="profile-drop-divider" />

                    {/* Quick links */}
                    <div className="profile-drop-actions">
                      <button
                        className="profile-upload-btn"
                        onClick={() => { setProfileOpen(false); navigate('/profile'); }}
                      >
                        Open Profile
                      </button>
                      <button
                        className="profile-logout-btn"
                        onClick={() => { logout(); setProfileOpen(false); }}
                      >
                        <IconLogout /> Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </header>

          {/* Each page renders here — topbar never unmounts */}
          <Outlet context={{ setMenuOpen }} />
        </div>
      </div>
    </>
  );
}
