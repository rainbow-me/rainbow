# `@/storage`

We use MMKV for offline local storage on user's devices, and instead of many
instances of MMKV, we have only a few. They're each intended for differently
"scoped" data i.e. some data is specific to a single device, and other data is
specific to a single wallet or network.

## Usage

Import the correctly scoped store from `@/storage`. Each instance of `Storage`
(the base class, not to be used directly), has the following interface:

- `set([...scope, key], value)`
- `get([...scope, key])`
- `remove([...scope, key])`
- `removeMany([...scope], [...keys])`

For example, using our `device` store looks like this, since it's scoped to the
device (the most base level scope):

```typescript
import * as storage from '@/storage';

storage.device.set(['doNotTrack'], true);
storage.device.get(['doNotTrack']);
storage.device.remove(['doNotTrack']);
storage.device.removeMany([], ['doNotTrack']);
```

## TypeScript

Stores are strongly typed, and when setting a given value, it will need to
conform to the schemas defined in `@/storage/schemas`. When getting a value, it
will be returned to you as the type defined in its schema.

## Scoped Stores

Some stores are (will be) scoped to either network, wallet, or both. In this
case, storage instances are created with type-guards, like this:

```typescript
type NetworkAndWalletSchema = {
  contacts: Contact[];
};

enum Network {
  Mainnet = 'mainnet',
  Optimism = 'optimism',
}

type WalletAddress = `Ox${string}`;

const networkAndWallet = new Storage<[Network, WalletAddress], NetworkAndWalletSchema>({
  id: 'networkAndWallet',
});

networkAndWallet.set([Network.Mainnet, '0x12345', 'contacts'], [{ name: 'rainbow.eth', address: '0x67890' }]);

const contacts: Contact[] = networkAndWallet.get([Network.Mainnet, '0x12345', 'contacts']);
```

Here, if `[Network.Mainnet, '0x12345']` are not supplied along with the key of
`contacts`, type checking will fail. If used in JavaScript, _it will return undefined._

## Future Work

For storage instances that require scopes, it may be useful in the future to
define wrappers around `Storage` that can cache references to the current
network and/or wallet. That way, we don't have to pass in the `Network` and
`WalletAddress` every time.

That would look something like this:

```typescript
import { Storage } from '@/storage'

class NetworkAndWalletStorage<Schema> {
  walletAddress?: WalletAddress
  network?: Network
  storage: Storage<[Network, WalletAddress], Schema>

  constructor() {
    this.storage = new Storage<[Network, WalletAddress], Schema>({
       id: 'networkAndWallet'
    })
  }

  setWalletAddress(walletAddress: string) {
    this.walletAddress = walletAddress
  }

  setNetwork(network: string) {
    this.network = network
  }

  set<Key extends keyof Schema>(key: Key, data: Schema[Key]): void {
    if (!this.network || !this.walletAddress) {
      throw new Error(`ScopedStorage requires both network and walletAddress`)
    }

    this.storage.set([this.network, this.walletAddress, key], data)
  }

  ...etc...
}

export networkAndWallet = new NetworkAndWalletStorage()
```

Then, we could set/get values by key only:

```typescript
import { networkAndWallet } from '@/storage/networkAndWallet';

networkAndWallet.set('contacts', [{ name: 'rainbow.eth', address: '0x67890' }]);
```
