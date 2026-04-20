/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from "react";
import { signIn, signUp, signOut as amplifySignOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import axios from 'axios';

const AuthContext = createContext();

function getRoleFromEmail(email) {
  if (email === 'admin@scholarkit.com')  return 'admin';
  if (email === 'seller@scholarkit.com') return 'seller';
  return 'customer';
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const processToken = async () => {
    try {
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      // Must use ID Token (not Access Token) — Cognito authorizers
      // pass ID Token claims (email, name) to Lambda via requestContext.
      const idToken = session.tokens?.idToken?.toString();
      
      if (idToken) {
        const email = currentUser.signInDetails?.loginId;
        localStorage.setItem("token", idToken);
        setUser({
          id: currentUser.userId,
          email,
          name: session.tokens?.idToken?.payload?.name || email,
          role: getRoleFromEmail(email),
        });
        return true;
      }
    } catch {
      localStorage.removeItem("token");
      setUser(null);
      return false;
    }
  };

  // 1. Check for token on app mount
  useEffect(() => {
    const initAuth = async () => {
      await processToken();
      setLoading(false);
    };
    initAuth();
  }, []);

  const logout = async () => {
    try {
      await amplifySignOut();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  // 2. Login Action
  const login = async (email, password) => {
    const { isSignedIn, nextStep } = await signIn({
      username: email,
      password,
      options: { authFlowType: 'USER_PASSWORD_AUTH' },
    });
    if (!isSignedIn) {
      throw new Error(`Sign-in not complete: ${nextStep?.signInStep || 'unknown step'}`);
    }
    await processToken();
  };

  // 3. Register Action
  const register = async (fullName, email, password) => {
    const parts = fullName.trim().split(' ');
    const givenName  = parts[0] || fullName;
    const familyName = parts.slice(1).join(' ') || '';
    await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          name:        fullName,
          given_name:  givenName,
          family_name: familyName,
        }
      }
    });
    // Cognito requires manual login after signup
    await login(email, password);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children} 
    </AuthContext.Provider>
  );
};

// Custom hook for cleaner usage in components
export const useAuth = () => useContext(AuthContext);
