import lang from 'i18n-js';
import { times } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { withNavigation } from 'react-navigation';
import { compose, omitProps, withHandlers } from 'recompact';
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

const AssetListSkeleton = ({ onPressAddFunds, skeletonCount, ...props }) => (
  <Container {...props}>
    <AssetListHeader
      section={{
        title: lang.t('account.tab_balances'),
        totalValue: '$0.00',
      }}
    />
    <Column>
      {times(skeletonCount, index => (
        <AssetListItemSkeleton
          index={index}
          key={`SkeletonElement${index}`}
        />
      ))}
      <ButtonContainer>
        <Button
          bgColor={colors.primaryBlue}
          onPress={onPressAddFunds}
        >
          Add Funds
        </Button>
      </ButtonContainer>
    </Column>
  </Container>
);

AssetListSkeleton.propTypes = {
  onPressAddFunds: PropTypes.func,
  skeletonCount: PropTypes.number,
};

AssetListSkeleton.defaultProps = {
  skeletonCount: 5,
};

export default compose(
  withNavigation,
  withHandlers({ onPressAddFunds: ({ navigation }) => () => navigation.push('SettingsScreen') }),
  omitProps('navigation'),
)(AssetListSkeleton);
