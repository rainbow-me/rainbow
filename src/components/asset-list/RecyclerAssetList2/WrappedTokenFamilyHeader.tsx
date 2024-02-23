import React from 'react';
import { TokenFamilyHeader } from '../../token-family';
import { useLatestCallback, useOpenFamilies } from '@/hooks';
import { ThemeContextProps } from '@/theme';

type Props = {
  name: string;
  total?: number;
  image?: string;
  theme: ThemeContextProps;
  testID?: string;
};

export default React.memo(function WrappedTokenFamilyHeader({ name, total, image, theme, testID }: Props) {
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
      testID={testID}
      theme={theme}
      title={name}
    />
  );
});
