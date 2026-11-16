# NFT data

`createNftsStore` persists each account's collection summaries and pagination cursor.
A first page replaces the summaries; continuation pages append them. The store
constructs the published map once, directly from the API response. Version 3 drops
the obsolete fetched-data format without migrating it.

`fetchNextNftCollectionPage()` refreshes an expired cursor from the first page before
requesting the continuation. The query store shares concurrent requests and retains
the displayed summaries during refresh and failure.

Collection contents use `useCollectionNftsStore`, the existing keyed-query collection
with wallet address and collection ID as its key. `useNftCollectionAssets` observes
open-collection preferences and subscribes to those collection reads. Closing a
collection releases its fetch demand; its fetched assets remain cached. The backend
returns a first page of owned NFTs, not necessarily the entire collection.

Showcase and hidden preferences contain specific NFT IDs. `useNftMetadataStore`
reuses available collection assets and fetches only missing saved-token metadata for
open preference groups. Preference metadata does not establish owned collection
membership. Row construction prefers the collection's current asset when available.

Wallet, avatar-picker and ENS-profile rows carry their asset references and header
open state. Cells render that prepared data and toggle preferences; they do not
subscribe to NFT stores or initiate fetching. Sending an NFT and completing ENS
registration refresh the affected collection. Pull-to-refresh refreshes open
collections alongside the account's other data.

`features/nfts/data/walletNftRowsStore.ts` composes wallet NFT rows from these stores.
Wallet editing controls whether the wallet includes that section; it does not
change NFT data. The NFT picker uses `useSelectableNftRows`, and profiles prepare
their existing query results with `buildProfileNftRows`.
