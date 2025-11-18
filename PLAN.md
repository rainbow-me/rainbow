# Ethers to Viem Migration Plan

## Migration Status

### ✅ Completed Migrations (9/22)
1. ✅ @ethersproject/constants → viem
2. ✅ @ethersproject/address → viem
3. ✅ @ethersproject/units → viem
4. ✅ @ethersproject/bytes → viem
5. ✅ @ethersproject/strings → viem
6. ✅ @ethersproject/keccak256 → viem
7. ✅ @ethersproject/sha2 → native crypto
8. ✅ @ethersproject/logger → removed
9. ✅ @ethersproject/properties → native JavaScript

### 🚧 Pending Migrations (13/22)
**High Complexity (requires major refactoring):**
- ⏳ @ethersproject/providers → viem (affects many files)
- ⏳ @ethersproject/bignumber → native bigint (affects many files, decimal handling)
- ⏳ @ethersproject/contracts → viem (affects many files)
- ⏳ @ethersproject/abstract-signer → viem/accounts + custom wrapper

**Medium Complexity:**
- ⏳ @ethersproject/abstract-provider → viem types
- ⏳ @ethersproject/transactions → viem
- ⏳ @ethersproject/abi → viem
- ⏳ @ethersproject/hdnode → viem/accounts
- ⏳ @ethersproject/wallet → viem/accounts

**Simple:**
- ⏳ @ethersproject/solidity → viem (minimal usage)
- ⏳ @ethersproject/random → remove (no direct usage)
- ⏳ @ethersproject/shims → remove (not needed)
- ⏳ ethers (full package) → viem (test/dev contexts only)

---

## @ethersproject/constants → viem

**Old import:**
```typescript
import { AddressZero, MaxUint256 } from '@ethersproject/constants';
```

**New import:**
```typescript
import { zeroAddress, maxUint256 } from 'viem';
```

**Tasks:**
- [x] Replace `AddressZero` with `zeroAddress` in `src/raps/utils.ts`
- [x] Replace `MaxUint256` with `maxUint256` in `src/raps/actions/unlock.ts`
- [x] Replace `AddressZero` with `zeroAddress` in `src/raps/registerENS.ts`
- [x] Replace constants in `src/resources/assets/anvilAssets.ts`
- [x] Replace constants in `src/screens/SendConfirmationSheet.tsx`
- [x] Replace constants in remaining 3 files using this package (handlers/swap.ts, raps/actions/claimBridge.ts, __swaps__/screens/Swap/components/ExchangeRateBubble.tsx)
- [x] Remove `@ethersproject/constants` from package.json dependencies

## @ethersproject/address → viem/utils

**Old import:**
```typescript
import { getAddress, isAddress } from '@ethersproject/address';
```

**New import:**
```typescript
import { getAddress, isAddress } from 'viem';
```

**Tasks:**
- [x] Replace `getAddress()` calls in `src/handlers/web3.ts`
- [x] Replace `isAddress()` calls in `src/handlers/ens.ts`
- [x] Replace address utilities in `src/parsers/requests.js`
- [x] Replace address utilities in `src/walletConnect/index.tsx`
- [x] Replace address utilities in `src/__swaps__/screens/Swap/resources/search/searchV2.ts`
- [x] Replace address functions in remaining files (screens/SignTransactionSheet.tsx, hooks/useSearchCurrencyList.ts, hooks/useFetchOpenCollectionsOnMount.ts, __swaps__/screens/Swap/hooks/useSearchCurrencyLists.ts, handlers/LedgerSigner.ts)
- [x] Remove `@ethersproject/address` from package.json dependencies

## @ethersproject/units → viem/utils

**Old import:**
```typescript
import { parseEther, parseUnits, formatEther, formatUnits } from '@ethersproject/units';
```

**New import:**
```typescript
import { parseEther, parseUnits, formatEther, formatUnits } from 'viem';
```

**Tasks:**
- [x] Replace `parseEther()` in `src/handlers/web3.ts`
- [x] Replace `parseUnits()` in `src/raps/actions/unlock.ts`
- [x] Replace unit conversions in `src/screens/token-launcher/helpers/calculateTokenomics.ts`
- [x] Replace unit conversions in `src/screens/token-launcher/state/tokenLauncherStore.ts`
- [x] Replace unit conversions in `src/helpers/RainbowContext.tsx`
- [x] Remove `@ethersproject/units` from package.json dependencies

## @ethersproject/bytes → viem/utils

**Old import:**
```typescript
import { isHexString, arrayify, hexlify, joinSignature, concat } from '@ethersproject/bytes';
```

**New import:**
```typescript
import { isHex, hexToBytes, toHex, signatureToHex, concat } from 'viem';
```

