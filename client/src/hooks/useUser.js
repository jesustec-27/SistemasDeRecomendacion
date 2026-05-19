import { useState, useEffect } from 'react';
import axios from 'axios';

export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('biblioia_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      // Opcionalmente verificar con backend
      setUser(parsedUser);
    }
    setLoading(false);
  }, []);

  const saveUser = async (userData) => {
    try {
      // Generar UUID si no tiene
      if (!userData.id) {
        userData.id = crypto.randomUUID();
      }
      
      // Guardar en backend
      await axios.post('/api/users', userData);
      
      // Guardar en localStorage
      localStorage.setItem('biblioia_user', JSON.stringify(userData));
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Error saving user:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('biblioia_user');
    setUser(null);
  };

  return { user, loading, saveUser, logout };
}
