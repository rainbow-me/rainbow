import { toLower } from 'lodash';
import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import styled from 'styled-components/primitives';
import TouchableBackdrop from '../components/TouchableBackdrop';
import { CopyFloatingEmojis } from '../components/floating-emojis';
import { Centered, Column, ColumnWithMargins } from '../components/layout';
import QRCode from '../components/qr-code/QRCode';
import ShareButton from '../components/qr-code/ShareButton';
import { SheetHandle } from '../components/sheet';
import { Text, TruncatedAddress } from '../components/text';
import { CopyToast, ToastPositionContainer } from '../components/toasts';
import { useAccountProfile } from '../hooks';
import { useNavigation } from '../navigation/Navigation';
import { abbreviations, deviceUtils } from '../utils';
import { colors, padding, shadow } from '@rainbow-me/styles';

const QRCodeSize = ios ? 250 : Math.min(230, deviceUtils.dimensions.width - 20);

const AddressText = styled(TruncatedAddress).attrs({
  align: 'center',
  color: colors.white,
  lineHeight: 'loosest',
  opacity: 0.6,
  size: 'large',
  weight: 'semibold',
})`
  width: 100%;
`;

const Container = styled(Centered).attrs({
  direction: 'column',
})`
  bottom: 16;
  flex: 1;
`;

const Handle = styled(SheetHandle).attrs({
  color: colors.white,
})`
  margin-bottom: 19;
`;

const QRWrapper = styled(Column).attrs({ align: 'center' })`
  ${padding(24)};
  ${shadow.build(0, 10, 50, colors.black, 0.6)};
  background-color: ${colors.white};
  border-radius: 39;
`;

const NameText = styled(Text).attrs({
  align: 'center',
  color: colors.white,
  letterSpacing: 'roundedMedium',
  size: 'bigger',
  weight: 'bold',
})``;

const accountAddressSelector = state => state.settings.accountAddress;
const lowercaseAccountAddressSelector = createSelector(
  accountAddressSelector,
  toLower
);

export default function ReceiveModal() {
  const { goBack } = useNavigation();
  const accountAddress = useSelector(lowercaseAccountAddressSelector);
  const { accountName } = useAccountProfile();

  const [copiedText, setCopiedText] = useState(undefined);
  const [copyCount, setCopyCount] = useState(0);
  const handleCopiedText = useCallback(text => {
    setCopiedText(abbreviations.formatAddressForDisplay(text));
    setCopyCount(count => count + 1);
  }, []);

  return (
    <Container testID="receive-modal">
      <TouchableBackdrop onPress={goBack} />
      <Handle />
      <ColumnWithMargins align="center" margin={24}>
        <QRWrapper>
          <QRCode size={QRCodeSize} value={accountAddress} />
        </QRWrapper>
        <CopyFloatingEmojis
          onPress={handleCopiedText}
          textToCopy={accountAddress}
        >
          <ColumnWithMargins margin={2}>
            <NameText>{accountName}</NameText>
            <AddressText address={accountAddress} />
          </ColumnWithMargins>
        </CopyFloatingEmojis>
        <ShareButton accountAddress={accountAddress} />
      </ColumnWithMargins>
      <ToastPositionContainer>
        <CopyToast copiedText={copiedText} copyCount={copyCount} />
      </ToastPositionContainer>
    </Container>
  );
}
