# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rainbow is a multi-platform Ethereum wallet built with React Native 0.79.5 and TypeScript, supporting iOS, Android, and browser extension platforms. This is a production-ready financial application with enterprise-level architecture.

## Development Commands

### Setup & Installation

- `yarn install` - Install dependencies (required first for corepack yarn)
- `yarn setup` - Complete project setup including GraphQL codegen and network fetching
- `yarn install-bundle && yarn install-pods` - Install Ruby bundles and CocoaPods (macOS)
- `yarn install-all` - Complete installation including pods with repo update
- `yarn fast` - Quick setup for development

### Development

- `yarn start` - Start React Native packager
- `yarn ios` - Run on iPhone 16 Pro simulator
- `yarn android` - Run on Android with custom main activity

### Code Quality & Testing

- `yarn lint` - Run complete linting (format check + TypeScript + ESLint)
- `yarn lint:ts` - TypeScript type checking only
- `yarn lint:js` - ESLint JavaScript/TypeScript checking only
- `yarn format` - Format code with Prettier
- `yarn test` - Run Jest test suite
- `yarn ts-coverage` - Generate TypeScript coverage report (requires 99% coverage)

### Builds

- `yarn ios` - Build and run iOS development
- `yarn ios --configuration Release` - Build and run iOS production
- `yarn android:apk` - Build Android APK
- `yarn android:bundle` - Build Android bundle for release

### GraphQL & Code Generation

- `yarn graphql-codegen` - Generate GraphQL types and hooks
- `yarn codegen-translations` - Generate translation types from language files
- `yarn check-translations` - Validate translation files for missing keys
- `yarn bundle-inpage` - Bundle browser extension injection script

### Utility & Maintenance

- `yarn clean:android` - Clean Android build artifacts
- `yarn clean:ios` - Clean iOS build artifacts
- `yarn clean:packager` - Clean React Native packager cache
- `yarn nuke` - Complete project reset

## Architecture & Code Organization

### Framework Versions & Core Technologies

**Core Framework:**

- **React Native** 0.79.5 - Mobile development framework
- **React** 19.0.0 - UI library
- **TypeScript** 5.5.4 - Type-safe JavaScript (99% coverage requirement)
- **Node.js** 18.x - Runtime environment (see .nvmrc)

**State Management:**

- **Redux** 4.0.5 + **Redux Thunk** 2.3.0 - Global app state
- **Recoil** 0.7.6 - Component-level reactive state
- **React Query** (@tanstack/react-query) 4.2.1 - Server state & caching
- **Zustand** 4.5.5 - Lightweight feature-specific stores

**Navigation & UI:**

- **React Navigation** 6.x - App navigation system
- **React Native Screens** 4.10.0 - Native screen optimization
- **Styled Components** 5.2.1 - CSS-in-JS styling
- **React Native Reanimated** 3.18.0 - High-performance animations
- **React Native Gesture Handler** 2.27.2 - Touch gesture handling
- **React Native Safe Area Context** 5.4.0 - Safe area management

**Blockchain & Web3:**

- **Ethers.js** 5.7.x - Ethereum library
- **Viem** 2.21.54 - Modern TypeScript Web3 library
- **WalletConnect** (@reown/walletkit) 1.1.2 - Wallet protocol
- **ENS Libraries** - Ethereum Name Service integration

**Performance & Monitoring:**

- **Sentry** (@sentry/react-native) 6.15.1 - Error tracking
- **Shopify Performance** (@shopify/react-native-performance) 4.1.2 - Performance monitoring
- **React Native MMKV** 2.12.2 - High-performance storage

**Development & Build Tools:**

- **Metro** 0.79.0 - React Native bundler
- **Babel** 7.25.x - JavaScript compiler
- **ESLint** 8.22.0 - Code linting
- **Prettier** 3.2.5 - Code formatting
- **Jest** 29.7.0 - Testing framework
- **Detox** 20.26.2 - E2E testing
- **Webpack** 5.94.0 - Browser extension bundling

### Directory Structure

