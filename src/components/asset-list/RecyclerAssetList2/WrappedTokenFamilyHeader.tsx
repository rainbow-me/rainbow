import React, { useCallback } from 'react';
import { TokenFamilyHeader } from '../../token-family';
import { useOpenFamilies } from '@rainbow-me/hooks';

export default React.memo(function WrappedTokenFamilyHeader({
  name,
  total,
  image,
}: {
  name: string;
  total?: number;
  image?: string;
}) {
  const { openFamilies, updateOpenFamilies } = useOpenFamilies();
  const isFamilyOpen = openFamilies[name];

  const handleToggle = useCallback(
    () =>
      updateOpenFamilies({
        [name]: !isFamilyOpen,
      }),
    [name, isFamilyOpen, updateOpenFamilies]
  );

  return (
    // @ts-ignore
    <TokenFamilyHeader
      childrenAmount={total}
      familyImage={image}
      isOpen={isFamilyOpen}
      onPress={handleToggle}
      title={name}
    />
  );
});
