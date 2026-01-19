const fs = require('fs');
const path = require('path');
const { parse: babelParse } = require('@babel/parser');
const data = fs.readFileSync(path.resolve(__dirname, './globalVariables.js'), 'utf8');
const { parse } = require('ast-parser');

// syntax in globalVariables.js's imports is not supported here
const globalVars = parse(babelParse(data, { sourceType: 'module' }))
  .program.body.find(e => e.nodeType === 'ExportDefaultDeclaration')
  .declaration.properties.map(e => e.key.name)
  .reduce(
    (acc, variable) => {
      acc[variable] = true;
      return acc;
    },
    {
      __DEV__: true,
    }
  );

// TODO(FEPLAT-5): Legacy barrel files that are allowed to exist (but should be gradually removed)
const allowedBarrelFiles = [
  'src/__swaps__/screens/Swap/resources/search/index.ts',
  'src/analytics/__mocks__/index.ts',
  'src/analytics/index.ts',
  'src/components/3d/index.ts',
  'src/components/activity-list/index.ts',
  'src/components/animations/ButtonPressAnimation/index.ts',
  'src/components/animations/index.ts',
  'src/components/asset-list/index.ts',
  'src/components/asset-list/RecyclerAssetList/index.tsx',
  'src/components/asset-list/RecyclerAssetList2/index.tsx',
  'src/components/backup/index.ts',
  'src/components/buttons/hold-to-authorize/index.ts',
  'src/components/buttons/rainbow-button/index.ts',
  'src/components/cards/NFTOffersCard/index.tsx',
  'src/components/cards/remote-cards/index.ts',
  'src/components/coin-icon/index.ts',
  'src/components/CurrencyInput/index.ts',
  'src/components/drag-and-drop/components/index.ts',
  'src/components/drag-and-drop/features/index.ts',
  'src/components/drag-and-drop/features/sort/components/index.ts',
  'src/components/drag-and-drop/features/sort/hooks/index.ts',
  'src/components/drag-and-drop/features/sort/index.ts',
  'src/components/drag-and-drop/hooks/index.ts',
  'src/components/drag-and-drop/index.ts',
  'src/components/drag-and-drop/types/index.ts',
  'src/components/drag-and-drop/utils/index.ts',
  'src/components/ens-registration/index.tsx',
  'src/components/expanded-state/chart/chart-data-labels/index.ts',
  'src/components/expanded-state/chart/index.ts',
  'src/components/expanded-state/index.ts',
  'src/components/images/index.ts',
  'src/components/remote-promo-sheet/check-fns/index.ts',
  'src/components/sheet/sheet-action-buttons/index.ts',
  'src/components/unique-token/index.ts',
  'src/components/video/index.ts',
  'src/config/index.ts',
  'src/design-system/docs/components/CodePreview/index.tsx',
  'src/design-system/docs/components/DocsAccordion/index.tsx',
  'src/design-system/docs/components/index.tsx',
  'src/design-system/docs/pages/index.tsx',
  'src/design-system/docs/system/index.tsx',
  'src/design-system/index.ts',
  'src/ens-avatar/src/index.ts',
  'src/entities/index.ts',
  'src/entities/transactions/index.ts',
  'src/features/perps/components/Slider/index.ts',
  'src/features/perps/services/index.ts',
  'src/features/positions/stores/transform/index.ts',
  'src/features/positions/types/index.ts',
  'src/featuresToUnlock/index.ts',
  'src/graphql/index.ts',
  'src/helpers/index.ts',
  'src/hooks/charts/index.ts',
  'src/hooks/index.ts',
  'src/keychain/index.ts',
  'src/languages/index.ts',
  'src/logger/index.ts',
  'src/migrations/index.ts',
  'src/navigation/bottom-sheet/index.ts',
  'src/navigation/index.ts',
  'src/notifications/settings/index.ts',
  'src/parsers/index.ts',
  'src/performance/start-time/index.ts',
  'src/performance/tracking/index.ts',
  'src/rainbow-fetch/index.ts',
  'src/raps/actions/index.ts',
  'src/react-native-animated-charts/src/index.ts',
  'src/react-query/index.ts',
  'src/references/ens/index.ts',
  'src/references/index.ts',
  'src/references/opensea/index.ts',
  'src/references/rainbow-token-list/index.ts',
  'src/references/signatureRegistry/index.ts',
  'src/resources/f2c/index.ts',
  'src/resources/nfts/index.ts',
  'src/resources/nfts/simplehash/index.ts',
  'src/screens/AddCash/index.tsx',
  'src/screens/Diagnostics/index.tsx',
  'src/screens/expandedAssetSheet/components/sections/index.tsx',
  'src/screens/Explain/index.tsx',
  'src/screens/NFTOffersSheet/index.tsx',
  'src/screens/NFTSingleOfferSheet/index.tsx',
  'src/screens/NotificationsPromoSheet/index.tsx',
  'src/screens/Portal/index.tsx',
  'src/screens/token-launcher/types/index.ts',
  'src/screens/WelcomeScreen/index.tsx',
  'src/state/appSessions/index.ts',
  'src/state/browserHistory/index.ts',
  'src/state/connectedToAnvil/index.ts',
  'src/state/legacyFavoriteDapps/index.ts',
  'src/state/nonces/index.ts',
  'src/state/pendingTransactions/index.ts',
  'src/state/staleBalances/index.ts',
  'src/state/walletConnectRequests/index.ts',
  'src/storage/index.ts',
  'src/styled-thing/index.tsx',
  'src/theme/index.ts',
  'src/utils/index.ts',
  'src/walletConnect/index.tsx',
];

module.exports = {
  root: true,
  extends: ['rainbow', 'plugin:yml/standard'],
  parserOptions: {
    project: ['./tsconfig.json'],
  },
  plugins: ['yml'],
  globals: globalVars,

  overrides: [
    {
      files: ['*.yml', '*.yaml'],
      parser: 'yaml-eslint-parser',
      rules: {
        // currently we use single quotes for yaml files
        'yml/quotes': ['warn', { prefer: 'single', avoidEscape: false }],
        // we also put scalars in quotes
        'yml/plain-scalar': 'off',
      },
    },
    {
      files: ['**/index.ts', '**/index.tsx'],
      excludedFiles: allowedBarrelFiles,
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: 'ExportNamedDeclaration, ExportAllDeclaration, ExportDefaultDeclaration',
            message: 'Barrel files (index.ts) are not allowed. Export directly from source files instead of re-exporting.',
          },
        ],
      },
    },
  ],
  rules: {
    'no-restricted-imports': [
      'warn',
      {
        paths: [
          {
            name: 'react-native',
            importNames: ['StatusBar'],
            message: 'Use SystemBars from "react-native-edge-to-edge" instead.',
          },
        ],
        patterns: [
          {
            group: ['@react-navigation/core'],
            message: 'You probably want to use @/navigation instead, to ensure that all of our customizations are applied.',
          },
        ],
      },
    ],
    'jest/expect-expect': 'off',
    'jest/no-disabled-tests': 'off',
    'no-await-in-loop': 'off',
    'no-nested-ternary': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-hooks/exhaustive-deps': [
      'warn',
      {
        additionalHooks:
          '(useDeepCompareEffect|useDeepCompareCallback|useDeepCompareMemo|useDeepCompareImperativeHandle|useDeepCompareLayoutEffect|useChangeEffect)',
      },
    ],
  },
};
