import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Lấy theme đã lưu trong localStorage, mặc định là 'light'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('fashionos-theme') || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    // Tailwind darkMode: 'class' — thêm/bỏ class 'dark' trên <html>
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('fashionos-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
