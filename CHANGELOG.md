# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/)

## [Unreleased]
### Added

### Changed

### Removed

## [1.2.44](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.44)
### Changed
* Improve nonce tracking
* Fix Wallet Connect modals for 0 ETH wallets

## [1.2.43](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.43)
### Added
* Speed up & cancel transactions
* Add WBTC to default favorites

### Changed
* Fix 0 ETH scenarios

## [1.2.42](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.42)
### Added
* Alert for unverified tokens

### Changed
* Swap and approval gas estimation improvements
* Fix for invisible charts issue

## [1.2.41](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.41)
### Added
* Android support merged

### Changed
* Fix for savings
* Android UI fixes

## [1.2.40](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.40)
### Added
* Uniswap LP token charts
* Enable searching by token contract addresses in swap

### Changed
* Fix cloud backup issues
* Fix avatar issues
* Fix small balances/pinning issues
* Fix limited transaction history

## [1.2.39](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.39)
### Added
* Surface Uniswap V2 LP tokens
* Add swap search spinner

## [1.2.38](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.38)
### Added
* Uniswap V2 support

### Changed
* Fix custom gas issues

## [1.2.36](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.36)
### Added
* Handle interrupted wallet creation
* Fallback data provider
* Top Movers

### Changed
* Update Wyre order minimums and limits

## [1.2.35](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.35)
### Added
* Custom gas
* iCloud Backup

## [1.2.34](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.34)
### Changed
* Improvements to charts
* Improvements to animations

## [1.2.33](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.33)
### Changed
* Improvements to charts

## [1.2.30](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.30)
### Added
* Ganache support

## [1.2.29](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.29)
### Changed
* Fix WalletConnect gas problems
* Crash fixes

## [1.2.28](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.28)
### Changed
* Check on chain balance while selecting asset in send flow

## [1.2.27](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.27)
### Added
* Migration v5

## [1.2.26](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.26)
### Added
* Migration v4

### Changed
* check if hasKey instead of loading it directly
* Sort experimental keys in Dev Section

## [1.2.25](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.25)
### Changed
* Support Wyre order reservations
* Add migration v3

## [1.2.24](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.24)
### Added
* Keychain integrity checks
* Prevent add funds actions when keychain integrity checks fail
* Zerion charts integration

### Changed
* Fix deposit/withdraw modal corners
* Restore missing icon in send gas button
* Fix savings deposits
* Fix qrcode scanner behavior

## [1.2.23](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.23)
### Added
* Add welcome screen
* Add icon on splash screen animated hiding
* Add tx default data value
* Add experimental menu and refactor settings
* Instagram QR
* Add COMP
* New QR Codes
* Add ENJ, PAXG, PLR
* Add aliases for styles, routes and logger
* New ChartExpandedState+LiquidityPoolExpandedState theme
* Enable animated splash screen
* Add portal API and migrate existing LoadingOverlay
* Add logic for handling reimports of hidden wallets
* Add RARI metadata
* Add spinner on import button
* Add app settings with ability to wipe keychain
* Add more tracking to swap flow
* Add modifiers to touchX variable in charts
* Add TestFlight check

