# `@/networks`

Handling for networks throughout the codebase.

```typescript
import { getNetworkObj, Networks } from '@/networks';

const networkObj = getNetworkObj(Networks.mainnet)


// Get static properties based on network
const networkName = networkObj.name
const isSwapEnabled = networkObj.swaps.enabled
const isNFTsEnabled = networkObj.nfts.enabled
const networkColors: {light: string, dark: string} = networkObj.colors

// Use network functions to get dynamic data
const provider: StaticJsonRpcProvider = await networkObj.getProvider();
const gasPrices = networkObj.getGasPrices();

```

## Network Objects

Network Objects will contain all network specific information we could possible need
This will allow us a safely typed and consistent interface to scale our supported networks.

### Adding a new network

Add a new file `networkName` in `@/networks`. You can then export the main object and any other network specific helpers you may need.

#### Note that we want to keep the interface the same for all networks so we can dynamically support adding new networks. This means no hardcoded network checking or specific handling outside of these files and the given interface

