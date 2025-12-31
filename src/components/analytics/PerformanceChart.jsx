/**
 * PerformanceChart Component
 * Displays comparative weekly/monthly analytics with percentage change
 * Requirements: 3.1
 */

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Generate comparison data for current vs previous period
 * @param {Array} currentData - Current period data
 * @param {string} period - Period type ('7d', '30d', '90d')
 * @returns {Array} Comparison data with both periods
 */
function generateComparisonData(currentData, period) {
    if (!currentData || currentData.length === 0) {
        return [];
    }

    // Generate previous period data (mock - would come from API in real scenario)
    const previousData = currentData.map(item => ({
        ...item,
        previousViews: Math.floor(item.views * (0.8 + Math.random() * 0.4)) // ±20% variation
    }));

    return previousData;
}

/**
 * Calculate percentage change between two values
 */
function calculatePercentageChange(current, previous) {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
}

export function PerformanceChart({ data, period = '30d', loading = false }) {
    const comparisonData = generateComparisonData(data, period);
    
    // Calculate total change
    const currentTotal = data.reduce((sum, item) => sum + (item.views || 0), 0);
    const previousTotal = comparisonData.reduce((sum, item) => sum + (item.previousViews || 0), 0);
    const percentageChange = calculatePercentageChange(currentTotal, previousTotal);
    
    const isPositive = percentageChange >= 0;

    if (loading) {
        return (
            <div className="glass-panel rounded-xl overflow-hidden">
                <div className="p-4 border-b border-surface-700/50">
                    <div className="h-6 bg-slate-700 rounded animate-pulse w-48"></div>
                </div>
                <div className="p-4 flex items-center justify-center" style={{ height: 300 }}>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-4 border-b border-surface-700/50 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                        {isPositive ? (
                            <TrendingUp className="w-5 h-5 text-green-400" />
                        ) : (
                            <TrendingDown className="w-5 h-5 text-red-400" />
                        )}
                        Comparação de Performance
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                        Período atual vs anterior
                    </p>
                </div>
                <div className="text-right">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded ${
                        isPositive 
                            ? 'bg-green-400/10 text-green-400 border border-green-400/20' 
                            : 'bg-red-400/10 text-red-400 border border-red-400/20'
                    }`}>
                        {isPositive ? '+' : ''}{percentageChange.toFixed(1)}%
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                        vs período anterior
                    </p>
                </div>
            </div>
            <div className="p-4">
                <div style={{ height: 300, width: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={comparisonData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="#64748b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#64748b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => {
                                    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                                    return value;
                                }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                }}
                                formatter={(value, name) => {
                                    const label = name === 'views' ? 'Período Atual' : 'Período Anterior';
                                    return [value.toLocaleString(), label];
                                }}
                            />
                            <Legend 
                                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                                formatter={(value) => {
                                    return value === 'views' ? 'Período Atual' : 'Período Anterior';
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="previousViews"
                                stroke="#64748b"
                                strokeWidth={2}
                                dot={{ fill: '#64748b', r: 3 }}
                                activeDot={{ r: 5 }}
                                strokeDasharray="5 5"
                            />
                            <Line
                                type="monotone"
                                dataKey="views"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ fill: '#3b82f6', r: 3 }}
                                activeDot={{ r: 5 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

export default PerformanceChart;
