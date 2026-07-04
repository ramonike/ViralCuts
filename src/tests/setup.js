import '@testing-library/jest-dom';
import { vi } from 'vitest';

global.jest = vi;

// MSW server is available but not auto-started
// Tests that need MSW should import and start it manually:
// import { server } from './utils/msw-server';
// beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close());

// Create a proper localStorage mock that actually stores data
function createLocalStorageMock() {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
            store[key] = String(value);
        }),
        removeItem: vi.fn((key) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        get length() {
            return Object.keys(store).length;
        },
        key: vi.fn((index) => Object.keys(store)[index] || null),
        // Internal method to reset store for tests
        _reset: () => {
            store = {};
        },
    };
}

const localStorageMock = createLocalStorageMock();
global.localStorage = localStorageMock;

// Mock window.URL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Reset mocks before each test
beforeEach(() => {
    vi.clearAllMocks();
    localStorage._reset();
});
