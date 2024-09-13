import React from 'react';
import { useAccountSettings } from '@/hooks';
import { useFeaturedResults } from '@/resources/featuredResults/getFeaturedResults';
import { languageLocaleToCountry } from '@/utils/languageLocaleToCountry';
import { getFeaturedResultsById } from '@/resources/featuredResults/_selectors/getFeaturedResultIds';
import { useSharedValue } from 'react-native-reanimated';
import { FeaturedResultCard } from '@/components/FeaturedResult/FeaturedResultCard';
import { FeaturedResult } from '@/graphql/__generated__/arc';

export type FeaturedResultStackProps = {
  onNavigate: (url: string) => void;
  placementId: string;
  Card: React.FC<{ handlePress: () => void; featuredResult: FeaturedResult }>;
};

export const FeaturedResultStack = ({ onNavigate, placementId, Card }: FeaturedResultStackProps) => {
  const { accountAddress, language } = useAccountSettings();
  const currentIndex = useSharedValue(0);

  // @ts-expect-error - language is type string instead of typeof keyof Language
  const country = languageLocaleToCountry(language);
  const { data: featuredResultIds } = useFeaturedResults(
    {
      placementId,
      walletAddress: accountAddress,
      country,
    },
    {
      select: getFeaturedResultsById,
    }
  );

  const featuredResultId = featuredResultIds?.[currentIndex.value];
  if (!featuredResultId) {
    return null;
  }

  return (
    <FeaturedResultCard
      walletAddress={accountAddress}
      country={country}
      featuredResultId={featuredResultId}
      placementId={placementId}
      onNavigate={onNavigate}
      Card={Card}
    />
  );
};
