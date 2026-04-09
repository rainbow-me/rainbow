import React, { memo, useCallback } from 'react';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';

type AccountImageProps = {
  onPress?: () => void;
};

export const AccountImage = memo(function AccountImage({ onPress }: AccountImageProps) {
  const { accountImage, accountColor, accountSymbol } = useAccountProfileInfo();

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
    } else {
      Navigation.handleAction(Routes.CHANGE_WALLET_SHEET);
    }
  }, [onPress]);

  return (
    <ButtonPressAnimation onPress={handlePress} scaleTo={0.8} overflowMargin={50}>
      {accountImage ? (
        <ImageAvatar image={accountImage} marginRight={10} size="header" />
      ) : (
        <ContactAvatar color={accountColor} marginRight={10} size="small" value={accountSymbol} />
      )}
    </ButtonPressAnimation>
  );
});
