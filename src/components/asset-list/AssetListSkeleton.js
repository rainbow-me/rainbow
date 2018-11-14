import lang from 'i18n-js';
import { times } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { ActivityIndicator } from 'react-native';
import { withNavigation } from 'react-navigation';
import { compose, omitProps, pure, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import { colors, position } from '../../styles';
import { Button } from '../buttons';
import { Centered, Column } from '../layout';
import AssetListHeader from './AssetListHeader';
import AssetListItemSkeleton from './AssetListItemSkeleton';

const ButtonContainer = styled(Centered)`
  bottom: 28;
  position: absolute;
  width: 100%;
`;

const Container = styled(Column)`
  ${position.size('100%')}
`;

const renderSkeletons = times(5, index => (
  <AssetListItemSkeleton
    index={index}
    key={`SkeletonElement${index}`}
  />
));

const AssetListSkeleton = ({
  isLoading,
  onPressAddFunds,
  skeletonCount,
  ...props
}) => (
  <Container {...props}>
    <AssetListHeader
      section={{
        title: lang.t('account.tab_balances'),
        totalValue: '$0.00',
      }}
    />
    <Column>
      {renderSkeletons}
      {isLoading ? (
        <ActivityIndicator
          animating={true}
          color={colors.alpha(colors.blueGreyLight, 0.666)}
          size="large"
        />
      ) : (
        <ButtonContainer>
          <Button
            bgColor={colors.primaryBlue}
            onPress={onPressAddFunds}
          >
            Add Funds
          </Button>
        </ButtonContainer>
      )}
    </Column>
  </Container>
);

AssetListSkeleton.propTypes = {
  isLoading: PropTypes.bool,
  onPressAddFunds: PropTypes.func,
};

export default compose(
  pure,
  withNavigation,
  withHandlers({ onPressAddFunds: ({ navigation }) => () => navigation.push('SettingsScreen') }),
  omitProps('navigation'),
)(AssetListSkeleton);
