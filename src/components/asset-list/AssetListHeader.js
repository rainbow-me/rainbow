import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IS_TESTING } from 'react-native-dotenv';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
import { abbreviations, magicMemo, measureText } from '../../utils';
import { DividerSize } from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered, Row } from '../layout';
import { ListHeader, ListHeaderHeight } from '../list';
import { H1, TruncatedText } from '../text';
import { useTheme } from '@rainbow-me/context';
import { useAccountProfile, useDimensions } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
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
  height: ${android ? '35' : '30'};
  margin-top: 2;
  margin-bottom: ${android ? '8' : '0'};
  max-width: ${({ deviceWidth, totalValueLength }) =>
    deviceWidth - dropdownArrowWidth - 32 - totalValueLength * 15};
  padding-right: 6;
`;

const DropdownArrow = styled(Centered)`
  border-radius: 15;
  height: ${dropdownArrowWidth};
  margin-top: ${android ? '9' : '2'};
  width: ${dropdownArrowWidth};
`;

const WalletSelectButton = ({
  truncatedAccountName,
  onChangeWallet,
  deviceWidth,
  textWidth,
  totalValue,
}) => {
  const { colors } = useTheme();
  return (
    <ButtonPressAnimation onPress={onChangeWallet} scaleTo={0.9}>
      <Row>
        <AccountName
          deviceWidth={deviceWidth}
          textWidth={textWidth}
          totalValueLength={totalValue?.length}
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

const AssetListHeader = ({
  contextMenuOptions,
  isCoinListEdited,
  isSticky,
  title,
  totalValue,
  ...props
}) => {
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
    <ListHeader
      contextMenuOptions={contextMenuOptions}
      isCoinListEdited={isCoinListEdited}
      isSticky={isSticky}
      title={title}
      totalValue={totalValue}
      {...props}
    >
      {!title && (
        <WalletSelectButton
          deviceWidth={deviceWidth}
          onChangeWallet={onChangeWallet}
          textWidth={textWidth}
          totalValue={totalValue}
          truncatedAccountName={truncatedAccountName}
        />
      )}
      {totalValue ? (
        <H1 align="right" letterSpacing="roundedTight" weight="semibold">
          {totalValue}
        </H1>
      ) : null}
    </ListHeader>
  );
};

export default magicMemo(AssetListHeader, [
  'contextMenuOptions',
  'isCoinListEdited',
  'title',
  'totalValue',
]);
