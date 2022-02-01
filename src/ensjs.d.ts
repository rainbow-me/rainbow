interface ENSOptions {
  ensAddress: string;
  networkId: string;
  provider: any;
}

declare module '@ensdomains/ensjs' {
  class ENS {
    constructor(options: ENSOptions);

    // Returns the owner/controller for the current ENS name.
    getOwner(): Promise<string>;

    // Sets the owner/controller for the current ENS name.
    setOwner(address: string): Promise<any>;

    // Returns the resolver for the current ENS name.
    getResolver(): Promise<string>;

    // Sets the resolver for the current ENS name.
    setResolver(address: string): Promise<string>;

    // Returns the TTL for the current ENS name.
    getTTL(): Promise<Number>;

    // Returns the address for the current ENS name for the coinId provided.
    getAddress(coinId: String): Promise<string>;

    // Sets the address for the current ENS name for the coinId provided.
    setAddress(coinId: String, address: string): Promise<any>;

    // Returns the contentHash for the current ENS name.
    getContent(): Promise<string>;

    // Sets the contentHash for the current ENS name.
    setContenthash(content: string): Promise<any>;

    // Returns the text record for a given key for the current ENS name.
    getText(key: String): Promise<String>;

    // Sets the text record for a given key for the current ENS name.
    setText(key: String, recordValue: String): Promise<any>;

    // Sets the subnode owner for a subdomain of the current ENS name.
    setSubnodeOwner(label: String, newOwner: string): Promise<any>;

    // Sets the subnode owner, resolver, ttl for a subdomain of the current ENS name in one transaction.
    setSubnodeRecord(
      label: String,
      newOwner: string,
      resolver: string,
      ttl?: number
    ): Promise<any>;

    // Creates a subdomain for the current ENS name. Automatically sets the owner to the signing account.
    createSubdomain(label: String): Promise<any>;

    // Deletes a subdomain for the current ENS name. Automatically sets the owner to "0x0..."
    deleteSubdomain(label: String): Promise<any>;

    // Static property that returns current resolver address
    name(name: string): string;
  }

  export function namehash(label: string): string;
  export function labelhash(label: string): string;
  export function getENSContract(opts: { address: string; provider: any }): any;
  export function getResolverContract(opts: {
    address: string;
    provider: any;
  }): any;
  export function getEnsAddress(networkId: string): string;

  export default ENS;
}
