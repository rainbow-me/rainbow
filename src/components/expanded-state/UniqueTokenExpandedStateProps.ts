import { UniqueAsset } from '@rainbow-me/entities';

export interface UniqueTokenExpandedStateProps {
  asset: UniqueAsset;
  external: boolean;
  lowResUrl: string;
}
