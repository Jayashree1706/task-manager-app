import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY, loginRequest, setUnauthorizedHandler } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState('');

  // On app start, load the saved token (if any)
  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(TOKEN_KEY);
        if (saved) setToken(saved);
      } catch (e) {
        // ignore, user will just log in again
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (email, password) => {
    const data = await loginRequest(email, password);
    await SecureStore.setItemAsync(TOKEN_KEY, data.access_token);
    setSessionMessage('');
    setToken(data.access_token);
  };

  const signOut = useCallback(async (message = '') => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setSessionMessage(typeof message === 'string' ? message : '');
    setToken(null);
  }, []);

  // When the API says "token expired", log out with a message
  useEffect(() => {
    setUnauthorizedHandler((msg) => signOut(msg || 'Session expired. Please log in again.'));
  }, [signOut]);

  return (
    <AuthContext.Provider value={{ token, loading, signIn, signOut, sessionMessage }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
