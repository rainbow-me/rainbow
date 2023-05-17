import { jest } from '@jest/globals';

export default {
  getActiveOptions: jest.fn(),
  getActiveRoute: jest.fn(),
  getActiveRouteName: jest.fn(),
  handleAction: jest.fn(),
  setTopLevelNavigator: jest.fn(),
  transitionPosition: jest.fn(),
};
