export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export function isMockModeEnabled() {
  return USE_MOCKS;
}

export function shouldUseMockToken(token) {
  return isMockModeEnabled() && (!token || token.startsWith('MOCK_TOKEN'));
}

export function requireMockMode(message = 'Mocks are disabled. Set VITE_USE_MOCKS=true to use simulated data.') {
  if (!isMockModeEnabled()) {
    throw new Error(message);
  }
}
