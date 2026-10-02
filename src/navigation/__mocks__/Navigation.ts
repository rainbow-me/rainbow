import { vi } from 'vitest';

export default {
  getActiveOptions: vi.fn(),
  getActiveRoute: vi.fn(),
  getActiveRouteName: vi.fn(),
  handleAction: vi.fn(),
  setTopLevelNavigator: vi.fn(),
  transitionPosition: vi.fn(),
};