### Changed
* Migrate to React Navigation 5
* Optimize savings animation
* Make import screen work on Android
* Simplify usage of opacity toggler and make it not animated
* Fix Holo token symbol (HOLO -> HOT)
* Update lockfile
* Update PNK color
* Restore keyboard handling in cool-modals
* Fixes for push notification FCM token retrieval
* Fix share button label alignment
* Force setting correct opacity after togglign focus
* Move cool modals inside rainbow repo
* Fix navigation that breaks for routes that have different names
* Fixes for savings label
* Fix animation for change wlalet and add empty state on android
* Resolve promise for when a user has push notif permissions
* Uncomment copy seeds
* Enable native debugging in Xcode
* Fix displaying alerts in Portal.m
* Remove console.log
* Fix memory leak in Cool Modals
* Move hiding of portal to effect's cleanup
* Fix crash on pull down to refresh
* UI fixes
* Fix RAI-730 with moving removeController to later callback
* Fix crash while opening non-native import sheet
* dont crash when imageUrl is nil
* Move WC sessions to global localstorage
* Fix updating txn title after pending txn watcher completes
* Fetch Uniswap exchange address from global list
* Subscribe listeners on creation and not on every connection
* Fix initial keyboard focusing
* Insufficient Gas → Insufficient ETH
* Mark saving's updated with animated colors
* Probably fix NSInternalInconsistencyException crash
* FlatList to extract unique key based on wallet id and account id
* Some small steps to fix 🤖
* Change AssetSheetHeight to lower to get rid of non-clickable space in…
* Show price per Uniswap LP share, clean up new expanded state styles
* Fix swap search input autodeleting as user types
* Check for ENS name on import of a seed phrase
* Update exchange input when onChangeText function changes
* Improve transaction context menu
* Fix copy address in profile masthead on test networks
* Disable no-array-index-key eslint rule
* Make clocks not running while not needed
* Replace new Date().getTime() by Date.now()
* UI bug fixes, improvements
* Show codepush version under settings
* Fix CoinIconFallback text styles
* Use transparent status bar on 🤖
* Fix status bar on splash screen on Android
* Update redash
* Enforce alphabetization in components
* Patch RN to use continuous corners when possible
* Fix status bar managing in Swap
* Throttle the block listener for reserve updates
* Decrement usage of compound and uniswap graph
* Revert "Reduce number of calls to the graph
* cleanup/improve cool-modals?
* Revert "Remove overdrag from Android
* Upgrade Firebase
* Fix single row height in wallet screen when on testnet
* Minor fixes for Android
* Don't use underlyingPrice to calculate eth savings price
* Port swap and savings to cool-modals
* Revert "Port swap and savings to cool-modals
* Rewrite charts to use d3
* Fix input focusing issues
* Fix displaying deposit modal
* Disable horizontal orientation on Android
* Fix All/Less position on Android
* Set overScrollMode to never
* Fix one-off delay on send sheet inputs
* Fix broken 🌟️ favoriting in Swap flow
* Chart improvements
* Bump lodash from 4.17.15 to 4.17.19
* fix Send flow bugs
* Fix initial flash happening on Swap output's coin icon placeholder
* Fix logger import
* Fix crash when pressing gas speed button
* Log and restore if possible while showing secret

### Removed
* Disable safari debugging
* Get rid of using PanGestureHandler for blocking Swiping
* Remove unncessesary firebase registration
* Remove no longer valid Settings modal tracking in Analytics
* Remove unncessary ImportSeedPhraseSheetWithData
* Remove rebase artifacts
* Remove usage of react-native-animated-number in SavingsListRowAnimate…
* Reduce number of calls to the graph
* Remove overdrag from Android
* Remove not existing savings from Kovan testnet

## [1.2.22](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.22)
### Added
* Add collapse shitcoins in send asset list

### Changed
* Refactor WC connection handling
* Fix check button alignment and blinking
* Always use same random color for FallbackCoinIcon based on token symbol
* Bump react-native-firebase
* Fix TransactionConfirmationScreen title alignment


## [1.2.19](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.19)
### Changed
*  Fix uniswap subgraph
*  UI Cleanup


## [1.2.18](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.18)
### Added
* Wallets check for brand new wallets and add logging to Sentry


### Changed
* Adjust WalletConnectRedirectSheet styles

## [1.2.17](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.17)
### Added
* Add UMA token info
* Add mobile deeplinking support for domain to rnbwapp.com

### Changed
* Fix bg color in profile header btn
* Fix minor SlackSheet details for notchless phones
* Fix broken list headers in CurrencySelectionList
* WC fixes for mobile deeplinking
* Fix migrations run out of order
* Apply refund and reorder logic to all trade types regardless of protocol
* Handle WC rejections properly
* Fix tx indexes on native activity list

## [1.2.15](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.15)
### Added
* Multi-wallet support
* WalletConnect deeplinking support

### Changed
* WalletConnect upgrade and fixes
* Paging for OpenSea requests to fetch more NFTs

## [1.2.12](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.12)
### Changed
* Updated default gas limit for swaps
* Fixed swap modal crash on unlocks

## [1.2.11](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.11)
### Changed
* Update navigation structure
* Improve Wyre error tracking
* More hookified components and fixes for wallet empty state behavior

## [1.2.10](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.10)
### Added
* Turn on native activity list

## [1.2.9](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.9)
### Added
* Token blacklist
* Trophy case

## [1.2.4-5](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.4-5)
### Changed
* Fix navigation isFocused issues causing different parts of the app to break

## [1.2.4-1](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.4-1)
### Changed
* Bugfixes for broken button animation
* Performance improvements for network calls
* Improved support for Sentry sourcemaps

## [1.2.3-1](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.3-1)
### Changed
* Better biometric support
* Fix import wallet showing old wallet balances

## [1.2.2-4](https://github.com/rainbow-me/rainbow/releases/tag/v1.2.2-4)
### Added
* Uniswap support
* Add to contacts
* Support for deep linking
* Support for Sentry

### Changed
* Upgraded Firebase

