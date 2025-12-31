import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../design-system/tokens';
import { scaleIn, hoverScale } from '../../lib/animations';

// Memoized Widget component for better performance
export const Widget = memo(({
    title,
    icon,
    children,
    actions,
    color = 'primary',
    className = '',
    isLoading = false,
}) => {
    const colorMap = {
        primary: tokens.colors.primary[500],
        purple: tokens.colors.widget.purple,
        pink: tokens.colors.widget.pink,
        orange: tokens.colors.widget.orange,
        teal: tokens.colors.widget.teal,
        cyan: tokens.colors.widget.cyan,
        lime: tokens.colors.widget.lime,
    };

    const accentColor = colorMap[color] || colorMap.primary;

    return (
        <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            whileHover={hoverScale}
            className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-all ${className}`}
            style={{
                boxShadow: `0 0 0 1px ${accentColor}10`,
            }}
        >
            {/* Header */}
            <div
                className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between"
                style={{
                    background: `linear-gradient(to right, ${accentColor}15, transparent)`,
                }}
            >
                <div className="flex items-center gap-2">
                    {icon && (
                        <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                            className="p-1.5 rounded-lg"
                            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                        >
                            {icon}
                        </motion.div>
                    )}
                    <h3 className="font-semibold text-white text-sm">{title}</h3>
                </div>
                {actions && (
                    <div className="flex items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"
                        />
                    </div>
                ) : (
                    children
                )}
            </div>
        </motion.div>
    );
});

Widget.displayName = 'Widget';

export default Widget;
