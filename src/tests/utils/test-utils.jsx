import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { JourneyProvider } from '../../contexts/JourneyContext';

/**
 * Mock auth context for testing
 */
const MockAuthContext = React.createContext(null);

export const MockAuthProvider = ({ children, user = null, loading = false }) => {
    const value = {
        user,
        loading,
        signOut: vi.fn(),
    };
    return (
        <MockAuthContext.Provider value={value}>
            {children}
        </MockAuthContext.Provider>
    );
};

export const useMockAuth = () => {
    const context = React.useContext(MockAuthContext);
    if (!context) {
        return { user: null, loading: false, signOut: vi.fn() };
    }
    return context;
};

/**
 * All providers wrapper for testing
 */
const AllProviders = ({ children, authUser = null, authLoading = false }) => {
    return (
        <BrowserRouter>
            <MockAuthProvider user={authUser} loading={authLoading}>
                <ThemeProvider>
                    <NotificationProvider>
                        {children}
                    </NotificationProvider>
                </ThemeProvider>
            </MockAuthProvider>
        </BrowserRouter>
    );
};

/**
 * Custom render function with all providers
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Render options
 * @param {Object} options.authUser - Mock authenticated user
 * @param {boolean} options.authLoading - Auth loading state
 * @param {Object} options.renderOptions - Additional RTL render options
 */
export function renderWithProviders(
    ui,
    {
        authUser = null,
        authLoading = false,
        ...renderOptions
    } = {}
) {
    const Wrapper = ({ children }) => (
        <AllProviders authUser={authUser} authLoading={authLoading}>
            {children}
        </AllProviders>
    );

    return {
        ...render(ui, { wrapper: Wrapper, ...renderOptions }),
        // Return utilities for testing
        rerender: (newUi) =>
            render(newUi, { wrapper: Wrapper, ...renderOptions }),
    };
}

/**
 * Render with minimal providers (no Journey context - avoids API calls)
 */
export function renderWithMinimalProviders(
    ui,
    {
        authUser = null,
        authLoading = false,
        ...renderOptions
    } = {}
) {
    const MinimalWrapper = ({ children }) => (
        <BrowserRouter>
            <MockAuthProvider user={authUser} loading={authLoading}>
                <ThemeProvider>
                    <NotificationProvider>
                        {children}
                    </NotificationProvider>
                </ThemeProvider>
            </MockAuthProvider>
        </BrowserRouter>
    );

    return render(ui, { wrapper: MinimalWrapper, ...renderOptions });
}

/**
 * Helper to simulate authenticated user
 */
export function createAuthenticatedUser(overrides = {}) {
    return {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        image: null,
        ...overrides,
    };
}

/**
 * Helper to wait for async operations
 */
export async function waitForLoadingToFinish() {
    await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Re-export everything from RTL
 */
export * from '@testing-library/react';
