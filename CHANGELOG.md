# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/)

## [Unreleased]
### Added

### Removed

### Changed

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
