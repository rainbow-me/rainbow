import React from 'react';
import { TokenFamilyHeader } from '../../token-family';
import { useLatestCallback, useOpenFamilies } from '@rainbow-me/hooks';
import { ThemeContextProps } from '@rainbow-me/theme';

type Props = {
  name: string;
  total?: number;
  image?: string;
  theme: ThemeContextProps;
};

export default React.memo(function WrappedTokenFamilyHeader({
  name,
  total,
  image,
  theme,
}: Props) {
  const { openFamilies, updateOpenFamilies } = useOpenFamilies();
  const isFamilyOpen = openFamilies[name];

  const handleToggle = useLatestCallback(() =>
    updateOpenFamilies({
      [name]: !isFamilyOpen,
    })
  );

  return (
    <TokenFamilyHeader
      childrenAmount={total}
      familyImage={image}
      isOpen={isFamilyOpen}
      onPress={handleToggle}
      testID={`${name?.toLowerCase()}-family-header`}
      theme={theme}
      title={name}
    />
  );
});
