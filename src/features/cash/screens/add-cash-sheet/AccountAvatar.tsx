import React from 'react';

import ContactAvatar from '@/components/contacts/ContactAvatar';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';

export function AccountAvatar() {
  const { accountSymbol, accountColor, accountImage } = useAccountProfileInfo();

  return accountImage ? (
    <ImageAvatar image={accountImage} size="header" />
  ) : (
    <ContactAvatar color={accountColor} size="small" value={accountSymbol} />
  );
}
