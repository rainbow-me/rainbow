# ens-avatar

Fork of [@ensdomains/ens-avatar](https://github.com/ensdomains/ens-avatar) at v0.1.5 (May 2022), adapted for React Native.

## What it does

Resolves ENS avatar and cover/header images. Given an ENS name, it reads the `avatar` or `header` text record from the
resolver, parses CAIP-22/CAIP-29 NFT URIs, resolves IPFS/base64 URIs, and returns an image URL. SVG images are converted
to PNG via `@/handlers/svgs` for React Native compatibility.

## Why forked

Upstream depends on axios, DOMPurify (requires DOM/jsdom), `is-svg`, and `new Image()` for CORS fallback -- none of which
work in React Native. The upstream has since also migrated to ethers v6.

This fork strips those DOM/Node/networking dependencies and keeps only the core resolution logic. It also adds support for
resolving ENS header/cover images (upstream only resolves avatars).

## Known issues

The ERC-721 and ERC-1155 specs import `fetchSimpleHashNFT` and `svgToPngIfNeeded` from app code. SimpleHash has been shut down
and the function hard-returns `undefined`, but both specs still call it unconditionally after the on-chain metadata path,
overwriting any image that was already resolved. This means NFT-based avatars with on-chain metadata are broken. The dead
SimpleHash code should be removed entirely.

Additionally, the on-chain path only handles base64-encoded data URIs. When `tokenURI`/`uri` returns an IPFS or HTTP URL
(the common case), there is no code to fetch the JSON metadata and extract the image. This path was never implemented because
SimpleHash bypassed it. Fixing NFT avatar resolution requires adding this fetch step (as upstream and viem both do).

## Replacing with viem (March 2026)

This fork should probably be replaced rather than fixed. The header/cover support was added by us (not upstream), the
SimpleHash integration is dead, and the IPFS/HTTP metadata fetch path was never implemented. Fixing all of this means
rewriting most of the fork anyway.

Viem provides the building blocks:

- **Avatar**: `getEnsAvatar()` handles the full on-chain resolution. Post-process with `svgToPngIfNeeded`.
- **Header/cover**: `getEnsText(name, 'header')` to read the record, then a small CAIP-22/29 parser + URI resolver
  for the image. The useful parts of this fork's `utils.ts` (~130 lines: `parseNFT`, `resolveURI`) could be kept
  standalone without the rest of the fork.
- **Ownership bypass** (`allowNonOwnerNFTs`): viem enforces ownership checks with no opt-out. Would need custom
  contract calls if this is still required.

This would also drop the ethers v5 dependency (`@ethersproject/providers`, `@ethersproject/contracts`) from this code.

## Other alternatives considered

- **Upstream `@ensdomains/ens-avatar`**: Still not RN-compatible (depends on axios, DOMPurify, `is-svg`, `new Image()`).