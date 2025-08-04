/*
# Tab Coordinates for Maestro Tests

## Usage

1. **Load the coordinates** at the beginning of your test file:
   ```yaml
   - runScript:
       file: e2e/utils/coordinates.js
   ```

2. **Access coordinates** using the `output` prefix:
   ```yaml
   - tapOn:
       point: ${output.tabCoordinates.discoverTab}
   ```

## Available Coordinates

- `homeTab`: '20%,92%'
- `discoverTab`: '35%,92%'
- `browserTab`: '50%,92%'
- `activityTab`: '65%,92%'
- `pointsTab`: '80%,92%'

## Important Notes

- The coordinates MUST be loaded with `runScript` before use
- Always use `${output.tabCoordinates.NAME}` syntax (not `${tabCoordinates.NAME}`)
- The Y coordinate (92%) may need adjustment based on device/screen size

## Example

```yaml
appId: com.rainbow
---
# Load coordinates first
- runScript:
    file: e2e/utils/coordinates.js

# Navigate through tabs
- tapOn:
    point: ${output.tabCoordinates.homeTab}
- tapOn:
    point: ${output.tabCoordinates.discoverTab}
``` 

*/

// Tab coordinates for Maestro tests
// Usage: - runScript: { file: e2e/utils/coordinates.js }
// Access: ${output.tabCoordinates.homeTab}

const tabCoordinates = {
  homeTab: '20%,92%',
  discoverTab: '35%,92%',
  browserTab: '50%,92%',
  activityTab: '65%,92%',
  pointsTab: '80%,92%',
};

// Make available to Maestro tests
// eslint-disable-next-line no-undef
output.tabCoordinates = tabCoordinates;
