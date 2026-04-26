import { useState, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getMyLoans } from '../api/loanApi';
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
const IconUser = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const PAGE_TITLES = {
  '/dashboard': { prefix: 'Asset',   accent: 'Catalog' },
  '/loans':     { prefix: 'My',      accent: 'Loans'   },
  '/admin':     { prefix: 'Admin',   accent: 'Panel'   },
  '/profile':   { prefix: 'My',      accent: 'Profile' },
};

export default function Layout() {
  const { user, logout, updateUser } = useAuth();
  const [menuOpen, setMenuOpen]     = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [uploading, setUploading]   = useState(false);
  const fileRef = useRef(null);
  const location = useLocation();

  const isAdmin      = user?.role === 'ROLE_ADMIN';
  const userInitials = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() : '?';
  const userFullName = user ? `${user.firstName} ${user.lastName}` : '';
  const avatarUrl    = user?.profilePicture ? getProfilePictureUrl(user.profilePicture) : null;
  const pageTitle    = PAGE_TITLES[location.pathname] ?? { prefix: 'TechTrack', accent: '' };

  const { data: myLoansPage } = useQuery({
    queryKey: ['my-loans-recent'],
    queryFn: () => getMyLoans(0, 50),
    enabled: !!user,
  });
  const pendingCount = (myLoansPage?.content ?? []).filter(
    l => l.status === 'PENDING_APPROVAL'
  ).length;

  const navClass = ({ isActive }) => `nav-item${isActive ? ' active' : ''}`;
  const close    = () => setMenuOpen(false);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const updated = await uploadProfilePicture(file);
      updateUser({ profilePicture: updated.profilePicture });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
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
          <div className="sidebar-logo">
            <img src={logo} alt="TechTrack" />
          </div>

          <p className="nav-section-label">Main Menu</p>

          <NavLink className={navClass} to="/dashboard" onClick={close}>
            <IconGrid /> Asset Catalog
          </NavLink>

          <NavLink className={navClass} to="/loans" onClick={close}>
            <IconCheck /> My Loans
            {pendingCount > 0 && (
              <span className="nav-badge blue">{pendingCount}</span>
            )}
          </NavLink>

          {isAdmin && (
            <NavLink className={navClass} to="/admin" onClick={close}>
              <IconSettings /> Admin Panel
            </NavLink>
          )}

          <NavLink className={navClass} to="/profile" onClick={close}>
            <IconUser /> Profile
          </NavLink>

          <div className="sidebar-footer">
            <div className="user-chip">
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
            </div>
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

                    {/* User details */}
                    <div className="profile-details">
                      <div className="profile-detail-row">
                        <span className="detail-label">Email</span>
                        <span className="detail-value">{user?.email}</span>
                      </div>
                      {user?.department && (
                        <div className="profile-detail-row">
                          <span className="detail-label">Department</span>
                          <span className="detail-value">{user.department}</span>
                        </div>
                      )}
                      {user?.studentId && (
                        <div className="profile-detail-row">
                          <span className="detail-label">Student ID</span>
                          <span className="detail-value">{user.studentId}</span>
                        </div>
                      )}
                      <div className="profile-detail-row">
                        <span className="detail-label">Account ID</span>
                        <span className="detail-value">#{user?.id}</span>
                      </div>
                    </div>

                    <div className="profile-drop-divider" />

                    <div className="profile-drop-actions">
                      <button
                        className="profile-upload-btn"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                      >
                        <IconCamera /> {uploading ? 'Uploading…' : 'Change Photo'}
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
