import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export function PageLayout({ 
    title, 
    subtitle, 
    children, 
    headerActions = null,
    maxWidth = "7xl", // sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl, 7xl, full
    spacing = "standard" // compact, standard, spacious
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    const spacingClasses = {
        compact: "space-y-4",
        standard: "space-y-6", 
        spacious: "space-y-8"
    };

    const maxWidthClasses = {
        sm: "max-w-sm",
        md: "max-w-md", 
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
        "3xl": "max-w-3xl",
        "4xl": "max-w-4xl",
        "5xl": "max-w-5xl",
        "6xl": "max-w-6xl",
        "7xl": "max-w-7xl",
        full: "max-w-full"
    };

    return (
        <div className={`${spacingClasses[spacing]} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            {/* Standardized Header */}
            {(title || subtitle || headerActions) && (
                <div className={`${maxWidthClasses[maxWidth]} mx-auto`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {(title || subtitle) && (
                            <div>
                                {title && (
                                    <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h1>
                                )}
                                {subtitle && (
                                    <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>{subtitle}</p>
                                )}
                            </div>
                        )}
                        {headerActions && (
                            <div className="flex-shrink-0">
                                {headerActions}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Content Container */}
            <div className={`${maxWidthClasses[maxWidth]} mx-auto`}>
                {children}
            </div>
        </div>
    );
}