import React, { useCallback, useEffect, useMemo, useState } from 'react';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
import { abbreviations, magicMemo, measureText } from '../../utils';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Divider' was resolved to '/Users/nickby... Remove this comment to see the full error message
import { DividerSize } from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered, Row } from '../layout';
import { ListHeader, ListHeaderHeight } from '../list';
import { H1, TruncatedText } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/context' or its co... Remove this comment to see the full error message
import { useTheme } from '@rainbow-me/context';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountProfile, useDimensions } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { fonts, position } from '@rainbow-me/styles';

export const AssetListHeaderHeight = ListHeaderHeight + DividerSize;

const dropdownArrowWidth = 30;

const AccountName = styled(TruncatedText).attrs({
  align: 'left',
  firstSectionLength: abbreviations.defaultNumCharsPerSection,
  letterSpacing: 'roundedMedium',
  size: 'big',
  truncationLength: 4,
  weight: 'heavy',
})`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  height: ${android ? '35' : '30'};
  margin-top: 2;
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  margin-bottom: ${android ? '8' : '0'};
  max-width: ${({ deviceWidth, totalValueLength }) =>
    deviceWidth - dropdownArrowWidth - 32 - totalValueLength * 15};
  padding-right: 6;
`;

const DropdownArrow = styled(Centered)`
  border-radius: 15;
  height: ${dropdownArrowWidth};
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  margin-top: ${android ? '9' : '2'};
  width: ${dropdownArrowWidth};
`;

const WalletSelectButton = ({
  truncatedAccountName,
  onChangeWallet,
  deviceWidth,
  textWidth,
  totalValue,
}: any) => {
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation onPress={onChangeWallet} scaleTo={0.9}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Row>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <AccountName
          deviceWidth={deviceWidth}
          textWidth={textWidth}
          totalValueLength={totalValue?.length}
        >
          {truncatedAccountName}
        </AccountName>
        {truncatedAccountName ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <DropdownArrow>
            {IS_TESTING !== 'true' && (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <LinearGradient
                // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
                borderRadius={15}
                colors={colors.gradients.lightestGrey}
                end={{ x: 0.5, y: 1 }}
                pointerEvents="none"
                start={{ x: 0.5, y: 0 }}
                style={[position.coverAsObject, { borderRadius: 15 }]}
              />
            )}
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Icon name="walletSwitcherCaret" />
          </DropdownArrow>
        ) : null}
      </Row>
    </ButtonPressAnimation>
  );
};

const AssetListHeader = ({
  contextMenuOptions,
  isCoinListEdited,
  isSticky,
  title,
  totalValue,
  ...props
}: any) => {
  const { width: deviceWidth } = useDimensions();
  const { accountName } = useAccountProfile();
  const { navigate } = useNavigation();

  const onChangeWallet = useCallback(() => {
    navigate(Routes.CHANGE_WALLET_SHEET);
  }, [navigate]);

  const [textWidth, setTextWidth] = useState(deviceWidth);

  const maxWidth =
    deviceWidth - dropdownArrowWidth - 32 - totalValue?.length * 15;

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

  const truncated = textWidth > maxWidth - 6;

  const truncatedAccountName = useMemo(() => {
    if (truncated && accountName?.endsWith('.eth')) {
      return accountName.slice(0, -4);
    }
    return accountName;
  }, [accountName, truncated]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ListHeader
      contextMenuOptions={contextMenuOptions}
      isCoinListEdited={isCoinListEdited}
      isSticky={isSticky}
      title={title}
      totalValue={totalValue}
      {...props}
    >
      {!title && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <WalletSelectButton
          deviceWidth={deviceWidth}
          onChangeWallet={onChangeWallet}
          textWidth={textWidth}
          totalValue={totalValue}
          truncatedAccountName={truncatedAccountName}
        />
      )}
      {totalValue ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <H1 align="right" letterSpacing="roundedTight" weight="semibold">
          {totalValue}
        </H1>
      ) : null}
    </ListHeader>
  );
};

// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
export default magicMemo(AssetListHeader, [
  'contextMenuOptions',
  'isCoinListEdited',
  'title',
  'totalValue',
]);
