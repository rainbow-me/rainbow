# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/)

## [Unreleased]

### Added

### Changed

### Removed

### Fixed

## [1.9.27] (https://github.com/rainbow-me/rainbow/releases/tag/v1.9.27)

### Added

- Added more analytics to our Dapp browser (#5755)
- Added e2e test for validating malicious Dapp warnings (#5764)
- Added more analytics for Swaps v2 (#5805)
- Use ens graph api key (#5848, #5882)
- ETH Rewards (#5866)

### Changed

- Improved performance by limiting Sentry tracking and NFT hooks (#5819)
- Migrate remote cards over to zustand (#5796)

### Fixed

- Fixed provider recursion bug where getProviderForNetwork was being repeatedly called (#5829)
- Fixed crashes to swaps v2 flows (#5839)
- Fixed a crash when attempting to swap on v1 (#5858)
- Fixed a bug where we weren’t taking l1 op gas fees into account for claimBridge (#5889)
- Fixed a bug where tapping swap button on token expanded state did not select the proper token (#5891)

## [1.9.25] (https://github.com/rainbow-me/rainbow/releases/tag/v1.9.25)

### Added

- Added IDFA check on app launch (#5653)
- Added parallel tests for e2e (#5786)

### Changed

- Changed the size of the coin icon (#5771)
- Updates to Swaps v2 (#5768, #5765, #5772, #5766, #5757, #5776, #5775, #5780, #5778, #5779, #5784, #5782, #5754, #5783, #5791, #5795)
- Bumped reanimated (#5683)

### Fixed

- Fixed a bug where incorrect data would show in pending transactions (#5777)
- Fixed a bug where the swap warning flashes when typing a larger number (#5769)
- Fixed UX on receive sheet QR Code (#5672)

## [1.9.24] (https://github.com/rainbow-me/rainbow/releases/tag/v1.9.24)

### Added

- Added new translations for various parts in the app (#5762)

### Changed

- Updated codeowners file (#5732, #5743)
- Swaps v2 updates (#5725, #5727, #5733, #5722, #5724, #5741, #5747, #5748, #5751, #5752, #5758, #5759, #5760)
- Increased timeout to open a new tab in dapp browser for promo cards (#5745)

### Fixed

- Fixed a bug where some mints with unknown price was showing as free (#5750)
- Fixed issues with NFTs causing crashes on some wallets (#5761)
- Fixed an issue where transaction sheet would show the Buy ETH button when the selected wallet already has ETH (#5763)

## [1.9.23] (https://github.com/rainbow-me/rainbow/releases/tag/v1.9.23)

### Added

- Added a new useSyncSharedValue hook that makes it easy to keep a shared value in sync with equivalently typed state (#5662, #5664)
- Implemented smaller state subscriptions for current zustand stores outside of the browser (#5661)
- Implemented dapp browser architecture (#5669, #5671)
- Handle web injection natively (#5677)
- Added a new zustand store creator called createRainbowStore (#5689)
- Added a new hook called useSharedValueState (#5698)
- Added new hooks for working with time in reanimated (#5699)
- Added documentation to reanimated hooks (#5701)
- Added new backend-provided explorer labels for swaps v2 (#5690)
- Added custom gas panel for swaps v2 (#5647)
- Added the ability for a user to name a newly created wallet group in backups flow (#5696)
- Added exchange rate bubble for swaps v2 flow on swap screen (#5723)
- Added privacy manifest (#5736)

### Changed

- Simplified logic for Rainbow fee display in review panel for swaps v2 (#5660)
- Upgraded swaps sdk to 0.19.0 (#5694)
- Moved around swaps functionality that were being used in other places (#5708)
- Swaps v2 re-architecture implementation (#5705)
- Migrated nft requests from nft proxy to nfts graphql endpoint (#5704)
- Bumped provider to improve connection flow to dapps and L2 connection issues (#5703)
- Integrated new arch into asset colors for swaps v2 (#5709)
- Improvements to swaps quote fetching (#5711)
- Replaced swaps redux reliant state with parity to browser extension (#5608)

### Fixed

- Fixed a bug where dapp connection warning was not being displayed (#5710)
- Fixed an issue where there’s no web3 provider injected on the current tab when doing an app cold start (#5663)
- Fixed a bug where Google login button wouldn’t load on certain sites (#5670)
- Fixed issues relating to account/network switching by refactoring AppSessionsStore to use RainbowStore (#5693)
- Fixed numerous issues that arose from dapp browser bug bash session (#5695)
- Fixed an issue with bridge assets and spacing between items for Swaps v2 (#5686)
- Fixed supporting chain Id’s matching behavior with browser extension (#5697)
- Fixed a bug where a newly created wallet with a custom name would have the address but not the custom name displayed in backups (#5692)
- Fixed UI bug where Learn More Backups sheet was clipped at the topped (#5687)
- Fixed a bug with favorites list on swaps v2 (#5659)
- Fixed issue with running e2e tests by disabling sentry (#5707)
- Fixed a bug where there weren’t any touch events executed on the webview (#5702)
- Fixed a bug with dapp browser open in new tab (#5688)
- Fixed a bunch of dapp browser bugs on Android devices (#5712, #5715)
- Fixed a bug with searching in dapp browser that now allows you to navigate to an exact URL instead of suggested (#5719)
- Fixed browser bugs and improved performance (#5721)
- Fixed a bug on account switching from control panel on browser (#5726)
- Fixed various bugs within the control panel on the browser (#5730, #5734, #5735)
- Fixed search logic and homepage empty state bugs on browser (#5737)
- Fixed an addys API error when no address is provided (#5729)
- Fixed a swaps bug where chainID was undefined (#5738)
- Fixed a crash when tapping settings while bridging in swaps flow (#5740)

## [1.9.22] (https://github.com/rainbow-me/rainbow/releases/tag/v1.9.22)

### Added

- Swaps v2 updates (#5601, #5635, #5632, #5630, #5643, #5648, #5650, #5649)
- We now show total USD value of wallet instead of just mainnet ETH balance inside the wallet switcher (#5631)

### Changed

- Updated booleans in remote config (#5627)
- Removed codepush and unused updates to token list (#5622)
- Copy update when sending on different networks (#5495)
- Updates to e2e (#5637)
- bumped sentry to latest sdk (#5640)
- Updated firebase to better support notifications deeplinks and Apple privacy warnings (#5636)

### Fixed

- Fixed an edge case in swaps v2 when choosing to swap assets (#5644)
- Fixed a bug where send sheet USD value was marked as ETH (#5665)
- Fixed crash when swapping Degen token to ProxySwap token (#5667)

## [1.9.21] (https://github.com/rainbow-me/rainbow/releases/tag/v1.9.21)

### Added

- Added support for other native currencies in transaction simulation sheet (#5585)
- implement gas estimations for swaps v2 (#5526)
- Add token search logic and ability to select assets for swaps v2 (#5547)
- Added warning for when price impact is unknown (#5597)
- Added a warning when user attempts to send to contract address (#5586)
- Added support for Degen chain (#5621)

### Changed

- Updated audit for dependencies (#5594, #5615, #5624)
- Bumped swaps SDK (#5583)
- Improved type checking and error handling on web preferences (#5607)
- Updated e2e test suite (#5558)
- Updated transaction request analytic events (#5589)
- Cleaned up file imports and duplicate types for swaps v2 (#5619)
- Improved Wallet Connect flow and added performance tracking (#5616)

### Fixed

- Fixed an issue with scrolltoindex firing on the last card dismissal (#5606)
- Fixed a bug where some NFTs won’t show up in wallet (#5537)
- Fixed an bug where non backed up wallets would show as backed up under certain conditions (#5593)
- Fixed dapp metadata issues regarding Zora mints (#5584)

## [1.9.20] (https://github.com/rainbow-me/rainbow/releases/tag/v1.9.20)

### Added

- Added pending transaction indicator on nav bar (#5529)
- Swaps v2 revamp work (#5536, #5538)
- Added wallet connect v2 sessions data to state dump (#5382)

### Changed

- e2e cleanup (#5540)
- NFT offers/mints gas estimation improvements (#5448)
- Removed Apollo client in favor of @/graphql (#5555)
- Refetch balances after a transaction is confirmed (#5551)
- Hide favorites on non mainnet assets (#5565)
- Updated transaction details sheet (#5535)
- Bump Rudderstack version to v1.12.12 (#5556)
- Backups v2 (#5310)

### Fixed

- Fixed a crash that happened when tapping settings button on develop (#5544)
- Fixed token metadata issues for searching by contract address in discover (#5563)

## [1.9.19] (https://github.com/rainbow-me/rainbow/releases/tag/v1.9.19)

### Added

- Added Blast to simplehash (#5492)
- Initialize new swaps configuration (#5498)
- Initial swaps work (#5500)

### Changed

- Swipe navigator performance refactor (#5479)
- Transaction and assets cleanup (#5459)
- Migrated query persist from AsyncStorage to mmkv (#5404, #5524)
- Webview refactor (#5499)
- Replaced Segment (#5474)
- Low fee's on first estimate (#5503)
- Upgraded reservoir (#5514)
- Bump reanimated to v3.8.0 (#5517)
- Changed default theme from light to system (#5518)
- Updated logic for wallet connect SignTransactionSheet (#5471)

### Fixed

- Fixed reanimated and RNGH imports (#5480)
- Fixed layout shift for mints carousel card (#5485)
- Fixed android clipboard alerts (#5486)
- Fixed weekly earnings points breakdown (#5469)
- Fixed tappable area on wallet name (#5496)
- Fixed null deconstruction for wallet connect (#5493)
- Fixed dark mode theme which impacted ENS confirmation screen (#5502)
- Fixed initiating render on NFT offers (#5501)

## [1.9.18] (https://github.com/rainbow-me/rainbow/releases/tag/v1.9.18)

### Added

- Added ability to report NFT as spam to simplehash (#5434)
- Added fallback icons for contract interactions where we may not have nft images (#5456)
- Added support for Avalanche (#5430)
- Added support for Blast (#5463)

### Changed

- Removed native advanced settings as dev settings is newly preferred (#5416)
- App icon refactor (#5444)
- null safety placed on input filed focus (#5446)
- Points referrals card refactor (#5367)
- Removed duplicate rows in sign transaction sheet (#5451)
- Upgrade reanimated (#5200)
- Bumped dependencies for Wallet Connect (#5400)
- Disabled and removed Flipper (#5464)
- Removed rn-worklet-core package (#5465)

### Fixed

- Fixed rainbow animation on home screen (#5440)
- Fixed crash when tapping network info button on L2 sends (#5429)
- Fixed identify calls for analytics (#5442)
- Polished pending transaction details UI (#5441)
- Fixed ability to save NFT as an image on device (#5447)
- Increased number of pixel difference needed to qualify as non-gesture mode navigation (#5460)
- Fixed approval number formatting (#5457)
- Fixed mint pending label (#5455)
- Fixed a null response that was impacting dapps using viem/wagmi (#5454)

## [1.9.17] (https://github.com/rainbow-me/rainbow/releases/tag/v1.9.17)

### Added

- added transferTo field in send details (#5384)
- added accent colors to NFTs (#5412)
- added translations for points, notification strings and new wallet connect strings (#5412)
- added sell button to the NFT expanded state if an offer exists (#5428)

### Changed

- removed unused dependencies and updated some (#5417, #5427)
- transactions refactor (#5369)
- coin icon refactor (#5418)

### Fixed

- reduced imgix usage to fix NFT issues (#5413)

## [1.9.16] (https://github.com/rainbow-me/rainbow/releases/tag/v1.9.16)

### Added

- Added zustand and core pendingTx state (#5383)

### Changed

- Bump prettier from 2.2.1 to 3.2.5 (#5386)
- updated transaction queries (#5385)
- migrated nonce management to zustand (#5395)
- took portfolio off of websocket (#5371)
- migrate pinned and hidden tokens (#5410)

### Fixed

- bumped eth-sig-util to fix signing issues (#5376)
- fixed wallet connect issue with incompatible namespaces (#5387)
- fixed white screen on Zora mints (#5411)

## [1.9.15] (https://github.com/rainbow-me/rainbow/releases/tag/v1.9.15)

### Added

- Added ability to get price impact on swap (#5335, #5351, #5354, #5356)
- Points tweaks for better error handling (#5341, #5362)
- Added native value to currency rows (#5374)
- Added rainbow smol NFT address to unlock icon (#5381)

### Changed

- SVG sanitization (#5342)
- Removed savings code (#5344)
- Removed swaps generic assets references (#5345)
- useAsset hooks clean up (#5350)
- Removed all logic for DPI (#5343)
- Removed networks from assetType (#5364)
- Migrated charts to Addys REST API (#5370)
- Migrated asset prices to Addys REST API (#5357)
- Disabled frame processor for vision camera to fix Android builds (#5379)

### Fixed

- Fixed an issue where non compatible asset types were being sent on the new balances endpoint (#5349)
- Fixed an issue where the block explorer link was incorrect on an l2 transaction (#5333)
- Fixed e2e flakiness (#5346)
- Fixed zero eth check (#5361)
- Fixed profiles deeplinks (#5365)
- Fixed marketing route props for points push notification (#5366)
- Fixed centralization to arc client selection (#5368)
- Fixed an overflowing context menu on Android NFT expanded view (#5339)
- Fixed remote card on points tab not appearing (#5372)
- Fixed a bug where Tuesday’s would show same day on week end (#5338)
- Fixed camera component (#5355)
- Fixed issue where networks weren’t updated properly for selected assets (#5389)
- Fixed a WC issue where if on a different wallet then connected one then a formatting issue would occur (#5390)
- Fixed extra spacing on coin row icons (#5391)
- Fixed an icon not working on points remote card on Android devices (#5392)
- Added data for curated tokens (#5396)
- Fixed selecting max bug on native swaps (#5399)

## [1.9.14] (https://github.com/rainbow-me/rainbow/releases/tag/v1.9.14)

### Added

- Included new contract address to unlock Smol icon (#5311)
- Backend driven cards (#5198)
- Points notifications toggle opt-out (#5329)

### Changed

- Upgraded camera package (#5178)
- Bumped fastlane (#5331)

### Fixed

- Bumped react-native-linear-gradient (#5328)
- Fixes to rank cards in points tab (#5332)

## [1.9.13] (https://github.com/rainbow-me/rainbow/releases/tag/v1.9.13)

### Added

- More translations for newer features (#5292)

### Changed

- Remove testnet option from developer settings (#5308)
- Update what logs get sent to sentry (#5309)

## [1.9.12] (https://github.com/rainbow-me/rainbow/releases/tag/v1.9.12)

### Added

- Added the ability to paste full link into ref code input (#5252)
- Added debug logs for cross-chain bug discovery (#5246)
- Added sorting to NFTs (#5270)
- Added support for handling unknown error types (#5279)

### Changed

- Prevent input autofocus if referral code is already validated (#5244)
- remove rainbow emojis from tweet intent (#5249)
- Hide referral section on watched wallets (#5250)
- Rank card formatting tweaks (#5259)
- Updated next drop formatting to include minutes and day (#5263)
- Remote Promo Sheets ability to check for points (#5261)
- Updated rank card to accommodate for large num (#5265)
- Updated formatting on rank and tweet intent total points (#5251)
- Changes to the swap entry point to be the main swap screen instead of the currency select modal (#5247)
- Refactor points sign in (#5268)
- Cleaned up NFT sorting (#5289)
- Changed UI for unranked users (#5293)
- Remote config overhaul (#5297)

### Fixed

- Fixed total points not updating when switching wallets on Android (#5243)
- Fixed an onboarding error to points with sign in (#5257)
- Fixed max width on ENS name for leaderboard formatting issue (#5258)
- Fixed logic to refetch points after next drop and onboarding (#5260)
- Fixed .toLowercase() on undefined (#5267)
- Fixed displaying WalletConnect v2 list items that don't have an icon (#5266)
- Fixed newline encoding on Android (#5280)
- Fixed bug that makes it possible for read-only wallets to enter onboarding flow after deeplinking in from a referral link (#5281)
- Fixed NFT sort by floor price (#5284)
- Fixed no trade routes appearing on swaps (#5287) (#5295)

## [1.9.11] (https://github.com/rainbow-me/rainbow/releases/tag/v1.9.11)

### Added

- Points v1 (#5174)
- Graphql api key (#5211)
- Ability to implement general marketing notifications (#5206)
- Enabled Zora for transaction simulation (#5226)

### Changed

- Handling of hex transaction types (#5214)
- Updated client to use new token search aggregator across networks (#5190)
- Updated messaging on warnings for transaction simulation (#5224)
- Improved error handling for unknown urls (#5213)
- Allow special characters in featured mint titles (#5239)

### Fixed

- Fixed swap input currencylist value bug (#5221)
- Fixed scroll issue on discover search (#5227)
- Fixed a crash that would intermittently happen when switching wallets (#5232)

## [1.9.10] (https://github.com/rainbow-me/rainbow/releases/tag/v1.9.10)

### Added

- Tx Simulation (#5177)
- RPC Proxy updates (#5169)
- Remote promo sheet capabilities (#5140)

### Changed

- ‘An error occurred’ popup changes (#5187)

### Fixed

- Android navigation bar now matches app theme (#5150)
- Infinite render on swaps modal bug (#5191)

## [1.9.9] (https://github.com/rainbow-me/rainbow/releases/tag/v1.9.9)

### Added

- Bug fixes
- WC improvements

## [1.9.8] (https://github.com/rainbow-me/rainbow/releases/tag/v1.9.8)

### Added

- WC dapp warnings
- e2e updates
- Fee updates to NFT Mints
- Account Asset improvements

## [1.9.7] (https://github.com/rainbow-me/rainbow/releases/tag/v1.9.7)

### Added

- points v0
- prompt app reviews
- bug fixes

## [1.9.6] (https://github.com/rainbow-me/rainbow/releases/tag/v1.9.6)

### Added

- in app mints
- i18n support
- Rainbow Tabs
- OP Rewards Round 2
- more user pain points fixes

## [1.9.5] (https://github.com/rainbow-me/rainbow/releases/tag/v1.9.5)

### Added

- WC improvements
- Gas improvements
- NFT Offers networks support
- Wallet loading state fix
- Other bug fixes & improvements

## [1.9.4] (https://github.com/rainbow-me/rainbow/releases/tag/v1.9.4)

### Added

- Mints feature
- detox e2e fixes
- WC version bumps & fixes
- Gas fixes

## [1.9.3] (https://github.com/rainbow-me/rainbow/releases/tag/v1.9.3)

### Added

- WC Updates

## [1.9.2] (https://github.com/rainbow-me/rainbow/releases/tag/v1.9.2)

### Added

- WC Updates
- Navigation upgrades
- 1559 for L2s
- Adworld app icon
- F2C updates

## [1.9.1] (https://github.com/rainbow-me/rainbow/releases/tag/v1.9.1)

### Added

- Turn on gif support
- Fix Base swaps
- Fix cache key

## [1.9.0] (https://github.com/rainbow-me/rainbow/releases/tag/v1.9.0)

### Added

- Added back keyboard area #5000
- Added the ability to accept NFT Offers #4965
- Get NFT expanded state floor price from Reservoir if available #5006

### Changed

- React Native version bump #4955
- Improved image performance #5001

### Removed

- Goerli support #4986

### Fixed

- Updated Base network icon #4992
- ERC-20 charts haptics fix #5004
- Fixed some crashes in appstate #5002
- Fix WC app redirects #5005

## [1.8.28] (https://github.com/rainbow-me/rainbow/releases/tag/v1.8.28)

### Added

- Base Support Updates

## [1.8.27] (https://github.com/rainbow-me/rainbow/releases/tag/v1.8.27)

### Added

- testnet update

## [1.8.26] (https://github.com/rainbow-me/rainbow/releases/tag/v1.8.26)

### Added

- Swaps upgrade
- Poolsuite

## [1.8.25] (https://github.com/rainbow-me/rainbow/releases/tag/v1.8.25)

### Added

- Base network support
- NFT offers fixes
- Gas fixes for L2s

## [1.8.24] (https://github.com/rainbow-me/rainbow/releases/tag/v1.8.24)

### Added

- Zora Swaps/Bridging
- Defi positions
- Mint: POAPs

## [1.8.23] (https://github.com/rainbow-me/rainbow/releases/tag/v1.8.23)

### Added

- NFT offers v1
- bug fixes

## [1.8.22] (https://github.com/rainbow-me/rainbow/releases/tag/v1.8.22)

### Added

- Some NFT offers work (behind flag)
- RN upgrade to 0.70.9
- Zorb app icon

## [1.8.21] (https://github.com/rainbow-me/rainbow/releases/tag/v1.8.21)

### Added

- WCv2 Updates
- Zora Support

## [1.8.20] (https://github.com/rainbow-me/rainbow/releases/tag/v1.8.19)

### Added

- WCv2 updates
- PIN keychain updates (droid)
- Diagnostic Sheet updates

## [1.8.19] (https://github.com/rainbow-me/rainbow/releases/tag/v1.8.19)

### Added

- Keychain updates
- Sentry updates
- Output based swaps on Arbitrum
- F2C: added Moonpay & Coinbase
- NFT metadata refresh

## [1.8.18] (https://github.com/rainbow-me/rainbow/releases/tag/v1.8.18)

### Added

- Deeplinks fix (WC Connections)
- WC v2 auth handling

## [1.8.17] (https://github.com/rainbow-me/rainbow/releases/tag/v1.8.17)

### Added

- Android Backup Improvements
- iPhone 14 Safe area fixes on sheets

## [1.8.16] (https://github.com/rainbow-me/rainbow/releases/tag/v1.8.16)

### Added

- Ledger support
- Finiliar NFT app icon
- Ratio fees fix

## [1.8.15] (https://github.com/rainbow-me/rainbow/releases/tag/v1.8.15)

### Added

- NFT Refactor
- WC improvements
- Google Account Switching for Backups

## [1.8.14] (https://github.com/rainbow-me/rainbow/releases/tag/v1.8.14)

### Added

- Ratio to our f2c flow
- Fixed colors on send sheet
- Wallet connect V2
- Performance improvements

## [1.8.13] (https://github.com/rainbow-me/rainbow/releases/tag/v1.8.13)

### Added

- BSC release

### Changed

- Other bug fixes and performance improvements

## [1.8.12] (https://github.com/rainbow-me/rainbow/releases/tag/v1.8.12)

### Changed

- F2C Ramp
- OP Improvements
- L2 Transactions
- Pool Together App Icon
- other bug fixes and improvements

## [1.8.11] (https://github.com/rainbow-me/rainbow/releases/tag/v1.8.11)

### Changed

- more OP fixes
- performance improvements

## [1.8.10] (https://github.com/rainbow-me/rainbow/releases/tag/v1.8.10)

### Added

- OP rewards

### Changed

- OP reward fixes

## [1.8.9] (https://github.com/rainbow-me/rainbow/releases/tag/v1.8.9)

### Changed

- ledger prep items
- OP rewards prep items
- version bumps and other improvements
- bug fix for stale pricing

## [1.8.8] (https://github.com/rainbow-me/rainbow/releases/tag/rc-v1.8.6)

### Changed

- 1.8.7 hotfix
- fix balance updates on L1 sends

## [1.8.7] (https://github.com/rainbow-me/rainbow/releases/tag/rc-v1.8.7)

### Changed

- some bug fixes
- ledger prep items
- double eth fix
- OP rewards prep items

## [1.8.6] (https://github.com/rainbow-me/rainbow/releases/tag/rc-v1.8.6)

### Changed

- new Txn Details flag turned on
- ledger prep work (behind feature flag)
- non customer facing improvements & bug fixes

## [1.8.5](https://github.com/rainbow-me/rainbow/releases/tag/v1.8.5)

### Changed

- Some learn card fixes
- Notification improvments
- Some NFT image fixes
- Some small UI tweaks
- Some Ledger stuff (behind feature flag)
- Some BSC prep stuff (rugged for now)

## [1.8.4](https://github.com/rainbow-me/rainbow/releases/tag/v1.8.4)

### Changed

- fixed camera permissions

## [1.8.3](https://github.com/rainbow-me/rainbow/releases/tag/v1.8.3)

### Changed

- Added Doge app icon
- Fixed duplicate eth balance issues
- Updated photo permissions

## [1.8.2](https://github.com/rainbow-me/rainbow/releases/tag/v1.8.2)

### Changed

- Cross chain swaps
- Update to discover home cards
- Other bug fixes and improvements

## [1.8.1](https://github.com/rainbow-me/rainbow/releases/tag/v1.8.1)

### Changed

- Bug fixes
- Small dev focused items
- No new features or user facing items

## [1.8.0](https://github.com/rainbow-me/rainbow/releases/tag/v1.7.10)

### Added

- New updated Homescreen

### Changed

- Small bug fixes / dev improvements
- Some more cross-chain swaps PRs (still behind a feature flag)
- LooksRare marketplace link
- Audio NFTs bugfix

## [1.7.9](https://github.com/rainbow-me/rainbow/releases/tag/v1.7.9)

### Changed

- Notifications Tweaks
- Bug Fixes

## [1.7.8](https://github.com/rainbow-me/rainbow/releases/tag/v1.7.8)

### Added

- Notifications
- Simplehash being used for Polygon NFTs
- React native safe area context
- First PRs for hardware wallet integration

### Changed

- Gas UI alignments & tweaks
- Other small bug fixes (including initializing stuck state fix)
- Fix Android 13 ripple effect

## [1.7.7](https://github.com/rainbow-me/rainbow/releases/tag/v1.7.7)

### Changed

- Update Polygon allowlist
- Gas fee bug fixes
- Bug fixes in create new wallet modal

## [1.7.6](https://github.com/rainbow-me/rainbow/releases/tag/v1.7.6)

### Changed

- Onboarding bug fixes

## [1.7.5](https://github.com/rainbow-me/rainbow/releases/tag/v1.7.5)

### Changed

- Onboarding bug fixes

## [1.7.4](https://github.com/rainbow-me/rainbow/releases/tag/v1.7.4)

### Changed

- Bug fixes

## [1.7.3](https://github.com/rainbow-me/rainbow/releases/tag/v1.7.3)

### Added

- Smolverse custom app icon
- Swaps Promo

### Changed

- Default to "Fast Gas" on swaps for Mainnet/Polygon
- Settings redesign
- Profiles bug fixes
- Android bug fixes
- e2e test improvements

### Removed

- Removed deprecated testnets

## [1.7.2](https://github.com/rainbow-me/rainbow/releases/tag/v1.7.2)

### Changed

- Hide NFTs
- Bug fixes

## [1.7.1](https://github.com/rainbow-me/rainbow/releases/tag/v1.7.1)

### Changed

- Profiles bugfixes

## [1.7.0](https://github.com/rainbow-me/rainbow/releases/tag/v1.7.0)

### Changed

- Profiles release
- Android improvements
- Bug fixes

## [1.6.23](https://github.com/rainbow-me/rainbow/releases/tag/v1.6.23)

### Changed

- Bug fixes
- Performance improvements

## [1.6.22](https://github.com/rainbow-me/rainbow/releases/tag/v1.6.21)

### Changed

- Swap aggregator performance fix

## [1.6.21](https://github.com/rainbow-me/rainbow/releases/tag/v1.6.21)

### Changed

- Swap aggregator gas estimation fix

## [1.6.20](https://github.com/rainbow-me/rainbow/releases/tag/v1.6.20)

### Changed

- Swap aggregator UI fixes - follow up release

## [1.6.19](https://github.com/rainbow-me/rainbow/releases/tag/v1.6.19)

### Added

- Swap aggregator release

### Changed

- Fixes for shitcoin pricing flash
- Fixes for cross-wallet data mixing

## [1.6.18](https://github.com/rainbow-me/rainbow/releases/tag/v1.6.18)

### Added

- Support custom icons
- Support Optimism and Arbitrum collectibles viewing

## [1.6.16](https://github.com/rainbow-me/rainbow/releases/tag/v1.6.16)

### Changed

- Main release
- Bug fixes
- Performance improvements

## [1.6.15](https://github.com/rainbow-me/rainbow/releases/tag/v1.6.15)

### Changed

- Fix for WC dapp contract signature metadata

## [1.6.14](https://github.com/rainbow-me/rainbow/releases/tag/v1.6.14)

### Changed

- Audit deps
- Opensea WC sign message issue
- Send details row crash

## [1.6.13](https://github.com/rainbow-me/rainbow/releases/tag/v1.6.13)

### Changed

- welcome screen adjustments
- fixed queued txs
- pngs for coin icons
- fixed walletconnect disconnect issue
- fixed sending NFTs on android
- fixed android token param for send flow

## [1.6.11](https://github.com/rainbow-me/rainbow/releases/tag/v1.6.11)

### Changed

- separate pending transactions
- i18n wrap up
- update animations
- sentry performance setup

## [1.6.11](https://github.com/rainbow-me/rainbow/releases/tag/v1.6.11)

### Changed

- separate pending transactions
- i18n wrap up
- update animations
- sentry performance setup

## [1.6.10](https://github.com/rainbow-me/rainbow/releases/tag/v1.6.10)

### Added

- Fedora support

### Changed

- Image handling fixes
- Blank charts fix
- Fix disconnecting messages on Android

## [1.6.9](https://github.com/rainbow-me/rainbow/releases/tag/v1.6.9)

### Added

- Codeowners file

### Changed

- Fix zoomable wrapper issues
- Bug fixes and improvements

## [1.6.8](https://github.com/rainbow-me/rainbow/releases/tag/v1.6.8)

- Null Image handling
- Sorted Connected Dapps
- Zoomable Wrapper Fixes
- Assets Address Check

## [1.6.7](https://github.com/rainbow-me/rainbow/releases/tag/v1.6.7)

### Changed

- Fix Testnet Support
- Currency Selection List & Favorites Fixes
- Small Phone tweaks
- Android ENV fixes
- Updated Android Icons

## [1.6.6](https://github.com/rainbow-me/rainbow/releases/tag/v1.6.6)

### Changed

- Uniswap tokens / search to backend
- DPI + trendling list to backend
- design system usage for NFT Expanded State
- ios price widgets
- styled components migration
- deeplinking improvements
- imgix changes

## [1.6.5](https://github.com/rainbow-me/rainbow/releases/tag/v1.6.5)

### Changed

- Fix NFT Family Image Crash

## [1.6.4](https://github.com/rainbow-me/rainbow/releases/tag/v1.6.4)

### Changed

- Fix NFT fetching on failure

## [1.6.3](https://github.com/rainbow-me/rainbow/releases/tag/v1.6.3)

### Changed

- Improved L2 support
- Update deprecated keychain flags
- Asset list improvements (RLV v2)
- More backend proxy updates
- Performance improvements
- Bug fixes

## [1.6.2](https://github.com/rainbow-me/rainbow/releases/tag/v1.6.2)

### Changed

- Fix Add Cash crash

## [1.6.1](https://github.com/rainbow-me/rainbow/releases/tag/v1.6.1)

### Changed

- Fix nonce manager issues
- Fix Arbitrum gas price updates
- Fix POAP filtering
- Fix network switching issues with WC

## [1.6.0](https://github.com/rainbow-me/rainbow/releases/tag/v1.6.0)

### Changed

- Compressed images without quality loss
- Fix send max ETH
- Fix send sheet input focus handling

## [1.5.42](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.42)

### Added

- EIP-1559 support

## [1.5.40](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.40)

### Changed

- Fix Speed up and cancel sheet bug

## [1.5.39](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.39)

### Changed

- Full fix for deeplink send bug

## [1.5.37](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.37)

### Added

- Design System

### Changed

- Fixed Deeplink Send Bug

## [1.5.36](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.36)

### Added

- Nonce Tracking
- Onchain Balance Updates
- Cloudinary SVG improvements

### Changed

- Optimism V2
- Updated Add Cash & Search Analytics
- Fixed Unstoppable Domain Resolution

## [1.5.35](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.35)

### Changed

- RN 66
- NFT V2 Expanded States
- Fix Back Up Sheet Height

## [1.5.34](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.34)

### Changed

- Lowered Exporer Transaction Limit
- Polygon Contract Name handling
- Revert Uniswap fetchng by Volume
- Use StaticJsonRpcProvider

## [1.5.33](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.33)

### Changed

- NFT family name filtering
- Temp disable poaps

## [1.5.31](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.31)

### Added

- Discover Analytics
- Dynamic Token List
- Remote Config
- Poap Support

### Changed

- Fix camera permissions deeplink

## [1.5.30](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.30)

### Changed

- NFT Count analytics

## [1.5.29](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.29)

### Changed

- Separate out L2 explorer init

## [1.5.28](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.28)

### Changed

- Changed source of token list
- ENS & Unstoppable validation fixes

## [1.5.27](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.27)

### Added

- Handle dropped transactions

### Changed

- Switched polygon gas api
- Autoscrolling & RLV jumping fixes

## [1.5.26](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.26)

### Added

- Hide scam tokens
- Support for .com style ENS domains and new Unstoppable TLDs

### Changed

- WC data safety check
- Locked deps
- Reanimated & Camera dimming refactorß
- Search improvements, Fetch by volume
- Savings native token fixes
- Improved NFT family sorting

## [1.5.25](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.25)

### Changed

- Improved App Error Boundary Reporting

## [1.5.24](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.24)

### Added

- App Error Boundary

### Changed

- Send Full WC Errors

## [1.5.23](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.23)

### Added

- SVG support

### Changed

- Enabled Arbitrum
- WalletConnect improvements
- UniswapAssetsInWallet improvements

## [1.5.22](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.22)

### Changed

- Discover performance improvements
- Improved debug & transaction analytics

## [1.5.21](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.21)

### Changed

- Added Opensea API key
- Ethers pending transactions

## [1.5.20](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.20)

### Added

- EIP-618 support
- Support for multiple cloud backups
- Search ENS domains in Discover

### Changed

- Walletconnect speed improvements
- SVG bug fixes

## [1.5.19](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.19)

### Added

- Add QR support for wc links

### Changed

- Fix WalletConnect timeout
- Fix edge cases in send sheet - ENS suggestions
- Remove unnecesary LP calls

## [1.5.18](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.18)

### Added

- Enabled Layer 2 Support: Optimism & Polygon
- Send Sheet - ENS Suggestions

### Changed

- WalletConnect account + network selection
- WalletConnect timeout
- Avatars for contacts
- Default gas limit changes

## [1.5.17](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.17)

### Added

- Merged & Disabled Layer 2 support

### Changed

- WalletConnect improvements
- Fix rerenders on Wallet Screen
- Fix Token Icons & Color

## [1.5.16](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.16)

### Added

- NFT image loading
- NFT Share button

### Changed

- Send Sheet V2
- QR Scanner navigation fix
- Scrollable Settings Modal
- Fixed Uniswap pools network calls
- Rainbow Token Icon URL

## [1.5.15](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.15)

### Changed

- Updated Profile Emoji's & Colors
- Improved Contact ENS Support
- Fixed NFT Share Menu

## [1.5.14](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.14)

### Changed

- Fixed Uniswap v3 NFT related crash

## [1.5.13](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.13)

### Added

- SVG NFT Support
- Share NFTs via Rainbow.me

### Changed

- Fixed Info Button on Swap Input
- Improved ENS Cards
- Android Discover Sheet Fixes
- Android Search Fixes

## [1.5.12](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.12)

### Added

- Nerf Tooltips & Alerts
- NFT Markdown Support
- Custom ENS Assets
- Exchange Token Info Menu

### Changed

- Move Fetching of Uniswap subgraph
- Mo's Bottom Sheets
- Swap Focus Fixes
- Improved Wallet Diagnostics Sheet

## [1.5.11](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.11)

### Changed

- Improved Swap Analytics
- WC signing fix

## [1.5.10](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.10)

### Added

- Moves iOS to Hermes

### Changed

- NFT background Fix
- Secret Phrase Change
- Wallet Switcher on Wallet Screen
- Removed background execution
- Add Cash Warning for Read-Only
- Offline token metadata

## [1.5.9](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.9)

### Added

- Bumped React Native 0.64

### Changed

- Settings Modal Height
- Sharing URL Adjustments

## [1.5.8](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.8)

### Added

- Rainbow Web Profiles
- Swap / Deposit / Withdraw Analytics

### Changed

- Fixed Speeding Up ERC20 Send
- OpenSea Adjustments
- Gas Fixes

## [1.5.7](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.7)

### Added

- Increased Analytics Tracking

### Changed

- Patched WalletConnect
- Bumped Token List

## [1.5.6](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.6)

### Added

- Added Accounts to Send Sheet

### Changed

- Expanded Asset Improvements
- Improved Add Cash Error Messaging
- Increased Search Debounce

## [1.5.5](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.5)

### Changed

- Updated Transaction Error Logging
- Removed Slow Speed from Swap

## [1.5.4](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.4)

### Added

- Token Price Fallback via The Graph
- Gas Estimation Logging

### Changed

- Top Movers Animation tweaked

## [1.5.3](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.4)

### Added

- Extra Details for LP Positions
- Extra Token Details

### Changed

- Numerous Performance Improvements

## [1.5.2](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.2)

### Added

- Support for new WC bridges

### Changed

- Fixes in apps connected button

## [1.5.1](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.1)

### Changed

- Typescript Transaction Parser
- Bug Fixes

## [1.5.0](https://github.com/rainbow-me/rainbow/releases/tag/v1.5.0)

### Added

- Discover Page

### Changed

- RecyclerView Refactor
- Performance Improvements

## [1.2.58](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.58)

### Changed

- Multimedia NFT Image Fallback
- Reanimated Fix
- UI Tweaks

## [1.2.57](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.57)

### Added

- Multimedia NFT support

### Changed

- Fix Lingering Pools
- Bug Fixes

## [1.2.55](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.55)

### Added

- Swap Details Sheet
- Flip button

### Changed

- Fix Testnets
- Bug Fixes

## [1.2.54](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.54)

### Changed

- Bug Fixes

## [1.2.53](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.53)

### Changed

- Improved Search Performance
- Bug Fixes

## [1.2.52](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.52)

### Changed

- Improved Gas Estimation
- Added Rainbow Curated List to Search Results
- Default Slippage for Uniswap

## [1.2.51](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.51)

### Added

- System support for Dark Mode
- Unstoppable Domains Support

## [1.2.50](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.50)

### Added

- Dark Mode Support for iOS 12

## [1.2.49](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.49)

### Added

- Dark Mode
- High Quality NFT Images

### Changed

- Improved Gas Estimation
- Wallet Deletion Fixes
- Avatar Fixes

## [1.2.48](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.48)

### Changed

- UI Bug Fixes

## [1.2.47](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.47)

### Changed

- Search Improvements
- WalletConnect Error Reporting

## [1.2.46](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.46)

### Changed

- Token Approval Improvements

## [1.2.45](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.45)

### Changed

- WC nonce fix

## [1.2.44](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.44)

### Changed

- Improve nonce tracking
- Fix Wallet Connect modals for 0 ETH wallets

## [1.2.43](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.43)

### Added

- Speed up & cancel transactions
- Add WBTC to default favorites

### Changed

- Fix 0 ETH scenarios

## [1.2.42](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.42)

### Added

- Alert for unverified tokens

### Changed

- Swap and approval gas estimation improvements
- Fix for invisible charts issue

## [1.2.41](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.41)

### Added

- Android support merged

### Changed

- Fix for savings
- Android UI fixes

## [1.2.40](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.40)

### Added

- Uniswap LP token charts
- Enable searching by token contract addresses in swap

### Changed

- Fix cloud backup issues
- Fix avatar issues
- Fix small balances/pinning issues
- Fix limited transaction history

## [1.2.39](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.39)

### Added

- Surface Uniswap V2 LP tokens
- Add swap search spinner

## [1.2.38](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.38)

### Added

- Uniswap V2 support

### Changed

- Fix custom gas issues

## [1.2.36](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.36)

### Added

- Handle interrupted wallet creation
- Fallback data provider
- Top Movers

### Changed

- Update Wyre order minimums and limits

## [1.2.35](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.35)

### Added

- Custom gas
- iCloud Backup

## [1.2.34](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.34)

### Changed

- Improvements to charts
- Improvements to animations

## [1.2.33](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.33)

### Changed

- Improvements to charts

## [1.2.30](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.30)

### Added

- Ganache support

## [1.2.29](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.29)

### Changed

- Fix WalletConnect gas problems
- Crash fixes

## [1.2.28](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.28)

### Changed

- Check on chain balance while selecting asset in send flow

## [1.2.27](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.27)

### Added

- Migration v5

## [1.2.26](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.26)

### Added

- Migration v4

### Changed

- check if hasKey instead of loading it directly
- Sort experimental keys in Dev Section

## [1.2.25](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.25)

### Changed

- Support Wyre order reservations
- Add migration v3

## [1.2.24](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.24)

### Added

- Keychain integrity checks
- Prevent add funds actions when keychain integrity checks fail
- Zerion charts integration

### Changed

- Fix deposit/withdraw modal corners
- Restore missing icon in send gas button
- Fix savings deposits
- Fix qrcode scanner behavior

## [1.2.23](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.23)

### Added

- Add welcome screen
- Add icon on splash screen animated hiding
- Add tx default data value
- Add experimental menu and refactor settings
- Instagram QR
- Add COMP
- New QR Codes
- Add ENJ, PAXG, PLR
- Add aliases for styles, routes and logger
- New ChartExpandedState+LiquidityPoolExpandedState theme
- Enable animated splash screen
- Add portal API and migrate existing LoadingOverlay
- Add logic for handling reimports of hidden wallets
- Add RARI metadata
- Add spinner on import button
- Add app settings with ability to wipe keychain
- Add more tracking to swap flow
- Add modifiers to touchX variable in charts
- Add TestFlight check

### Changed

- Migrate to React Navigation 5
- Optimize savings animation
- Make import screen work on Android
- Simplify usage of opacity toggler and make it not animated
- Fix Holo token symbol (HOLO -> HOT)
- Update lockfile
- Update PNK color
- Restore keyboard handling in cool-modals
- Fixes for push notification FCM token retrieval
- Fix share button label alignment
- Force setting correct opacity after togglign focus
- Move cool modals inside rainbow repo
- Fix navigation that breaks for routes that have different names
- Fixes for savings label
- Fix animation for change wlalet and add empty state on android
- Resolve promise for when a user has push notif permissions
- Uncomment copy seeds
- Enable native debugging in Xcode
- Fix displaying alerts in Portal.m
- Remove console.log
- Fix memory leak in Cool Modals
- Move hiding of portal to effect's cleanup
- Fix crash on pull down to refresh
- UI fixes
- Fix RAI-730 with moving removeController to later callback
- Fix crash while opening non-native import sheet
- dont crash when imageUrl is nil
- Move WC sessions to global localstorage
- Fix updating txn title after pending txn watcher completes
- Fetch Uniswap exchange address from global list
- Subscribe listeners on creation and not on every connection
- Fix initial keyboard focusing
- Insufficient Gas → Insufficient ETH
- Mark saving's updated with animated colors
- Probably fix NSInternalInconsistencyException crash
- FlatList to extract unique key based on wallet id and account id
- Some small steps to fix 🤖
- Change AssetSheetHeight to lower to get rid of non-clickable space in…
- Show price per Uniswap LP share, clean up new expanded state styles
- Fix swap search input autodeleting as user types
- Check for ENS name on import of a seed phrase
- Update exchange input when onChangeText function changes
- Improve transaction context menu
- Fix copy address in profile masthead on test networks
- Disable no-array-index-key eslint rule
- Make clocks not running while not needed
- Replace new Date().getTime() by Date.now()
- UI bug fixes, improvements
- Show codepush version under settings
- Fix CoinIconFallback text styles
- Use transparent status bar on 🤖
- Fix status bar on splash screen on Android
- Update redash
- Enforce alphabetization in components
- Patch RN to use continuous corners when possible
- Fix status bar managing in Swap
- Throttle the block listener for reserve updates
- Decrement usage of compound and uniswap graph
- Revert "Reduce number of calls to the graph
- cleanup/improve cool-modals?
- Revert "Remove overdrag from Android
- Upgrade Firebase
- Fix single row height in wallet screen when on testnet
- Minor fixes for Android
- Don't use underlyingPrice to calculate eth savings price
- Port swap and savings to cool-modals
- Revert "Port swap and savings to cool-modals
- Rewrite charts to use d3
- Fix input focusing issues
- Fix displaying deposit modal
- Disable horizontal orientation on Android
- Fix All/Less position on Android
- Set overScrollMode to never
- Fix one-off delay on send sheet inputs
- Fix broken 🌟️ favoriting in Swap flow
- Chart improvements
- Bump lodash from 4.17.15 to 4.17.19
- fix Send flow bugs
- Fix initial flash happening on Swap output's coin icon placeholder
- Fix logger import
- Fix crash when pressing gas speed button
- Log and restore if possible while showing secret

### Removed

- Disable safari debugging
- Get rid of using PanGestureHandler for blocking Swiping
- Remove unncessesary firebase registration
- Remove no longer valid Settings modal tracking in Analytics
- Remove unncessary ImportSeedPhraseSheetWithData
- Remove rebase artifacts
- Remove usage of react-native-animated-number in SavingsListRowAnimate…
- Reduce number of calls to the graph
- Remove overdrag from Android
- Remove not existing savings from Kovan testnet

## [1.2.22](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.22)

### Added

- Add collapse shitcoins in send asset list

### Changed

- Refactor WC connection handling
- Fix check button alignment and blinking
- Always use same random color for FallbackCoinIcon based on token symbol
- Bump react-native-firebase
- Fix TransactionConfirmationScreen title alignment

## [1.2.19](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.19)

### Changed

- Fix uniswap subgraph
- UI Cleanup

## [1.2.18](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.18)

### Added

- Wallets check for brand new wallets and add logging to Sentry

### Changed

- Adjust WalletConnectRedirectSheet styles

## [1.2.17](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.17)

### Added

- Add UMA token info
- Add mobile deeplinking support for domain to rnbwapp.com

### Changed

- Fix bg color in profile header btn
- Fix minor SlackSheet details for notchless phones
- Fix broken list headers in CurrencySelectionList
- WC fixes for mobile deeplinking
- Fix migrations run out of order
- Apply refund and reorder logic to all trade types regardless of protocol
- Handle WC rejections properly
- Fix tx indexes on native activity list

## [1.2.15](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.15)

### Added

- Multi-wallet support
- WalletConnect deeplinking support

### Changed

- WalletConnect upgrade and fixes
- Paging for OpenSea requests to fetch more NFTs

## [1.2.12](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.12)

### Changed

- Updated default gas limit for swaps
- Fixed swap modal crash on unlocks

## [1.2.11](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.11)

### Changed

- Update navigation structure
- Improve Wyre error tracking
- More hookified components and fixes for wallet empty state behavior

## [1.2.10](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.10)

### Added

- Turn on native activity list

## [1.2.9](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.9)

### Added

- Token blacklist
- Trophy case

## [1.2.4-5](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.4-5)

### Changed

- Fix navigation isFocused issues causing different parts of the app to break

## [1.2.4-1](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.4-1)

### Changed

- Bugfixes for broken button animation
- Performance improvements for network calls
- Improved support for Sentry sourcemaps

## [1.2.3-1](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.3-1)

### Changed

- Better biometric support
- Fix import wallet showing old wallet balances

## [1.2.2-4](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.2-4)

### Added

- Uniswap support
- Add to contacts
- Support for deep linking
- Support for Sentry

### Changed

- Upgraded Firebase

## [1.1.5-2](https://github.com/rainbow-me/rainbow/releases/tag/v1.1.5-2)

### Changed

- Bugfix for transaction history with null symbol

## [1.1.5-2](https://github.com/rainbow-me/rainbow/releases/tag/v1.1.5-2)

### Changed

- Bugfix for transaction history with null symbol

## [1.1.4-1](https://github.com/rainbow-me/rainbow/releases/tag/v1.1.4-1)

### Added

- Support for importing private key and seed key
- Collectibles grouped by families
- Uniswap liquidity tokens

### Changed

- WalletConnect support for RPC methods

## [1.1.0-3](https://github.com/rainbow-me/rainbow/releases/tag/v1.1.0-3)

### Added

- New data provider

### Removed

- Removed rainbow-common dependency

## [1.0.0-11](https://github.com/rainbow-me/rainbow/releases/tag/v1.0.0-11)

### Added

- Analytics
- Support for universal and deep linking for Safari mobile web browser

### Changed

- Updated coin icons
- Bugfixes for older phones
- Fix for white screen flash on launch
- Support for larger NFT sizes

## [0.4.0-15](https://github.com/rainbow-me/rainbow/releases/tag/v0.4.0-15)

### Added

- Support for sending NFTs
- Support for sending to ENS addresses
- Autorefresh for unique tokens

### Changed

- Upgrade to WalletConnect v1
- Fix for app crashing when low ETH after having a previous wallet with enough ETH
- Fix for push notification not showing up when app completely closed
- Updated paging logic for transaction history
- Remove dropped/replaced transactions from pending state
- Fix crash that occurs when touching blank activity list below profile masthead while transactions still loading

### Removed

## [0.4.0-1](https://github.com/rainbow-me/rainbow/releases/tag/v0.4.0-1)

### Added

- 🌈
- 👍 feedback when a user copies address

### Changed

- Performance improvements to Activity List
- Improvements for send feedback
- Fixes for iPhone 6 users stuck in a loop with gas sheet when trying to send

### Removed

- Matomo

## [0.3.0-25](https://github.com/rainbow-me/rainbow/releases/tag/v0.3.0-25)

### Added

- WBTC pricing to rely on BTC price feed
- Proper implementation of box shadows

### Changed

- Improved Activity List interactions
- Fix for wrap-around behavior on Activity List
- Better handling for non-token-transfer and non-ETH smart contract interactions
- Fix for multiple push notifications permissions requests on initial WalletConnect connection

## [0.3.0-23](https://github.com/rainbow-me/rainbow/releases/tag/v0.3.0-23)

### Changed

- Fix for app crashing on fresh install for iPhone 6/7
- Fix for issue with multiple touch points causing weird behavior in expanded state
- Fix for blank transactions history while fetching transactions
- Fix for lengthy asset names on Send and Activity

## [0.3.0-22](https://github.com/rainbow-me/rainbow/releases/tag/v0.3.0-22)

### Added

- WalletConnect explainer
- Support for multiple builds

### Changed

- Fixes for navigation bugs
- Fix for delayed Importing notification after importing seed phrase
- Fix for showing seed phrase UI on older iPhones
- Update QR code scanner design

## [0.3.0-4](https://github.com/rainbow-me/rainbow/releases/tag/v0.3.0-4)

### Added

- Import seed phrase

### Changed

- Performance improvements
- Splash screen to be removed after successfully loaded wallet data
- Support for separate reducer changes for settings, assets, transactions, prices
- Support for promisified account refresh

## [0.3.0-3](https://github.com/rainbow-me/rainbow/releases/tag/v0.3.0-3)

### Changed

- Fix for toggle seed phrase button
- Fix for send native currency formatting

## [0.3.0-1](https://github.com/rainbow-me/rainbow/releases/tag/v0.3.0-1)

### Added

- Native currency selection in Settings
- Language selection in Settings (English and French only)
- Support for signing typed data messages
- Expanded details for transactions
- Simple UI for seed phrase backup

### Changed

- Profile screen layout
- Navigation fixes for WalletConnect notifications
- More consistent button behavior when confirming transactions
- Fixed haptic behavior when scanning QR code multiple times

## [0.2.1-3](https://github.com/rainbow-me/rainbow/releases/tag/v0.2.1-3)

### Added

- NFT attributes page
- Offline status indicator
- Support for message signing via WalletConnect
- Piwik support
- Storing 'hide assets' selection
- Grouping WalletConnect sessions view by dapp name
- Clearing out notifications once app opened

### Changed

- Fixed network spinner issue for older iPhones
- Fixed Add Funds flashing at app loading
- Better camera handling for overall app performance
- Navigation fixes
