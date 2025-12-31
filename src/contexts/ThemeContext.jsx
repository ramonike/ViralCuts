import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        // Load theme from localStorage or default to 'dark'
        return localStorage.getItem('viralcuts-theme') || 'dark';
    });

    const [density, setDensity] = useState(() => {
        // Load density from localStorage or default to 'comfortable'
        return localStorage.getItem('viralcuts-density') || 'comfortable';
    });

    useEffect(() => {
        // Save theme to localStorage
        localStorage.setItem('viralcuts-theme', theme);
        
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update body class for theme
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${theme}`);
    }, [theme]);

    useEffect(() => {
        // Save density to localStorage
        localStorage.setItem('viralcuts-density', density);
        
        // Apply density to document
        document.documentElement.setAttribute('data-density', density);
        
        // Update body class for density
        document.body.className = document.body.className.replace(/density-\w+/g, '');
        document.body.classList.add(`density-${density}`);
    }, [density]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const changeDensity = (newDensity) => {
        setDensity(newDensity);
    };

    return (
        <ThemeContext.Provider value={{
            theme,
            setTheme,
            toggleTheme,
            density,
            setDensity,
            changeDensity
        }}>
            {children}
        </ThemeContext.Provider>
    );
};