## [1.1.5-2](https://github.com/rainbow-me/rainbow/releases/tag/v1.1.5-2)
### Changed
* Bugfix for transaction history with null symbol

## [1.1.5-2](https://github.com/rainbow-me/rainbow/releases/tag/v1.1.5-2)
### Changed
* Bugfix for transaction history with null symbol

## [1.1.4-1](https://github.com/rainbow-me/rainbow/releases/tag/v1.1.4-1)
### Added
* Support for importing private key and seed key
* Collectibles grouped by families
* Uniswap liquidity tokens

### Changed
* WalletConnect support for RPC methods

## [1.1.0-3](https://github.com/rainbow-me/rainbow/releases/tag/v1.1.0-3)
### Added
* New data provider

### Removed
* Removed rainbow-common dependency

## [1.0.0-11](https://github.com/rainbow-me/rainbow/releases/tag/v1.0.0-11)
### Added
* Analytics
* Support for universal and deep linking for Safari mobile web browser

### Changed
* Updated coin icons
* Bugfixes for older phones
* Fix for white screen flash on launch
* Support for larger NFT sizes

## [0.4.0-15](https://github.com/rainbow-me/rainbow/releases/tag/v0.4.0-15)
### Added
* Support for sending NFTs
* Support for sending to ENS addresses
* Autorefresh for unique tokens

### Changed
* Upgrade to WalletConnect v1
* Fix for app crashing when low ETH after having a previous wallet with enough ETH
* Fix for push notification not showing up when app completely closed
* Updated paging logic for transaction history
* Remove dropped/replaced transactions from pending state
* Fix crash that occurs when touching blank activity list below profile masthead while transactions still loading

### Removed

## [0.4.0-1](https://github.com/rainbow-me/rainbow/releases/tag/v0.4.0-1)
### Added
* 🌈
* 👍 feedback when a user copies address

### Changed
* Performance improvements to Activity List
* Improvements for send feedback
* Fixes for iPhone 6 users stuck in a loop with gas sheet when trying to send

### Removed
* Matomo

## [0.3.0-25](https://github.com/rainbow-me/rainbow/releases/tag/v0.3.0-25)
### Added
* WBTC pricing to rely on BTC price feed
* Proper implementation of box shadows

### Changed
* Improved Activity List interactions
* Fix for wrap-around behavior on Activity List
* Better handling for non-token-transfer and non-ETH smart contract interactions
* Fix for multiple push notifications permissions requests on initial WalletConnect connection

## [0.3.0-23](https://github.com/rainbow-me/rainbow/releases/tag/v0.3.0-23)
### Changed
* Fix for app crashing on fresh install for iPhone 6/7
* Fix for issue with multiple touch points causing weird behavior in expanded state
* Fix for blank transactions history while fetching transactions
* Fix for lengthy asset names on Send and Activity

## [0.3.0-22](https://github.com/rainbow-me/rainbow/releases/tag/v0.3.0-22)
### Added
* WalletConnect explainer
* Support for multiple builds

### Changed
* Fixes for navigation bugs
* Fix for delayed Importing notification after importing seed phrase
* Fix for showing seed phrase UI on older iPhones
* Update QR code scanner design

## [0.3.0-4](https://github.com/rainbow-me/rainbow/releases/tag/v0.3.0-4)

### Added
* Import seed phrase

### Changed
* Performance improvements
* Splash screen to be removed after successfully loaded wallet data
* Support for separate reducer changes for settings, assets, transactions, prices
* Support for promisified account refresh

## [0.3.0-3](https://github.com/rainbow-me/rainbow/releases/tag/v0.3.0-3)
### Changed
* Fix for toggle seed phrase button
* Fix for send native currency formatting

## [0.3.0-1](https://github.com/rainbow-me/rainbow/releases/tag/v0.3.0-1)
### Added
* Native currency selection in Settings
* Language selection in Settings (English and French only)
* Support for signing typed data messages
* Expanded details for transactions
* Simple UI for seed phrase backup

### Changed
* Profile screen layout
* Navigation fixes for WalletConnect notifications
* More consistent button behavior when confirming transactions
* Fixed haptic behavior when scanning QR code multiple times

## [0.2.1-3](https://github.com/rainbow-me/rainbow/releases/tag/v0.2.1-3)
### Added
* NFT attributes page
* Offline status indicator
* Support for message signing via WalletConnect
* Piwik support
* Storing 'hide assets' selection
* Grouping WalletConnect sessions view by dapp name
* Clearing out notifications once app opened

### Changed
* Fixed network spinner issue for older iPhones
* Fixed Add Funds flashing at app loading
* Better camera handling for overall app performance
* Navigation fixes
