# API Wishlist

## Missing Data from Backend

### DApp Colors

The API currently returns empty `colors: {}` objects for `position.dapp.colors` (protocol brand colors).

**Desired:** API should provide:

```typescript
{
  primary: string; // Main brand color (e.g., Uniswap pink #FF007A)
  fallback: string; // Secondary color
  shadow: string; // Shadow/accent color
}
```

**Impact:** Position cards and UI elements display generic black/gray colors instead of recognizable protocol brand colors (Uniswap pink, Aave purple, etc.)

**Considered solution:** Extract dominant color from `dapp.iconUrl` using `getDominantColorFromImage()` utility. However, this is async and would require making the entire parsing pipeline async, which adds complexity. Better to have the API provide colors directly.

**Files affected:**

- `src/features/positions/parsers/protocol.ts` (default color fallback logic)
- `src/features/positions/components/PositionCard.tsx` (uses colors for card styling)
- `src/features/positions/screens/PositionSheet.tsx` (uses colors for header)

---

### DApp Name Normalization

The API returns `position.dapp.name` with version suffixes that need client-side parsing (e.g., "Aave V2", "Uniswap v3").

**Issue:**

- Protocol names include version suffixes inconsistently formatted
- Requires client-side regex cleanup to normalize for display

**Desired:**

- `position.dapp.name` should be the clean protocol name without version (e.g., "Aave", "Uniswap")
- Version should be consistently provided in `position.protocolVersion` field

**Workaround:**

```typescript
// src/features/positions/parsers/protocol.ts
function normalizeDappName(name: string): string {
  return name.replace(/\s+v\d+$/i, '').trim();
}
```

**Files affected:**

- `src/features/positions/parsers/protocol.ts` (normalizeDappName function)

---

### DApp URL Issues

The API returns version-specific URLs in `position.dapp.url`, but our grouping by `canonicalProtocolName` causes us to use inconsistent URLs.

**Issue:**

- We group positions by canonical name (e.g., "compound") but each version has different URLs
- Example: Compound V2 = `https://app.compound.finance`, Compound V3 = `https://v3-app.compound.finance`
- Current logic takes the URL from whichever position happens to be processed last, leading to incorrect URLs

**Current behavior:**

```typescript
// src/features/positions/parsers/protocol.ts
if (position.dapp && (!grouped[canonicalName].dapp || !grouped[canonicalName].dapp.icon_url)) {
  grouped[canonicalName].dapp = { url: position.dapp.url, ... };
}
```

**Impact:**

- Position cards may link to wrong protocol version URL
- User clicks Compound V3 card but lands on Compound V2 app (or vice versa)

**Possible solutions:**

1. Backend should return canonical protocol URLs (not version-specific)
2. Or provide separate `canonicalUrl` field alongside version-specific URLs
3. Or we need client-side mapping of canonical protocols to their primary URLs

**Files affected:**

- `src/features/positions/parsers/protocol.ts` (groupByCanonicalProtocol function)
- `src/features/positions/components/PositionCard.tsx` (uses dapp.url)

---

### Asset Metadata

The API returns basic DeBank asset data but lacks the rich Rainbow metadata we use elsewhere in the app.

**Missing:**

- Rainbow CMS override data (token name overrides, verified status, custom icons)
- `asset.colors` - Currently returns empty `colors: {}` objects
- Rainbow CDN icon URLs (currently returns DeBank icons)
- Additional metadata fields used by Rainbow's asset system

**Impact:**

- Position assets don't have the same quality and metadata as wallet assets
- We can't update token metadata from the CMS and override

**Workaround:**

- Currently requires calling `useExternalToken()` for each position cell to fetch Rainbow metadata, which is heavy on the network and causes performance issues

**Files affected:**

- `src/features/positions/parsers/asset.ts` (asset transformation)
- `src/features/positions/components/*` (asset display components)

---

### Asset Price Change Data

The API returns `asset.price.value` but lacks 24h price change data that's available in other Rainbow asset endpoints.

**Missing:**

- `changed_at` - Timestamp when price was last updated
- `relative_change_24h` - 24h percentage price change (e.g., 0.05 for +5%)

**Current state:**

```typescript
// src/features/positions/types/index.ts
export type PositionAssetPrice = Omit<AssetPrice, 'changedAt' | 'relativeChange24h'> & {
  changed_at?: number; // always undefined currently
  relative_change_24h?: number; // always undefined currently
};
```

**Impact:**

- Cannot show price change indicators on position assets
- Inconsistent UX compared to wallet assets which show 24h price changes

**Files affected:**

- `src/features/positions/types/index.ts` (PositionAssetPrice type)
- `src/features/positions/components/*` (asset display components)

