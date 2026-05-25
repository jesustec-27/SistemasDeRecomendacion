import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('biblioflix_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    }
    setLoading(false);
  }, []);

  const saveUser = async (userData) => {
    try {
      // Generar UUID si no tiene y no es matrícula
      if (!userData.id) {
        userData.id = userData.matricula || crypto.randomUUID();
      }
      
      // Guardar en backend
      await axios.post('/api/users', userData);
      
      // Guardar en localStorage
      localStorage.setItem('biblioflix_user', JSON.stringify(userData));
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Error saving user:', error);
      return false;
    }
  };

  const checkUserExists = async (matricula) => {
    try {
      const res = await axios.get(`/api/users/${matricula}`);
      if (res.data && res.data.id) {
        return { exists: true, user: res.data };
      }
      return { exists: false };
    } catch (error) {
      if (error.response?.status === 404) {
        return { exists: false };
      }
      console.error('Error checking user existence:', error);
      throw error;
    }
  };

  const loginUser = async (userData) => {
    try {
      localStorage.setItem('biblioflix_user', JSON.stringify(userData));
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Error logging in user:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('biblioflix_user');
    setUser(null);
  };

  return React.createElement(
    UserContext.Provider,
    { value: { user, loading, saveUser, checkUserExists, loginUser, logout } },
    children
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}


