import React, { createContext, useEffect, useMemo, useState } from 'react';

export const ThemeContext = createContext({ theme: 'light', setTheme: () => {} });

const THEMES = ['light', 'dark', 'ocean', 'forest', 'sand', 'neon', 'zen'];

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('appTheme') || 'light');

  useEffect(() => {
    localStorage.setItem('appTheme', theme);
    document.body.dataset.theme = theme;
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme, themes: THEMES }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};


