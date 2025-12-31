/**
 * MSW Server Setup for Testing
 * Configures the mock server for use in tests
 */

import { setupServer } from 'msw/node';
import { handlers, errorHandlers } from './msw-handlers';

// Create the server with default handlers
export const server = setupServer(...handlers);

/**
 * Use error handler for specific test
 * @param {string} errorType - Type of error: 'networkError', 'serverError', 'unauthorized', 'notFound'
 */
export function useErrorHandler(errorType) {
    const handler = errorHandlers[errorType];
    if (handler) {
        server.use(handler);
    }
}

/**
 * Reset handlers to defaults
 */
export function resetHandlers() {
    server.resetHandlers();
}

/**
 * Add custom handler for specific test
 */
export function useHandler(handler) {
    server.use(handler);
}

export default server;
