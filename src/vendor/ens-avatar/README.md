# ens-avatar

> Note: This is a fork of [https://github.com/ensdomains/ens-avatar](https://github.com/ensdomains/ens-avatar) to support React Native

Avatar resolver library for ~both nodejs and browser~ REACT NATIVE! (a Rainbow fork).

## Getting started

### Prerequisites

- Have your web3 provider ready (web3.js, ethers.js)
- [Only for node env] Have jsdom installed.

And good to go!

### Installation

```bash
# npm
npm i @ensdomains/ens-avatar
# yarn
yarn add @ensdomains/ens-avatar
```

### Usage

```js
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { AvatarResolver, utils: avtUtils } from '@ensdomains/ens-avatar';

// const { JSDOM } = require('jsdom'); on nodejs
// const jsdom = new JSDOM().window; on nodejs

const provider = new StaticJsonRpcProvider(
    ...
  );
...
async function getAvatar() {
    const avt = new AvatarResolver(provider);
    const avatarURI = await avt.getAvatar('tanrikulu.eth', { /* jsdomWindow: jsdom (on nodejs) */ });
    // avatarURI = https://ipfs.io/ipfs/QmUShgfoZQSHK3TQyuTfUpsc8UfeNfD8KwPUvDBUdZ4nmR
}

async function getAvatarMetadata() {
    const avt = new AvatarResolver(provider);
    const avatarMetadata = await avt.getMetadata('tanrikulu.eth');
    // avatarMetadata = { image: ... , uri: ... , name: ... , description: ... }
    const avatarURI = avtUtils.getImageURI({ metadata /*, jsdomWindow: jsdom (on nodejs) */ });
    // avatarURI = https://ipfs.io/ipfs/QmUShgfoZQSHK3TQyuTfUpsc8UfeNfD8KwPUvDBUdZ4nmR
}
```

## Supported avatar specs

### NFTs

- ERC721
- ERC1155

### URIs

- HTTP
- Base64
- IPFS

## Options

### Cache _(Default: Disabled)_

```js
const avt = new AvatarResolver(provider, { ttl: 300 }); // 5 min response cache in memory
```

### Custom IPFS Gateway _(Default: https://ipfs.io)_

```js
const avt = new AvatarResolver(provider, { ipfs: 'https://dweb.link' });
```

## Demo

- Create .env file with INFURA_KEY env variable
- Build the library

- Node example

```bash
node example/node.js ENS_NAME
```

- Browser example

```bash
yarn build:demo
http-server example
```
