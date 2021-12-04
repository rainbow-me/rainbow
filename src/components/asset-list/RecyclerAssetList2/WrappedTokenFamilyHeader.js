import React, { useCallback } from 'react';
import { TokenFamilyHeader } from '../../token-family';
import { useOpenFamilies } from '@rainbow-me/hooks';

export default function WrappedTokenFamilyHeader({ name, total, image }) {
  const showcase = name === 'Showcase';

  const { openFamilies, updateOpenFamilies } = useOpenFamilies();
  const isFamilyOpen = openFamilies[name + (showcase ? '-showcase' : '')];

  const handleToggle = useCallback(
    () =>
      updateOpenFamilies({
        [name + (showcase ? '-showcase' : '')]: !isFamilyOpen,
      }),
    [name, isFamilyOpen, showcase, updateOpenFamilies]
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
