export interface UniqueTokenExpandedStateProps {
  asset: UniqueTokenExpandedStateAsset;
  external: boolean;
  lowResUrl: string;
}

// This structural type was created specifically for UniqueTokenExpandedState.
// It should be superseded by a more authoritative UniqueToken type in the future.
interface UniqueTokenExpandedStateAsset {
  asset_contract: {
    address: string;
  };
  background?: string | null;
  collection: {
    description?: string;
    discord_url?: string;
    external_url: string;
    name: string;
    slug: string;
    twitter_username?: string;
  };
  currentPrice: string;
  description?: string;
  familyName: string;
  familyImage: string;
  id: string;
  image_url: string;
  isPoap?: boolean;
  isSendable: boolean;
  lastPrice?: string;
  name: string;
  permalink: string;
  traits: {
    trait_type: string;
    value: string;
  }[];
  external_link: string;
  uniqueId: string;
  urlSuffixForAsset: string;
}
