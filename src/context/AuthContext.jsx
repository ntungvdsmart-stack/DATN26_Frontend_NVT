import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // role: 'guest' | 'admin' | 'staff' | 'customer'
  const [role, setRole] = useState('guest'); 

  const login = (selectedRole) => {
    setRole(selectedRole);
  };

  const logout = () => {
    setRole('guest');
  };

  return (
    <AuthContext.Provider value={{ role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
