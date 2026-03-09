# ens-avatar

Fork of [@ensdomains/ens-avatar](https://github.com/ensdomains/ens-avatar) at v0.1.5 (May 2022), adapted for React Native.

## Why forked

Upstream depends on axios, DOMPurify (requires DOM/jsdom), `is-svg`, and `new Image()` for CORS fallback -- none of which
work in React Native. The upstream has since also migrated to ethers v6.

This fork strips all DOM/Node/networking dependencies and keeps only the core resolution logic: CAIP-22/CAIP-29 NFT parsing,
IPFS/base64 URI handling, and the `AvatarResolver` orchestration. NFT image fetching is done through SimpleHash
(`@/resources/nfts/simplehash`) and SVG conversion through `@/handlers/svgs` instead of upstream's HTTP + DOMPurify pipeline.
Also adds support for resolving ENS header/cover images (upstream only resolved avatars).

## Known coupling

The ERC-721 and ERC-1155 specs directly import app-specific modules. This could be decoupled via dependency injection to make the library fully generic.

## Alternatives considered (March 2026)

- **Upstream `@ensdomains/ens-avatar`**: Still not RN-compatible.
- **Viem `getEnsAvatar`**: RN-compatible and already in the project, but no way to inject SimpleHash as the NFT image source or hook into SVG conversion.
