import { IS_TEST } from '@/env';
import { useDimensions } from '@/hooks';
import * as lang from '@/languages';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';
import styled from '@/styled-thing';
import { fonts, position } from '@/styles';
import { useTheme } from '@/theme';
import React, { ComponentProps, useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { abbreviations, magicMemo, measureText } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered, Row } from '../layout';
import { ListHeader, ListHeaderHeight } from '../list';
import Skeleton, { FakeText } from '../skeleton/Skeleton';
import { H1, TruncatedText } from '../text';
import { StickyHeader } from './RecyclerAssetList2/core/StickyHeaders';

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
  maxWidth: ({ maxWidth }: { maxWidth: number }) => maxWidth,
  paddingRight: 6,
});

const DropdownArrow = styled(Centered)({
  borderRadius: 15,
  height: dropdownArrowWidth,
  marginTop: android ? 9 : 2,
  width: dropdownArrowWidth,
});

const WalletSelectButtonWrapper = styled(View)({
  flex: 1,
});

const TotalAmountSkeleton = styled(Skeleton)({
  alignItems: 'flex-end',
  justifyContent: 'center',
});

type WalletSelectButtonProps = {
  accountName: string;
  onChangeWallet: () => void;
  deviceWidth: number;
  textWidth: number;
  maxWidth: number;
};

const WalletSelectButton = ({ accountName, onChangeWallet, deviceWidth, textWidth, maxWidth }: WalletSelectButtonProps) => {
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
            {!IS_TEST && (
              <LinearGradient
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

type AssetListHeaderProps = {
  contextMenuOptions?: any;
  isCoinListEdited?: boolean;
  title: string;
  totalValue?: string;
  isSticky?: boolean;
} & Partial<ComponentProps<typeof ListHeader>>;

const AssetListHeader = ({ contextMenuOptions, isCoinListEdited, title, totalValue, isSticky = true, ...props }: AssetListHeaderProps) => {
  const { width: deviceWidth } = useDimensions();
  const { accountName } = useAccountProfileInfo();
  const { navigate } = useNavigation();
  const isLoadingUserAssets = useUserAssetsStore(state => state.getStatus().isInitialLoading);

  const onChangeWallet = useCallback(() => {
    navigate(Routes.CHANGE_WALLET_SHEET);
  }, [navigate]);

  const [textWidth, setTextWidth] = useState(0);

  const amountWidth = isLoadingUserAssets ? placeholderWidth + 16 : totalValue?.length * 15;
  const maxWidth = deviceWidth - dropdownArrowWidth - amountWidth - 32;

  useEffect(() => {
    async function measure() {
      const { width } = await measureText(accountName, {
        fontSize: fonts.size.big,
        fontWeight: fonts.weight.heavy,
        letterSpacing: fonts.letterSpacing.roundedMedium,
      });
      setTextWidth(width ?? 0);
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
        {!title && !!accountName && (
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
