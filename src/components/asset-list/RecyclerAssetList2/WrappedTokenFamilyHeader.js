import React, { useCallback } from 'react';
import { TokenFamilyHeader } from '../../token-family';
import { useOpenFamilies } from '@rainbow-me/hooks';

export default function WrappedTokenFamilyHeader({ name, total, image }) {
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
    <TokenFamilyHeader
      childrenAmount={total}
      familyImage={image}
      isOpen={isFamilyOpen}
      onPress={handleToggle}
      title={name}
    />
  );
}
