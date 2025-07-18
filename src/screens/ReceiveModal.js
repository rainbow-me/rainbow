import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import { Box } from '@/design-system';
import { IS_ANDROID, IS_IOS } from '@/env';
import { toChecksumAddress } from '@/handlers/web3';
import { useDimensions } from '@/hooks';
import { sharedCoolModalTopOffset } from '@/navigation/config';
import { useAccountAddress, useAccountProfileInfo } from '@/state/wallets/walletsStore';
import styled from '@/styled-thing';
import { padding, shadow } from '@/styles';
import React, { useCallback, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CopyFloatingEmojis } from '../components/floating-emojis';
import { Column, ColumnWithMargins } from '../components/layout';
import QRCode from '../components/qr-code/QRCode';
import ShareButton from '../components/qr-code/ShareButton';
import { Text, TruncatedAddress } from '../components/text';
import { CopyToast, ToastPositionContainer } from '../components/toasts';
import { abbreviations, deviceUtils } from '../utils';

const QRCodeSize = IS_IOS ? 250 : Math.min(230, deviceUtils.dimensions.width - 20);

const AddressText = styled(TruncatedAddress).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.whiteLabel,
  lineHeight: 'loosest',
  opacity: 0.6,
  size: 'large',
  weight: 'semibold',
}))({
  width: '100%',
});

const QRWrapper = styled(Column).attrs({ align: 'center' })(({ theme: { colors } }) => ({
  ...shadow.buildAsObject(0, 10, 50, colors.shadowBlack, 0.6),
  ...padding.object(24),
  backgroundColor: colors.whiteLabel,
  borderRadius: 39,
  margin: 24,
}));

const NameText = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.whiteLabel,
  letterSpacing: 'roundedMedium',
  size: 'bigger',
  weight: 'bold',
}))({});

export default function ReceiveModal() {
  const accountAddress = useAccountAddress();
  const { accountName } = useAccountProfileInfo();

  const [copiedText, setCopiedText] = useState(undefined);
  const [copyCount, setCopyCount] = useState(0);
  const handleCopiedText = useCallback(text => {
    setCopiedText(abbreviations.formatAddressForDisplay(text));
    setCopyCount(count => count + 1);
  }, []);

  const checksummedAddress = useMemo(() => toChecksumAddress(accountAddress.toLowerCase()), [accountAddress]);
  const { height: deviceHeight } = useDimensions();
  const { top } = useSafeAreaInsets();

  return (
    <SimpleSheet
      testID="receive-modal"
      backgroundColor={'rgba(0,0,0,0.85)'}
      useAdditionalTopPadding
      customHeight={IS_ANDROID ? deviceHeight - top : deviceHeight - sharedCoolModalTopOffset}
      scrollEnabled={false}
    >
      <Box alignItems="center" justifyContent="center" height="full" width="full">
        <QRWrapper>
          <QRCode size={QRCodeSize} value={checksummedAddress} />
        </QRWrapper>
        <CopyFloatingEmojis onPress={handleCopiedText} textToCopy={checksummedAddress}>
          <ColumnWithMargins margin={2}>
            <NameText>{accountName}</NameText>
            <AddressText address={checksummedAddress} />
          </ColumnWithMargins>
        </CopyFloatingEmojis>
        <ShareButton accountAddress={checksummedAddress} />
        <ToastPositionContainer>
          <CopyToast copiedText={copiedText} copyCount={copyCount} />
        </ToastPositionContainer>
      </Box>
    </SimpleSheet>
  );
}