**Tasks:**
- [x] Replace `isHexString()` with `isHex()` in `src/handlers/web3.ts`
- [x] Replace `arrayify()` with `hexToBytes()` in `src/model/wallet.ts`
- [x] Replace `hexlify()` with `toHex()` in `src/handlers/LedgerSigner.ts`
- [x] Replace `joinSignature()` with `signatureToHex()` in `src/screens/SpeedUpAndCancelSheet.tsx`
- [x] Replace byte utilities in `src/components/send/SendHeader.tsx`
- [x] Update `BytesLike` type annotations to viem equivalents
- [x] Replace byte utilities in `src/walletConnect/index.tsx`
- [x] Remove `@ethersproject/bytes` from package.json dependencies

## @ethersproject/strings → viem/utils

**Old import:**
```typescript
import { toUtf8Bytes, toUtf8String } from '@ethersproject/strings';
```

**New import:**
```typescript
import { stringToBytes, hexToString } from 'viem';
```

**Tasks:**
- [x] Replace `toUtf8Bytes()` with `stringToBytes()` in `src/handlers/LedgerSigner.ts`
- [x] Replace `toUtf8String()` with `hexToString()` in `src/parsers/requests.js` (for hex strings)
- [x] Replace string utilities in `src/utils/requestNavigationHandlers.ts`
- [x] Replace string utilities in `src/walletConnect/index.tsx`
- [x] Update LedgerSigner to use proper viem signature format with `signatureToHex()`
- [x] Fix type compatibility issues in SendSheet and SpeedUpAndCancelSheet
- [x] Remove `@ethersproject/strings` from package.json dependencies

## @ethersproject/keccak256 → viem/utils

**Old import:**
```typescript
import { keccak256 } from '@ethersproject/keccak256';
```

**New import:**
```typescript
import { keccak256 } from 'viem';
```

**Tasks:**
- [x] Replace `keccak256()` in `src/utils/labelhash.ts`
- [x] Ensure proper input formatting (viem expects `Hex` or `ByteArray`) - using stringToBytes
- [x] Remove `@ethersproject/keccak256` from package.json dependencies

## @ethersproject/sha2 → viem/utils

**Old import:**
```typescript
import { computeHmac, SupportedAlgorithm } from '@ethersproject/sha2';
```

**New import:**
```typescript
import { sha256 } from 'viem';
// Note: For HMAC, use native crypto or custom implementation
```

**Tasks:**
- [x] Replace SHA-2 hashing in `src/analytics/utils.ts`
- [x] Implement HMAC using native crypto or external library if needed - using native crypto.createHmac()
- [x] Remove `@ethersproject/sha2` from package.json dependencies

## @ethersproject/abstract-provider → viem types

**Old import:**
```typescript
import { Provider, Block, TransactionRequest, TransactionReceipt } from '@ethersproject/abstract-provider';
```

**New import:**
```typescript
import type { PublicClient, Block, TransactionRequest } from 'viem';
```

**Tasks:**
- [ ] Replace `Provider` type with `PublicClient` in `src/raps/utils.ts`
- [ ] Replace `Block` type in `src/model/wallet.ts`
- [ ] Replace `TransactionRequest` type in `src/handlers/LedgerSigner.ts`
- [ ] Replace `TransactionReceipt` type in `src/screens/Airdrops/utils.ts`
- [ ] Update type annotations in `src/__swaps__/utils/gasUtils.ts`
- [ ] Remove `@ethersproject/abstract-provider` from package.json dependencies

## @ethersproject/logger → Remove

**Old import:**
```typescript
import { Logger } from '@ethersproject/logger';
```

**New import:**
```typescript
// Use existing custom logger: import { logger } from '@/logger';
```

**Tasks:**
- [x] Remove Logger import from `src/raps/actions/ens.ts`
- [x] Verify custom logger is used instead
- [x] Remove `@ethersproject/logger` from package.json dependencies

## @ethersproject/providers → viem

**Old import:**
```typescript
import { StaticJsonRpcProvider, JsonRpcBatchProvider, Provider } from '@ethersproject/providers';
```

**New import:**
```typescript
import { createPublicClient, http } from 'viem';
import type { PublicClient } from 'viem';
```

**Tasks:**
- [ ] Create migration helper to convert provider creation pattern
- [ ] Replace `StaticJsonRpcProvider` with `createPublicClient` in `src/handlers/web3.ts`
- [ ] Update `chainsProviders` Map type from `StaticJsonRpcProvider` to `PublicClient`
- [ ] Replace `JsonRpcBatchProvider` with `createPublicClient({ transport: http({ batch: true }) })`
- [ ] Update `chainsBatchProviders` Map implementation
- [ ] Migrate provider methods (`.getBlock()` → `.getBlock()`, `.estimateGas()` → `.estimateGas()`, etc.)
- [ ] Update provider usage in `src/handlers/swap.ts`
- [ ] Update provider usage in `src/model/wallet.ts`
- [ ] Update provider usage in `src/screens/SendSheet.tsx`
- [ ] Update provider usage in `src/ens-avatar/src/*.ts` files
- [ ] Update resolver pattern for ENS in `src/handlers/ens.ts`
- [ ] Migrate provider usage in remaining 15+ files
- [ ] Remove `@ethersproject/providers` from package.json dependencies

