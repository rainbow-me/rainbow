import React, { useCallback } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
import { abbreviations, magicMemo } from '../../utils';
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
import { position } from '@rainbow-me/styles';

export const AssetListHeaderHeight = ListHeaderHeight + DividerSize;

const dropdownArrowWidth = 21;

const AccountName = styled(TruncatedText).attrs({
  align: 'left',
  firstSectionLength: abbreviations.defaultNumCharsPerSection,
  letterSpacing: 'roundedMedium',
  size: 'big',
  truncationLength: 4,
  weight: 'heavy',
})`
  height: ${android ? '35' : '30'};
  margin-top: ${android ? '-10' : '2'};
  margin-bottom: ${android ? '10' : '0'};
  max-width: ${({ deviceWidth, totalValueLength }) =>
    deviceWidth - dropdownArrowWidth - 57 - totalValueLength * 15};
  padding-right: 6;
`;

const DropdownArrow = styled(Centered)`
  border-radius: 15px;
  height: 30px;
  margin-top: 2px;
  width: 30px;
`;

const AssetListHeader = ({
  contextMenuOptions,
  isCoinListEdited,
  isSticky,
  title,
  totalValue,
  ...props
}) => {
  const { width: deviceWidth } = useDimensions();
  const { colors } = useTheme();
  const { accountName } = useAccountProfile();
  const { navigate } = useNavigation();

  const onChangeWallet = useCallback(() => {
    navigate(Routes.CHANGE_WALLET_SHEET);
  }, [navigate]);

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
        <ButtonPressAnimation onPress={onChangeWallet}>
          <Row>
            <AccountName
              deviceWidth={deviceWidth}
              totalValueLength={totalValue.length}
            >
              {accountName}
            </AccountName>
            {accountName && (
              <DropdownArrow>
                <LinearGradient
                  borderRadius={15}
                  colors={colors.gradients.lightestGrey}
                  end={{ x: 0.5, y: 1 }}
                  pointerEvents="none"
                  start={{ x: 0.5, y: 0 }}
                  style={position.coverAsObject}
                />
                <Icon name="walletSwitcherCaret" />
              </DropdownArrow>
            )}
          </Row>
        </ButtonPressAnimation>
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
