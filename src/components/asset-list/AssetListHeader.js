import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IS_TESTING } from 'react-native-dotenv';
import LinearGradient from 'react-native-linear-gradient';
import { abbreviations, magicMemo, measureText } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered, Row } from '../layout';
import { ListHeader, ListHeaderHeight } from '../list';
import Skeleton, { FakeText } from '../skeleton/Skeleton';
import { H1, TruncatedText } from '../text';
import { StickyHeader } from './RecyclerAssetList2/core/StickyHeaders';
import { useAccountProfile, useDimensions } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useUserAssetCount } from '@/resources/assets/useUserAssetCount';
import styled from '@/styled-thing';
import { fonts, position } from '@/styles';
import { useTheme } from '@/theme';
import * as lang from '@/languages';

export const AssetListHeaderHeight = ListHeaderHeight;

const dropdownArrowWidth = 30;
const placeholderWidth = 120;

const AccountName = styled(TruncatedText).attrs({
  align: 'left',
  firstSectionLength: abbreviations.defaultNumCharsPerSection,
  letterSpacing: 'roundedMedium',
  size: 'big',
  truncationLength: 4,
  weight: 'heavy',
})({
  height: android ? 35 : 30,
  marginBottom: android ? 8 : 0,
  marginTop: 2,
  maxWidth: ({ maxWidth }) => maxWidth,
  paddingRight: 6,
});

const DropdownArrow = styled(Centered)({
  borderRadius: 15,
  height: dropdownArrowWidth,
  marginTop: android ? 9 : 2,
  width: dropdownArrowWidth,
});

const WalletSelectButtonWrapper = styled.View({
  flex: 1,
});

const TotalAmountSkeleton = styled(Skeleton)({
  alignItems: 'flex-end',
  justifyContent: 'center',
});

const WalletSelectButton = ({ accountName, onChangeWallet, deviceWidth, textWidth, maxWidth }) => {
  const { colors } = useTheme();

  const truncated = textWidth > maxWidth - 6;

  const truncatedAccountName = useMemo(() => {
    if (textWidth > 0) {
      if (truncated && accountName?.endsWith('.eth')) {
        return accountName.slice(0, -4);
      }
      return accountName;
    }
    return '';
  }, [accountName, textWidth, truncated]);

  return (
    <ButtonPressAnimation onPress={onChangeWallet} scaleTo={0.9}>
      <Row>
        <AccountName
          deviceWidth={deviceWidth}
          maxWidth={maxWidth}
          testID={`wallet-screen-account-name-${accountName || ''}`}
          textWidth={textWidth}
        >
          {truncatedAccountName}
        </AccountName>
        {truncatedAccountName ? (
          <DropdownArrow>
            {IS_TESTING !== 'true' && (
              <LinearGradient
                borderRadius={15}
                colors={colors.gradients.lightestGrey}
                end={{ x: 0.5, y: 1 }}
                pointerEvents="none"
                start={{ x: 0.5, y: 0 }}
                style={[position.coverAsObject, { borderRadius: 15 }]}
              />
            )}
            <Icon name="walletSwitcherCaret" />
          </DropdownArrow>
        ) : null}
      </Row>
    </ButtonPressAnimation>
  );
};

const AssetListHeader = ({ contextMenuOptions, isCoinListEdited, title, totalValue, isSticky = true, ...props }) => {
  const { width: deviceWidth } = useDimensions();
  const { accountName } = useAccountProfile();
  const { navigate } = useNavigation();
  const { isLoading: isLoadingUserAssets } = useUserAssetCount();

  const onChangeWallet = useCallback(() => {
    navigate(Routes.CHANGE_WALLET_SHEET);
  }, [navigate]);

  const [textWidth, setTextWidth] = useState(0);

  const amountWidth = isLoadingUserAssets ? placeholderWidth + 16 : totalValue?.length * 15;
  const maxWidth = deviceWidth - dropdownArrowWidth - amountWidth - 32;

  useEffect(() => {
    async function measure() {
      const { width } = await measureText(accountName, {
        fontSize: parseFloat(fonts.size.big),
        fontWeight: fonts.weight.heavy,
        letterSpacing: fonts.letterSpacing.roundedMedium,
      });
      setTextWidth(width);
    }
    measure();
  }, [accountName]);

  const children = useMemo(() => {
    return (
      <ListHeader
        contextMenuOptions={contextMenuOptions}
        isCoinListEdited={isCoinListEdited}
        title={title}
        totalValue={totalValue}
        {...props}
      >
        {!title && (
          <WalletSelectButtonWrapper>
            <WalletSelectButton
              accountName={accountName}
              deviceWidth={deviceWidth}
              maxWidth={maxWidth}
              onChangeWallet={onChangeWallet}
              textWidth={textWidth}
            />
          </WalletSelectButtonWrapper>
        )}
        {isLoadingUserAssets && title !== lang.t(lang.l.account.tab_collectibles) ? (
          <TotalAmountSkeleton>
            <FakeText height={16} width={placeholderWidth} />
          </TotalAmountSkeleton>
        ) : totalValue ? (
          <H1 align="right" letterSpacing="roundedTight" weight="semibold">
            {totalValue}
          </H1>
        ) : null}
      </ListHeader>
    );
  }, [
    accountName,
    contextMenuOptions,
    deviceWidth,
    isCoinListEdited,
    isLoadingUserAssets,
    maxWidth,
    onChangeWallet,
    props,
    textWidth,
    title,
    totalValue,
  ]);

  if (isSticky) {
    return <StickyHeader name={title}>{children}</StickyHeader>;
  }

  return children;
};

export default magicMemo(AssetListHeader, ['contextMenuOptions', 'isCoinListEdited', 'title', 'totalValue']);