```
src/
├── components/     # Reusable UI components (126 directories)
├── screens/        # Screen components (62 directories)
├── hooks/          # Custom React hooks (145 files) - exported from hooks/index.ts
├── utils/          # Utility functions (73 files)
├── state/          # State management (35 directories)
├── redux/          # Redux store and slices
├── navigation/     # Navigation configuration
├── theme/          # Theme and styling (MainThemeProvider)
├── languages/      # Internationalization (LanguageProvider, LanguageContext)
├── handlers/       # Business logic handlers
├── entities/       # Data models
├── graphql/        # GraphQL queries with separate yarn workspace
├── design-system/  # Design system components with separate docs site
├── analytics/      # Analytics and tracking
├── walletConnect/  # WalletConnect protocol integration
├── browser/        # Browser extension specific code
└── __swaps__/      # Token swaps functionality
```

### TypeScript Path Aliases

The project uses extensive path aliases defined in tsconfig.json:

- `@/*` → `./src/*` (primary alias)
- `@rainbow-me/hooks` → `src/hooks`
- `@rainbow-me/utils` → `src/utils`
- `@rainbow-me/components` → `src/components`
- `@rainbow-me/navigation` → `src/navigation`
- And 40+ additional aliases for specific modules

### Platform Support

- **iOS**: Primary platform, requires XCode
- **Android**: Full support with custom Gradle configuration
- **Browser Extension**: Chrome, Firefox, Brave, Edge, Arc - uses Webpack bundling

### State Management Patterns

- **Redux**: Global app state, wallet data, settings
- **React Query**: Server state caching, API responses
- **Recoil**: Component-level reactive state
- **Zustand**: Feature-specific stores
- **MMKV**: High-performance local storage

### Performance & Security

- React.memo usage throughout components
- Shopify Performance library integration
- Sentry error tracking and performance monitoring
- Secure keychain/keystore for sensitive data
- Hardware wallet support (Ledger)
- Biometric authentication

## Development Guidelines

### Code Quality Standards

- TypeScript strict mode enabled with 99% coverage requirement
- ESLint with custom Rainbow configuration
- Prettier for consistent formatting
- Pre-commit hooks via Husky for quality checks
- Lint-staged for automated formatting on commit
- **NEVER amend translated language files** - Only modify `src/languages/en_US.json`, all other language files are managed by translators

### Testing

- **Jest** for unit testing
- **Detox** configured for E2E testing
- Test files: `*.test.ts`, `*.test.tsx`, `__tests__/` directories
- Tests must pass before commits

### App Structure & Providers

The app is wrapped in multiple context providers:

```typescript
<ReduxProvider store={store}>
  <MainThemeProvider>
    <LanguageProvider>
      <RainbowContextWrapper>
        <PersistQueryClientProvider>
          {/* App content */}
        </PersistQueryClientProvider>
      </RainbowContextWrapper>
    </LanguageProvider>
  </MainThemeProvider>
</ReduxProvider>
```

### Environment Setup

- Node.js 18 required (see .nvmrc)
- Environment variables in .env (use .env.example as template)
- Firebase google-services.json required for compilation
- Watchman for file watching (macOS: `brew install watchman`)

### Build System

- **Metro** bundler with custom configuration
- **Babel** with extensive plugin setup for React Native
- **Webpack** for browser extension bundling
- Platform-specific optimizations and conditional code

### Key Features Architecture

- Multi-wallet support with secure storage
- DeFi integrations (swaps, NFTs, DApps)
- WalletConnect protocol support
- ENS domain resolution
- Hardware wallet integration
- Portfolio tracking and analytics

### Debugging & Development Tools

- React Native debugger integration
- Network request/response monitoring
- Flipper support (optional)
- Design system playground (`yarn ds`)
- Development-specific feature flags

## Notes

- Main development branch: `develop`
- Browser extension code shares codebase with mobile
- GraphQL schema and queries managed in separate workspace at `src/graphql/`
- Design system has its own documentation site
- Internationalization files in JSON format with codegen for types
- Extensive use of React Native's new architecture features
