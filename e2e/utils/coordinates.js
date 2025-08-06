/**
 * Tab bar coordinates for Maestro E2E tests
 *
 * Why this exists:
 * - Our tab bar can't be interacted with in Maestro tests
 * - Maestro needs percentage-based coordinates to tap on tab bar items
 * - Tab bars don't have unique IDs, so we use position-based tapping
 * - Centralizing coordinates here makes tests more maintainable
 *
 * Usage in Maestro tests:
 * 1. Load: - runScript: { file: e2e/utils/coordinates.js }
 * 2. Tap:  - tapOn: { point: ${output.tabCoordinates.discoverTab} }
 */

const tabCoordinates = {
  homeTab: '20%,92%', // Wallet tab
  discoverTab: '35%,92%', // Discover tab
  browserTab: '50%,92%', // Browser tab
  activityTab: '65%,92%', // Activity tab
  pointsTab: '80%,92%', // Points tab
};

// Export to Maestro's output object
// eslint-disable-next-line no-undef
output.tabCoordinates = tabCoordinates;
