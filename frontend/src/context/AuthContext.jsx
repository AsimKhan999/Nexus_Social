import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as fbAuth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { authAPI, setTokenProvider } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);
  const [fbUser, setFbUser] = useState(null);

  const getFirebaseToken = useCallback(async () => {
    const currentUser = fbAuth.currentUser;
    if (currentUser) {
      return currentUser.getIdToken();
    }
    return null;
  }, []);

  useEffect(() => {
    setTokenProvider(getFirebaseToken);
  }, [getFirebaseToken]);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await authAPI.getMe();
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(fbAuth, (fbUser) => {
      setFbUser(fbUser);
      if (fbUser) {
        loadUser();
      } else {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [loadUser]);

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(fbAuth, email, password);
    const idToken = await cred.user.getIdToken();
    const { data } = await authAPI.login({ idToken });
    localStorage.setItem('token', idToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(fbAuth, email, password);
    const idToken = await cred.user.getIdToken();
    const { data } = await authAPI.register({ name, idToken });
    localStorage.setItem('token', idToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authAPI.getMe();
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch {
    }
  }, []);

  const logout = async () => {
    await signOut(fbAuth);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loadUser, fbUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
