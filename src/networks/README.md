# `@/networks`

Handling for networks throughout the codebase.

```typescript
import { getNetworkObj, Networks } from '@/networks';

const networkObj = getNetworkObj(Networks.mainnet);

// Get static properties based on network
const networkName = networkObj.name;
const isSwapEnabled = networkObj.swaps.enabled;
const isNFTsEnabled = networkObj.nfts.enabled;
const networkColors: { light: string; dark: string } = networkObj.colors;

// Use network functions to get dynamic data
const provider: StaticJsonRpcProvider = await networkObj.getProvider();
const gasPrices = networkObj.getGasPrices();

// Getting a subset of network objects

const layer2s = RainbowNetworks.filter(network => network.networkType === 'layer2');

// Or networks that match specific properties
const walletconnectNetworks = RainbowNetworks.filter(network => network.features.walletconnect).map(network => network.value);
```

## Network Objects

Network Objects will contain all network specific information we could possible need
This will allow us a safely typed and consistent interface to scale our supported networks.

### Adding a new network

#### Add Remote Config

Add the following variables to `@/model/remoteConfig`, `networkName_enabled` & `networkName_tx_enabled`. Make sure you add it to the parsing section as a boolean so it is processed & typed correctly.

#### Add Network Config

Add a new file `networkName` in `@/networks`. You can then export the main object and any other network specific helpers you may need. You can copy an existing network's config file to make things easier.

Make sure you add references to your new network config in `@/networks/index.ts`

#### Add Network Assets

Network badge assets need to be added in the following places and should be in multiple sizes `1x, 2x, 3x`

`@assets/badges` -> `networkBadge` `networkBadgeDark` `networkBadgeLarge` `networkBadgeLargeDark` `networkBadgeNoShadow`

`ios/Images.xcassets/badges` -> `networkBadge` `networkBadgeDark` `networkBadgeNoShadow`

_ios assets are best added via xcode_

Note: we want to refactor this to use svgs but the current react native svg packages do not support filters

#### Add asset type & balance/tx fetching

Add the network to `entities/assetTypes.ts`

Add the relevent socket subscriptions in `redux/explorer/ts`

Note: we can automate this part when we move off websockets

#### Note that we want to keep the interface the same for all networks so we can dynamically support adding new networks. This means no hardcoded network checking or specific handling outside of these files and the given interface
