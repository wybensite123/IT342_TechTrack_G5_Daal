// AuthContext.jsx
// This file creates a global authentication state that any component in the app
// can access without passing props manually through every level (prop drilling).

import { createContext, useContext, useState, useEffect } from 'react';
import { getProfile } from '../api/authApi';

// createContext() creates a "container" that holds auth data globally.
// null is the default value before the Provider wraps the app.
const AuthContext = createContext(null);

// AuthProvider is a wrapper component that supplies the auth state
// to every component nested inside it (defined in App.jsx).
export const AuthProvider = ({ children }) => {

  // user: stores the logged-in user's data (e.g. username, email).
  // Starts as null — meaning no one is logged in yet.
  const [user, setUser] = useState(null);

  // loading: prevents the app from rendering protected routes
  // before we know if the user is already logged in.
  // Starts as true so we wait before making any routing decisions.
  const [loading, setLoading] = useState(true);

  // useEffect with an empty dependency array [] runs ONCE when the app first loads.
  // Its job is to check if the user was already logged in from a previous session
  // by looking for a saved JWT token in localStorage.
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      // If a token exists, call the backend to verify it's still valid
      // and fetch the user's profile data.
      getProfile()
        .then((res) => setUser(res.data))    // Token is valid — save the user data
        .catch(() => localStorage.removeItem('token')) // Token expired or invalid — remove it
        .finally(() => setLoading(false));   // Either way, we're done loading
    } else {
      // No token found — user is not logged in, stop loading immediately.
      setLoading(false);
    }
  }, []); // [] means this only runs once on mount, not on every re-render

  // login() is called after a successful login API response.
  // It saves the JWT token to localStorage so it persists on page refresh,
  // and stores the user data in state so the UI can react to it.
  const login = (token, userData) => {
    localStorage.setItem('token', token); // Persist the token across browser sessions
    setUser(userData);                    // Update state so protected routes unlock
  };

  // logout() clears the session completely.
  // Removing the token means the next page load won't restore the session,
  // and setting user to null causes protected routes to redirect to /login.
  const logout = () => {
    localStorage.removeItem('token'); // Delete the token from storage
    setUser(null);                    // Clear user state — triggers redirect in ProtectedRoute
  };

  // AuthContext.Provider makes { user, loading, login, logout } available
  // to ANY component inside the app that calls useAuth().
  // "children" refers to everything wrapped inside <AuthProvider> in App.jsx.
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth() is a custom hook — a shortcut so any component can simply write:
//   const { user, login, logout } = useAuth();
// instead of the longer: useContext(AuthContext)
export const useAuth = () => useContext(AuthContext);
