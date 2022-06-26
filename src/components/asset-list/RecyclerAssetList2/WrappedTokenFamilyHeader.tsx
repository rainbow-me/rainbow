import React from 'react';
import { TokenFamilyHeader } from '../../token-family';
import { useLatestCallback, useOpenFamilies } from '@rainbow-me/hooks';
import { ThemeContextProps } from '@rainbow-me/theme';

export default React.memo(function WrappedTokenFamilyHeader({
  name,
  total,
  image,
  theme,
}: {
  name: string;
  total?: number;
  image?: string;
  theme: ThemeContextProps;
}) {
  const { openFamilies, updateOpenFamilies } = useOpenFamilies();
  const isFamilyOpen = openFamilies[name];

  const handleToggle = useLatestCallback(() =>
    updateOpenFamilies({
      [name]: !isFamilyOpen,
    })
  );

  return (
    // @ts-ignore
    <TokenFamilyHeader
      childrenAmount={total}
      familyImage={image}
      isOpen={isFamilyOpen}
      onPress={handleToggle}
      theme={theme}
      title={name}
    />
  );
});
