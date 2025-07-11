# NFT Store Pagination

This document describes how the NFT store handles pagination with automatic pageKey expiration.

## Overview

The NFT store implements a pagination system that automatically handles expired pageKeys to ensure users can always continue browsing their NFT collections, even after returning to the app after some time.

## Key Features

### 1. PageKey Tracking

- Each fetched page is tracked with a timestamp in `fetchedPages`
- The initial page is tracked as `fetchedPages.initial`
- Subsequent pages are tracked with their pageKey as the key

### 2. Automatic Staleness Detection

- PageKeys are considered stale after 30 seconds (configurable via `PAGINATION_STALE_TIME`)
- When attempting to fetch the next page, the system checks if the last fetch was more than 30 seconds ago
- If stale, it automatically refetches from the beginning to get a fresh pageKey

### 3. Error Recovery

- If a pageKey is rejected by the server (expired or invalid), the system automatically refetches from the beginning
- This ensures users never get stuck unable to paginate

### 4. Memory Management

- Old pageKey timestamps (older than 1 minute) are automatically cleaned up to prevent memory leaks
- The cleanup happens during pagination to keep the store efficient

### 5. Cache Support

- When loading from cache, the system sets an initial timestamp to prevent immediate refetch
- The timestamp is set to half the stale time ago, giving users 15 seconds to start paginating

## Usage

```typescript
// Fetch next page of NFT collections
onEndReached={nftStore.getState().fetchNextNftCollectionPage}

// Check if there are more pages
const hasMore = nftStore.getState().hasNextNftCollectionPage();
```

## Configuration

- `PAGE_SIZE`: Number of collections per page (default: 12)
- `PAGINATION_STALE_TIME`: Time before pageKey is considered stale (default: 30 seconds)
- `STALE_TIME`: Time before collection data is considered stale (default: 10 minutes)

## Testing

Run the pagination tests:

```bash
npm test src/state/nfts/__tests__/createNftsStore.test.ts
```

The tests cover:

- Basic pagination flow
- Stale pageKey handling
- Error recovery
- Concurrent request prevention
- Memory cleanup
- Cache loading scenarios
