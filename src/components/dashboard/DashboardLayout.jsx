import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SidebarLeft } from './SidebarLeft';
import { NotificationBadge } from '../notifications/NotificationBadge';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, X, Bell } from 'lucide-react';

const PAGE_TITLES = {
    '/dashboard': 'Dashboard',
    '/dashboard/videos': 'Vídeos',
    '/dashboard/calendar': 'Calendário',
    '/dashboard/analytics': 'Analytics',
    '/dashboard/creation': 'Criação IA',
    '/dashboard/profile': 'Perfil',
    '/dashboard/settings': 'Configurações',
};

export const DashboardLayout = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const pageTitle = PAGE_TITLES[location.pathname] || 'Dashboard';

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>

            {/* ── Sidebar (desktop) ─────────────────────────────── */}
            <SidebarLeft />

            {/* ── Mobile Overlay ────────────────────────────────── */}
            {mobileMenuOpen && (
                <div
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 45,
                        background: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(4px)',
                    }}
                />
            )}

            {/* ── Mobile Sidebar Drawer ─────────────────────────── */}
            <div style={{
                position: 'fixed', inset: 0, left: 0, zIndex: 50,
                width: 220,
                transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.25s ease',
            }}
                className="lg:hidden"
            >
                <SidebarLeft />
            </div>

            {/* ── Main area ─────────────────────────────────────── */}
            <div className="vc-main">

                {/* Topbar */}
                <div className="vc-topbar">
                    {/* Timeline pulse bar — signature element */}
                    <div className="vc-timeline-bar" />

                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        style={{
                            display: 'none', // shown via CSS on mobile
                            padding: '6px',
                            background: 'none',
                            border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                        }}
                        className="mobile-menu-btn"
                    >
                        {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>

                    {/* Page breadcrumb */}
                    <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        letterSpacing: '-0.01em',
                    }}>
                        {pageTitle}
                    </span>

                    <div style={{ flex: 1 }} />

                    {/* Notifications */}
                    <NotificationBadge />
                </div>

                {/* Page Content */}
                <main style={{ padding: '24px 28px' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
