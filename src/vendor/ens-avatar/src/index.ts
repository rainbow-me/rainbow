import { BaseProvider } from '@ethersproject/providers';
import ERC1155 from './specs/erc1155';
import ERC721 from './specs/erc721';
import URI from './specs/uri';
import { getImageURI, parseNFT } from './utils';

export interface Spec {
  getMetadata: (
    provider: BaseProvider,
    ownerAddress: string | undefined,
    contractAddress: string,
    tokenID: string,
    opts?: AvatarRequestOpts
  ) => Promise<any>;
}

export const specs: { [key: string]: new () => Spec } = Object.freeze({
  erc1155: ERC1155,
  erc721: ERC721,
});

export interface AvatarRequestOpts {
  allowNonOwnerNFTs?: boolean;
  type?: 'avatar' | 'header';
}

interface AvatarResolverOpts {
  ipfs?: string;
}

export interface IAvatarResolver {
  provider: BaseProvider;
  options?: AvatarResolverOpts;
  getImage(ens: string, data?: AvatarRequestOpts): Promise<string | null>;
  getMetadata(ens: string, data?: AvatarRequestOpts): Promise<string | null>;
}

export class AvatarResolver implements IAvatarResolver {
  provider: BaseProvider;
  options?: AvatarResolverOpts;

  constructor(provider: BaseProvider, options?: AvatarResolverOpts) {
    this.provider = provider;
    this.options = options;
  }

  async getMetadata(ens: string, opts?: AvatarRequestOpts) {
    // retrieve registrar address and resolver object from ens name
    const [resolvedAddress, resolver] = await Promise.all([this.provider.resolveName(ens), this.provider.getResolver(ens)]);
    if (!resolvedAddress || !resolver) return null;

    // retrieve 'avatar' text recored from resolver
    const avatarURI = await resolver.getText(opts?.type || 'avatar');
    if (!avatarURI) return null;

    // test case-insensitive in case of uppercase records
    if (!/\/erc1155:|\/erc721:/i.test(avatarURI)) {
      const uriSpec = new URI();
      const metadata = uriSpec.getMetadata(avatarURI);
      return { uri: ens, ...metadata };
    }

    // parse retrieved avatar uri
    const { chainID, namespace, contractAddress, tokenID } = parseNFT(avatarURI);
    // detect avatar spec by namespace
    const spec = new specs[namespace]();
    if (!spec) return null;

    // add meta information of the avatar record
    const host_meta = {
      chain_id: chainID,
      contract_address: contractAddress,
      namespace,
      reference_url: `https://opensea.io/assets/${contractAddress}/${tokenID}`,
      token_id: tokenID,
    };

    // retrieve metadata
    const metadata = await spec.getMetadata(this.provider, resolvedAddress, contractAddress, tokenID, opts);
    return { host_meta, uri: ens, ...metadata };
  }

  async getImage(ens: string, opts?: AvatarRequestOpts): Promise<string | null> {
    const metadata = await this.getMetadata(ens, opts);
    if (!metadata) return null;
    return getImageURI({
      customGateway: this.options?.ipfs,
      metadata,
    });
  }
}

export const utils = { getImageURI, parseNFT };
