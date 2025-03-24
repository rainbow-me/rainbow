# Rainbow Performance Guide

## Performance Profiling Tools

The codebase now includes built-in performance profiling capabilities. Here's how to use them:

```
# .env

ENABLE_WALLETSCREEN_PERFORMANCE_LOGS=1
```

### In useWalletSectionsData Hook

The `useWalletSectionsData` hook has been instrumented with performance measurement. When `ENABLE_WALLETSCREEN_PERFORMANCE_LOGS` is set to `1`, you'll see detailed execution times in the console:

```
⏱️ [PERF] useAccountSettings: 2.34ms
⏱️ [PERF] useWallets: 1.87ms
⏱️ [PERF] useUserAssetsStore-legacyUserAssets: 15.23ms
...
⏱️ [PERF] useWalletSectionsData-total: 45.67ms
```

### In WalletScreen Component

The WalletScreen also includes render timing measurements:

```
⏱️ [PERF] WalletScreen first render: 78.45ms
⏱️ [PERF] WalletScreen re-render: 32.12ms
```

### In buildWalletSections Helpers

The sections builder is instrumented with more granular measurement:

```
🔍 [PERF-SECTION] buildBriefCoinsList: 8.56ms
🔍 [PERF-SECTION] buildBriefUniqueTokenList: 12.34ms
...
```

## Identified Performance Bottlenecks

Based on profiling, these are the primary bottlenecks:

1. **Data Processing in `buildBriefCoinsList`**: The function that processes and formats coin data for display is computationally expensive.

2. **Selector Recomputation**: The wallet sections selector rebuilds data too frequently even when inputs haven't changed meaningfully.

3. **NFT Loading**: Loading and processing NFT data can be slow, especially for wallets with many NFTs.

4. **Hook Dependencies**: Some hooks have too many dependencies, causing unnecessary recalculations.

## Implemented Optimizations

1. **Added Memoization**: Using custom `useCachedSelector` to avoid recomputing when inputs haven't changed.

2. **Component Memoization**: Applied `React.memo` to prevent unnecessary re-renders.

3. **Property Memoization**: Used `useMemo` for derived values like `disableRefreshControl`.

4. **Component Splitting**: Created `UtilityComponents` to isolate parts that don't need frequent updates.

## Future Optimization Strategies

1. **Code Splitting and Lazy Loading**:
   - Load NFT data only after the main wallet assets are displayed
   - Consider using React.lazy and Suspense for component-level code splitting

2. **Data Structure Optimizations**:
   - Use normalized data structures to avoid deep object cloning
   - Implement structural sharing patterns for immutable updates

3. **Component Architecture**:
   - Break down the AssetList into smaller, more focused components
   - Create specialized renderers for different asset types

4. **Progressive Enhancement**:
   - Show skeleton UI while data is loading
   - Implement virtualized lists using RecyclerListView or similar

5. **Caching Strategies**:
   - Implement time-based cache invalidation for selector results
   - Use service workers or local storage for persistent caching

## Measuring Impact

To measure the impact of performance optimizations:

1. Enable the performance logging by setting `ENABLE_WALLETSCREEN_PERFORMANCE_LOGS=1` in .env
2. Run the app and navigate to the wallet screen
3. Check the console logs for timing data
4. Compare timing before and after your changes
5. Use React DevTools Profiler for more detailed component rendering analysis
6. Test on both high-end and low-end devices to ensure broad performance improvements

## Performance Budget

For optimal user experience, aim for these performance targets:

- Initial wallet screen render: < 500ms
- Subsequent renders: < 100ms
- List scrolling: 60fps (16.67ms per frame)
- Data processing operations: < 50ms
