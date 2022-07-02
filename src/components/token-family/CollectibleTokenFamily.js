import React, { useCallback } from 'react';
import { UniqueTokenRow } from '../unique-token';
import TokenFamilyWrap from './TokenFamilyWrap';
import { useOpenFamilies } from '@rainbow-me/hooks';

const CollectibleTokenFamily = ({
  external,
  familyId,
  familyImage,
  familyName,
  showcase,
  item,
  ...props
}) => {
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
    i => (
      <UniqueTokenRow
        external={external}
        item={item[i]}
        key={`${familyName}_${i}`}
        uniqueId={item[i].uniqueId}
      />
    ),
    [external, familyName, item]
  );

  return (
    <TokenFamilyWrap
      {...props}
      familyId={familyId}
      familyImage={familyImage}
      isOpen={isFamilyOpen}
      item={item}
      onToggle={handleToggle}
      renderItem={renderChild}
      title={familyName}
    />
  );
};

export default React.memo(CollectibleTokenFamily);
