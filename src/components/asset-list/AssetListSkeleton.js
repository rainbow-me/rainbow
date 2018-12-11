import lang from 'i18n-js';
import { times } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { ActivityIndicator } from 'react-native';
import { withNavigation } from 'react-navigation';
import { compose, omitProps, pure, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import { colors, margin, position } from '../../styles';
import { Button } from '../buttons';
import Icon from '../icons/Icon';
import Divider from '../Divider';
import { Text } from '../text';
import { Centered, Column } from '../layout';
import AssetListHeader from './AssetListHeader';
import AssetListItemSkeleton from './AssetListItemSkeleton';

const Container = styled(Column)`
  ${position.size('100%')}
`;

const SkeletonContainer = styled(Column)`
  position: absolute;
  top: 0;
  z-index: -1;
`;

const SkeletonElement = styled(Icon).attrs({ name: 'assetListItemSkeleton' })`
  ${({ index }) => margin(index === 0 ? 15 : 12.5, 19, 12.5, 15)}
  opacity: ${({ index }) => 1 - 0.2 * index};
`;

const AssetListBody = styled(Centered)`
  flex: 1;
`;

const ButtonContainer = styled(Centered)`
  flex-direction: column;
  width: 225;
  margin-left: auto;
  margin-right: auto;
  padding-bottom: 42.5;
`;

const renderSkeletons = times(5, index => (
  <AssetListItemSkeleton
    index={index}
    key={`SkeletonElement${index}`}
  />
));

const ButtonDivider = styled(Divider)`
  width: 93;
  margin-top: 18;
  margin-bottom: 18;
`;

const ImportText = styled(Text).attrs({
  size: 'smedium',
  weight: 'regular',
  color: '#C4C6CB',
})`
  margin-top: 18;
  text-align: center;
`;

const AssetListSkeleton = ({
  isLoading,
  onPressAddFunds,
  onPressImportWallet,
  ...props
}) => (
  <Container>
    <AssetListHeader
      section={{
        title: lang.t('account.tab_balances'),
        totalValue: '$0.00',
      }}
    />
    <Column>
      {isLoading ? (
        <ActivityIndicator
          animating={true}
          color={colors.alpha(colors.blueGreyLight, 0.666)}
          size="large"
        />
      ) : (
        <ButtonContainer>
          <Button bgColor={colors.appleBlue} onPress={onPressAddFunds}>
            Add Funds
          </Button>
          <ButtonDivider />
          <Button bgColor="#5D9DF6" onPress={onPressImportWallet}>
            Import Wallet
          </Button>
          <ImportText>
            Use your 12 or 24 word seed phrase from an existing wallet.
          </ImportText>
        </ButtonContainer>
      )}
      <SkeletonContainer>
        {renderSkeletons}
      </SkeletonContainer>
    </Column>
  </Container>
);

AssetListSkeleton.propTypes = {
  isLoading: PropTypes.bool,
  onPressAddFunds: PropTypes.func,
  onPressImportWallet: PropTypes.func,
};

export default compose(
  pure,
  withNavigation,
  withHandlers({
    onPressAddFunds: ({ navigation }) => () => navigation.navigate('SettingsScreen'),
    onPressImportWallet: ({ navigation }) => () => navigation.navigate('IntroScreen'),
  }),
  omitProps('navigation'),
)(AssetListSkeleton);
