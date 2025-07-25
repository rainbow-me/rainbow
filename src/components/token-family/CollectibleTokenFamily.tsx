import React, { useCallback } from 'react';
import { UniqueTokenRow } from '../unique-token';
import TokenFamilyWrap from './TokenFamilyWrap';
import { ThemeContextProps } from '@/theme';
import { useOpenCollectionsStore } from '@/state/nfts/openCollectionsStore';

type Props = {
  childrenAmount: number;
  familyImage?: string;
  familyName: string;
  external: boolean;
  showcase: boolean;
  item: any;
  theme: ThemeContextProps;
};

const CollectibleTokenFamily = ({ childrenAmount, external, familyImage, familyName, showcase, item, theme }: Props) => {
  const isFamilyOpen = useOpenCollectionsStore(state => state.isCollectionOpen(familyName + (showcase ? '-showcase' : '')));

  const handleToggle = useCallback(
    () => useOpenCollectionsStore.getState().toggleCollection(familyName + (showcase ? '-showcase' : '')),
    [familyName, showcase]
  );

  const renderChild = useCallback(
    (i: number) => <UniqueTokenRow external={external} item={item[i]} key={`${familyName}_${i}`} uniqueId={item[i].uniqueId} />,
    [external, familyName, item]
  );

  return (
    <TokenFamilyWrap
      childrenAmount={childrenAmount}
      familyImage={familyImage}
      isHeader
      isOpen={isFamilyOpen}
      item={item}
      onToggle={handleToggle}
      renderItem={renderChild}
      theme={theme}
      title={familyName}
    />
  );
};

export default React.memo(CollectibleTokenFamily);
