import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { uploadProfilePicture, getProfilePictureUrl } from '../../api/profileApi';
import './ProfilePage.css';

const IconCamera = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);
const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const ProfilePage = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Defensive: render a friendly empty state if user is somehow null.
  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <p className="profile-empty">Profile data unavailable. Please sign in again.</p>
          <button className="profile-btn-logout" onClick={() => navigate('/login')}>
            Go to login
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'ROLE_ADMIN';
  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || '—';
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?';
  const avatarUrl = user.profilePicture ? getProfilePictureUrl(user.profilePicture) : null;

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Please choose a JPG or PNG image.');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const updated = await uploadProfilePicture(file);
      updateUser({ profilePicture: updated.profilePicture });
    } catch (err) {
      setError(
        err?.response?.data?.error?.message ||
        err?.message ||
        'Could not upload the photo. Please try again.'
      );
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleLogout = () => {
    try { logout(); } catch (_) { /* logout is fire-and-forget */ }
    navigate('/login', { replace: true });
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        {/* Header */}
        <div className="profile-header">
          <div
            className="profile-avatar-wrap"
            onClick={() => !uploading && fileRef.current?.click()}
            title="Click to change photo"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-initials">{initials}</div>
            )}
            <div className="profile-avatar-overlay">
              <IconCamera />
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png"
            style={{ display: 'none' }}
            onChange={handlePhotoChange}
          />

          <h2 className="profile-name">{fullName}</h2>
          <span className={`profile-role-badge ${isAdmin ? 'admin' : 'student'}`}>
            {isAdmin ? '⚙ Admin' : '🎓 Student'}
          </span>
        </div>

        {error && <div className="profile-error">{error}</div>}

        {/* Details */}
        <div className="profile-section">
          <h3 className="profile-section-title">Account Information</h3>

          <DetailRow label="Email" value={user.email || '—'} />
          <DetailRow label="Role" value={isAdmin ? 'Administrator' : 'Borrower'} />
          {user.department && <DetailRow label="Department" value={user.department} />}
          {user.studentId && <DetailRow label="Student ID" value={user.studentId} />}
          <DetailRow label="Account ID" value={`#${user.id}`} />
        </div>

        {/* Actions */}
        <div className="profile-actions">
          <button
            type="button"
            className="profile-btn-photo"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            <IconCamera /> {uploading ? 'Uploading…' : 'Change Photo'}
          </button>

          <button
            type="button"
            className="profile-btn-logout"
            onClick={handleLogout}
          >
            <IconLogout /> Logout
          </button>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="profile-detail-row">
    <span className="detail-label">{label}</span>
    <span className="detail-value">{value}</span>
  </div>
);

export default ProfilePage;
