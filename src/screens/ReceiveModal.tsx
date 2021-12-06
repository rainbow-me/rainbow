import { toChecksumAddress } from '@walletconnect/utils';
import { toLower } from 'lodash';
import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/TouchableBackdrop' was resol... Remove this comment to see the full error message
import TouchableBackdrop from '../components/TouchableBackdrop';
import { CopyFloatingEmojis } from '../components/floating-emojis';
import { Centered, Column, ColumnWithMargins } from '../components/layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/qr-code/QRCode' was resolved... Remove this comment to see the full error message
import QRCode from '../components/qr-code/QRCode';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/qr-code/ShareButton' was res... Remove this comment to see the full error message
import ShareButton from '../components/qr-code/ShareButton';
import { SheetHandle } from '../components/sheet';
import { Text, TruncatedAddress } from '../components/text';
import { CopyToast, ToastPositionContainer } from '../components/toasts';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../navigation/Navigation' was resolved to ... Remove this comment to see the full error message
import { useNavigation } from '../navigation/Navigation';
import { abbreviations, deviceUtils } from '../utils';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountProfile } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding, shadow } from '@rainbow-me/styles';

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
const QRCodeSize = ios ? 250 : Math.min(230, deviceUtils.dimensions.width - 20);

const AddressText = styled(TruncatedAddress).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.whiteLabel,
  lineHeight: 'loosest',
  opacity: 0.6,
  size: 'large',
  weight: 'semibold',
}))`
  width: 100%;
`;

const Container = styled(Centered).attrs({
  direction: 'column',
})`
  bottom: 16;
  flex: 1;
`;

const Handle = styled(SheetHandle).attrs(({ theme: { colors } }) => ({
  color: colors.whiteLabel,
}))`
  margin-bottom: 19;
`;

const QRWrapper = styled(Column).attrs({ align: 'center' })`
  ${padding(24)};
  ${({ theme: { colors } }) =>
    shadow.build(0, 10, 50, colors.shadowBlack, 0.6)};
  background-color: ${({ theme: { colors } }) => colors.whiteLabel};
  border-radius: 39;
`;

const NameText = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.whiteLabel,
  letterSpacing: 'roundedMedium',
  size: 'bigger',
  weight: 'bold',
}))``;

const accountAddressSelector = (state: any) => state.settings.accountAddress;
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

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
  const checksummedAddress = useMemo(() => toChecksumAddress(accountAddress), [
    accountAddress,
  ]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container testID="receive-modal">
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <TouchableBackdrop onPress={goBack} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Handle />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ColumnWithMargins align="center" margin={24}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <QRWrapper>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <QRCode size={QRCodeSize} value={checksummedAddress} />
        </QRWrapper>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <CopyFloatingEmojis
          onPress={handleCopiedText}
          textToCopy={checksummedAddress}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ColumnWithMargins margin={2}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <NameText>{accountName}</NameText>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <AddressText address={checksummedAddress} />
          </ColumnWithMargins>
        </CopyFloatingEmojis>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ShareButton accountAddress={checksummedAddress} />
      </ColumnWithMargins>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ToastPositionContainer>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <CopyToast copiedText={copiedText} copyCount={copyCount} />
      </ToastPositionContainer>
    </Container>
  );
}