---

### Asset Timestamps - Go Zero Time Values

**Problem:**
Go backend returns `time.Time{}` (zero value) for unavailable timestamps, serialized as `"0001-01-01 00:00:00 +0000 UTC"`. This format is not valid ISO-8601 for JavaScript's `Date` constructor.

**Issues:**

1. **Invalid format:** Go uses `"2018-11-24 21:45:52 +0000 UTC"` but JS requires `"2018-11-24T21:45:52+00:00"`
   - Space instead of `T` separator between date and time
   - Space before timezone offset
   - No colon in offset (`+0000` vs `+00:00`)
   - Literal `"UTC"` suffix not allowed in ISO-8601
2. **Zero time detection:** `"0001-01-01..."` represents missing data but gets parsed as year 2001
3. **Result:** `RangeError: Invalid time value` when calling `new Date()` or `Intl.DateTimeFormat.format()`

**Solution:**

Use `normalizeDate()` utility in `src/features/positions/stores/transform/utils/date.ts`:

```typescript
import { normalizeDate } from './utils/date';

// Normalizes Go format and filters zero time
const creationDate = normalizeDate(token.asset.creationDate);
// "2018-11-24 21:45:52 +0000 UTC" → "2018-11-24T21:45:52+00:00"
// "0001-01-01 00:00:00 +0000 UTC" → undefined

// For Date objects (from protobuf)
const changedAtStr = normalizeDate(token.asset.price.changedAt);
const changed_at = changedAtStr ? token.asset.price.changedAt.getTime() : undefined;
```

**Transformations applied:**

1. Remove literal `"UTC"` suffix
2. Replace first space with `T`
3. Remove space before offset sign
4. Add colon to offset: `+0000` → `+00:00`
5. Return `undefined` for dates starting with `"0001-01-"`

**Files affected:**

- `src/features/positions/stores/transform/utils/date.ts` (normalizeDate utility)
- `src/features/positions/stores/transform/index.ts` (transforms timestamps)

---

## Generated Type Modifications

⚠️ **Manual edits to generated files** — These auto-generated protobuf TypeScript files are marked "DO NOT EDIT" but needed manual changes to match the actual API response shape. Changes will be lost if types are regenerated.

**Files modified:**

- `src/features/positions/types/generated/positions/positions.ts`
- `src/features/positions/types/generated/common/asset.ts`
- `src/features/positions/types/generated/common/dapp.ts`

### Changes Made

1. **`Position.protocolVersion: string`** → **`protocolVersion?: string`**

   - API omits this field for some protocols in the response
   - Example: Many positions in fixture have no `protocolVersion` property

2. **`Detail` token lists** → all made optional

   - `supplyTokenList?: PositionToken[]`
   - `rewardTokenList?: PositionToken[]`
   - `borrowTokenList?: PositionToken[]`
   - `tokenList?: PositionToken[]`
   - API omits arrays when empty/not applicable rather than sending `[]`
   - Example: Liquidity pool positions only have `supplyTokenList`, omit the others

3. **`PortfolioItem.assetDict`** → **`Partial<Record<string, string>>`**

   - Was: `{ [key: string]: string }`
   - TypeScript's JSON import creates unions with `undefined` across heterogeneous objects
   - Example: Position A has `{"0xabc": "10"}`, Position B has `{"0xdef": "20"}` → TS infers both keys as optional on both objects

4. **`ListPositionsResponse.errors: string[]`** → **`errors?: string[]`**

   - Success responses omit this field entirely instead of returning `[]`

5. **`ListPositionsResponse_Result.uniqueTokens: string[]`** → **`uniqueTokens?: string[]`**

   - Empty position responses omit this field

6. **`ListPositionsResponse_Result.stats`** → **`stats?: EnhancedStats`**

   - Empty position responses omit this field

7. **`Asset.mainnetAddress: string`** → **`mainnetAddress?: string`**

   - Backend doesn't populate this field yet for any assets
   - Likely intended for L2→L1 token mapping

8. **`AssetBridging.bridgeable: boolean`** → **`bridgeable?: boolean`**

   - API sends `bridging: {}` for assets without bridging support

9. **`AssetBridging.networks`** → **`networks?: { [key: string]: AssetBridgeNetworkInfo }`**

   - API sends `bridging: {}` for assets without bridging support

10. **`DApp_Colors.shadow: string`** → **`shadow?: string`**
    - API only provides `primary` and `fallback` colors
    - Example: `{"primary": "#808088", "fallback": "#E8EAF5"}` (no `shadow`)

**Fix:** Update proto definitions to match these optionality requirements, then regenerate types.
