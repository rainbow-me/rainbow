import React, { memo, useCallback } from 'react';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { ContactAvatar } from '@/components/contacts';
import { ButtonPressAnimation } from '@/components/animations';
import { Navigation } from '@/navigation';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import Routes from '@/navigation/routesNames';

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
