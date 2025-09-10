import Divider from '@/components/Divider';
import { useDimensions, useHiddenTokens, useShowcaseTokens } from '@/hooks';
import * as i18n from '@/languages';
import { RAINBOW_PROFILES_BASE_URL } from '@/references';
import { getIsReadOnlyWallet, useAccountAddress, useAccountProfileInfo } from '@/state/wallets/walletsStore';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import React, { Fragment } from 'react';
import { Share } from 'react-native';
import { ButtonPressAnimation } from '../animations';
import CoinDividerButtonLabel from '../coin-divider/CoinDividerButtonLabel';
import { ContextMenu } from '../context-menu';
import { Column, Row } from '../layout';
import { H1 } from '../text';
import { initializeShowcaseIfNeeded } from '@/helpers/webData';

export const ListHeaderHeight = 48;

const ShareCollectiblesBPA = styled(ButtonPressAnimation)({
  backgroundColor: ({ theme: { colors } }) => colors.alpha(colors.blueGreyDark, 0.06),
  borderRadius: 15,
  height: 30,
  justifyContent: 'center',
  paddingBottom: 5,
  paddingTop: 5,
  paddingHorizontal: 10,
});

const ShareCollectiblesButton = ({ onPress }) => (
  <ShareCollectiblesBPA onPress={onPress} scale={0.9}>
    <CoinDividerButtonLabel align="center" label={`􀈂 ${i18n.t(i18n.l.button.share)}`} shareButton />
  </ShareCollectiblesBPA>
);

const Content = styled(Row).attrs(({ theme: { colors } }) => ({
  align: 'center',
  backgroundColor: colors.white,
  justify: 'space-between',
}))({
  ...padding.object(5, 19),
  height: ListHeaderHeight,
  width: '100%',
});

const StickyBackgroundBlocker = styled.View({
  backgroundColor: ({ theme: { colors } }) => colors.white,
  height: ({ isEditMode }) => (isEditMode ? ListHeaderHeight : 0),
  top: ({ isEditMode }) => (isEditMode ? -40 : 0),
  width: ({ deviceDimensions }) => deviceDimensions.width,
});

export default function ListHeader({ children, contextMenuOptions, isCoinListEdited, showDivider = true, title, totalValue }) {
  const deviceDimensions = useDimensions();
  const { colors, isDarkMode } = useTheme();
  const accountAddress = useAccountAddress();
  const { accountENS, accountColorHex, accountSymbol } = useAccountProfileInfo();
  const { showcaseTokens } = useShowcaseTokens();
  const { hiddenTokens } = useHiddenTokens();

  const handleShare = useCallback(async () => {
    const isReadOnly = getIsReadOnlyWallet();
    if (!isReadOnly) {
      await initializeShowcaseIfNeeded(accountAddress, showcaseTokens, hiddenTokens, accountColorHex, accountSymbol);
    }
    const showcaseUrl = `${RAINBOW_PROFILES_BASE_URL}/${accountENS || accountAddress}`;
    const shareOptions = {
      message: isReadOnly
        ? i18n.t(i18n.l.list.share.check_out_this_wallet, { showcaseUrl })
        : i18n.t(i18n.l.list.share.check_out_my_wallet, { showcaseUrl }),
    };
    Share.share(shareOptions);
  }, [accountAddress, accountColorHex, accountENS, accountSymbol, hiddenTokens, showcaseTokens]);

  return (
    <Fragment>
      <Content>
        {title && (
          <Row align="center">
            {/* eslint-disable-next-line react/no-children-prop */}
            <Row style={{ maxWidth: 200 }}>
              <H1 ellipsizeMode="tail" numberOfLines={1}>
                {title}
              </H1>
            </Row>
            {title === i18n.t(i18n.l.account.tab_collectibles) && (
              <Column align="flex-end" flex={1}>
                <ShareCollectiblesButton onPress={() => handleShare(getIsReadOnlyWallet(), accountAddress)} />
              </Column>
            )}
            <ContextMenu marginTop={3} {...contextMenuOptions} />
          </Row>
        )}
        {children}
      </Content>
      {
        /*
         The divider shows up as a white line in dark mode (android)
         so we won't render it till we figure it out why
        */
        showDivider && !(android && isDarkMode) && <Divider color={colors.rowDividerLight} />
      }
      <StickyBackgroundBlocker deviceDimensions={deviceDimensions} isEditMode={isCoinListEdited} />
    </Fragment>
  );
}
