import React, { useCallback } from 'react';
import { UniqueTokenRow } from '../unique-token';
import TokenFamilyWrap from './TokenFamilyWrap';
import { useOpenFamilies } from '@/hooks';
import { ThemeContextProps } from '@/theme';

type Props = {
  childrenAmount: number;
  external: boolean;
  familyName: string;
  familyImage: string;
  showcase: boolean;
  item: any;
  theme: ThemeContextProps;
};

const CollectibleTokenFamily = ({ childrenAmount, external, familyImage, familyName, showcase, item, theme }: Props) => {
  const { openFamilies, updateOpenFamilies } = useOpenFamilies();
  const isFamilyOpen = openFamilies[familyName + (showcase ? '-showcase' : '')];

  const handleToggle = useCallback(
    () =>
      updateOpenFamilies({
        [familyName + (showcase ? '-showcase' : '')]: !isFamilyOpen,
      }),
    [familyName, isFamilyOpen, showcase, updateOpenFamilies]
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