## @ethersproject/bignumber → native bigint

**Old import:**
```typescript
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
```

**New import:**
```typescript
// Use native bigint
// For BigNumberish type, use: bigint | number | string
```

**Tasks:**
- [ ] Create helper utilities for decimal handling (bigint doesn't support decimals)
- [ ] Replace `BigNumber` class with `bigint` in `src/handlers/web3.ts`
- [ ] Update `BigNumberish` type annotations across codebase
- [ ] Replace `.add()`, `.sub()`, `.mul()`, `.div()` with native operators
- [ ] Replace `.toString()` with `String()` or `.toString()`
- [ ] Replace `.toNumber()` with `Number()` (add safety checks)
- [ ] Replace `.eq()`, `.gt()`, `.lt()` with native comparison operators
- [ ] Update BigNumber usage in `src/handlers/ens.ts`
- [ ] Update BigNumber usage in `src/handlers/LedgerSigner.ts`
- [ ] Update BigNumber usage in `src/raps/utils.ts`
- [ ] Update BigNumber usage in `src/screens/NFTSingleOfferSheet/index.tsx`
- [ ] Update gas calculation logic using bigint
- [ ] Update token amount calculations using bigint
- [ ] Migrate BigNumber usage in remaining 15+ files
- [ ] Remove `@ethersproject/bignumber` from package.json dependencies

## @ethersproject/hdnode → viem/accounts

**Old import:**
```typescript
import { HDNode, isValidMnemonic } from '@ethersproject/hdnode';
```

**New import:**
```typescript
import { hdKeyToAccount, mnemonicToAccount } from 'viem/accounts';
// Keep bip39 for mnemonic validation: import { validateMnemonic } from 'bip39';
```

**Tasks:**
- [ ] Replace `HDNode` class with `hdKeyToAccount()` in `src/model/wallet.ts`
- [ ] Replace `isValidMnemonic()` with bip39's `validateMnemonic()` in `src/handlers/web3.ts`
- [ ] Update wallet derivation logic for BIP-44 paths
- [ ] Update account generation from seed phrases
- [ ] Remove `@ethersproject/hdnode` from package.json dependencies

## @ethersproject/wallet → viem/accounts

**Old import:**
```typescript
import { Wallet, verifyMessage } from '@ethersproject/wallet';
```

**New import:**
```typescript
import { privateKeyToAccount, verifyMessage } from 'viem/accounts';
```

**Tasks:**
- [ ] Replace `Wallet` class with `privateKeyToAccount()` in `src/model/wallet.ts`
- [ ] Replace `Wallet` instances in `src/utils/wallet.ts`
- [ ] Replace `Wallet` usage in `src/helpers/signingWallet.ts`
- [ ] Replace `verifyMessage()` calls in `src/screens/SendSheet.tsx`
- [ ] Update wallet creation from private keys in `src/screens/Airdrops/utils.ts`
- [ ] Update wallet usage in `src/screens/token-launcher/*.tsx` files
- [ ] Update wallet usage in `src/helpers/RainbowContext.tsx`
- [ ] Migrate Wallet usage in remaining file
- [ ] Remove `@ethersproject/wallet` from package.json dependencies

## @ethersproject/abstract-signer → viem/accounts + custom wrapper

**Old import:**
```typescript
import { Signer } from '@ethersproject/abstract-signer';
```

**New import:**
```typescript
import type { Account } from 'viem';
// Create custom signer abstraction compatible with viem accounts
```

**Tasks:**
- [ ] Design viem-compatible signer abstraction interface
- [ ] Create wrapper type that works with both viem accounts and LedgerSigner
- [ ] Update `LedgerSigner` class in `src/handlers/LedgerSigner.ts` to implement viem account interface
- [ ] Update Signer type usage in `src/model/wallet.ts`
- [ ] Update Signer usage in `src/raps/actions/*.ts` files (ENS, swap, unlock)
- [ ] Update Signer usage in `src/helpers/ens.ts`
- [ ] Update Signer references in remaining 4+ files
- [ ] Remove `@ethersproject/abstract-signer` from package.json dependencies

## @ethersproject/properties → native JavaScript

**Old import:**
```typescript
import { defineReadOnly, resolveProperties } from '@ethersproject/properties';
```

**New import:**
```typescript
// Use native: Object.defineProperty()
// For resolveProperties, create custom utility
```

**Tasks:**
- [x] Replace `defineReadOnly()` with `Object.defineProperty()` in `src/handlers/LedgerSigner.ts`
- [x] Create custom `resolveProperties()` helper function
- [x] Remove `@ethersproject/properties` from package.json dependencies

## @ethersproject/transactions → viem

**Old import:**
```typescript
import { Transaction, UnsignedTransaction, serialize } from '@ethersproject/transactions';
```

**New import:**
```typescript
import { serializeTransaction, parseTransaction } from 'viem';
import type { TransactionSerializable } from 'viem';
```

**Tasks:**
- [ ] Replace `serialize()` with `serializeTransaction()` in `src/model/wallet.ts`
- [ ] Replace `Transaction` type with viem transaction types in `src/handlers/LedgerSigner.ts`
- [ ] Replace `UnsignedTransaction` type in `src/raps/actions/swap.ts`
- [ ] Update transaction serialization in `src/utils/ethereumUtils.ts`
- [ ] Update transaction types in `src/__swaps__/utils/gasUtils.ts`
- [ ] Update transaction handling in `src/screens/SignTransactionSheet.tsx`
- [ ] Remove `@ethersproject/transactions` from package.json dependencies

## @ethersproject/abi → viem

**Old import:**
```typescript
import { Interface } from '@ethersproject/abi';
```

**New import:**
```typescript
import { parseAbi, encodeFunctionData, decodeFunctionResult } from 'viem';
```

**Tasks:**
- [ ] Replace `Interface` class with `parseAbi()` in `src/featuresToUnlock/tokenGatedUtils.ts`
- [ ] Replace `.encodeFunctionData()` with viem's `encodeFunctionData()`
- [ ] Update ABI encoding for ERC-721 and ERC-1155 contract calls
- [ ] Remove `@ethersproject/abi` from package.json dependencies

## @ethersproject/contracts → viem

**Old import:**
```typescript
import { Contract, PopulatedTransaction, ContractInterface } from '@ethersproject/contracts';
```

**New import:**
```typescript
import { getContract } from 'viem';
import type { Abi } from 'viem';
```

**Tasks:**
- [ ] Create migration helper for Contract → getContract pattern
- [ ] Replace `Contract` class with `getContract()` in `src/handlers/web3.ts`
- [ ] Update contract interactions in `src/handlers/swap.ts`
- [ ] Update contract calls in `src/raps/utils.ts`
- [ ] Update ENS contract interactions in `src/helpers/ens.ts`
- [ ] Update contract usage in `src/resources/assets/anvilAssets.ts`
- [ ] Migrate ERC20 contract calls in swap RAPs
- [ ] Migrate ERC721 contract calls in NFT operations
- [ ] Migrate ERC1155 contract calls
- [ ] Update contract usage in `src/ens-avatar/src/specs/*.ts` files
- [ ] Replace `PopulatedTransaction` type with viem transaction simulation
- [ ] Migrate contract usage in remaining 5+ files
- [ ] Remove `@ethersproject/contracts` from package.json dependencies

## @ethersproject/solidity → viem (if needed)

**Old import:**
```typescript
import { pack, keccak256 as solidityKeccak256 } from '@ethersproject/solidity';
```

**New import:**
```typescript
import { encodePacked, keccak256 } from 'viem';
```

**Tasks:**
- [ ] Search codebase for any solidity-specific encoding needs
- [ ] Replace if found (currently no direct imports detected)
- [ ] Remove `@ethersproject/solidity` from package.json dependencies

## @ethersproject/random → viem (if needed)

**Old import:**
```typescript
import { randomBytes } from '@ethersproject/random';
```

**New import:**
```typescript
// Use native crypto or existing react-native-get-random-values
```

**Tasks:**
- [ ] Verify no direct usage in codebase
- [ ] Remove `@ethersproject/random` from package.json dependencies

## @ethersproject/shims → Remove

**Old import:**
```typescript
import '@ethersproject/shims';
```

**New import:**
```typescript
// Not needed - viem works natively in React Native
```

**Tasks:**
- [ ] Remove import from `shim.js`
- [ ] Test viem functionality in React Native environment
- [ ] Verify crypto operations work without polyfills
- [ ] Remove `@ethersproject/shims` from package.json dependencies

## ethers (full package) → viem

**Old import:**
```typescript
import { ethers } from 'ethers';
```

**New import:**
```typescript
import { createPublicClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
```

**Tasks:**
- [ ] Replace `ethers.providers.JsonRpcProvider` in `src/helpers/RainbowContext.tsx`
- [ ] Replace `ethers.Wallet` with `privateKeyToAccount()` in test utilities
- [ ] Replace `ethers.utils.parseEther()` with viem's `parseEther()`
- [ ] Verify this is only used in development/test contexts

## Testing

**Tasks:**
- [] Run lint and typecheck on the codebase
- [] Fix any issues that are discovered