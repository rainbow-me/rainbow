import { times } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { withNavigation } from 'react-navigation';
import { compose, omitProps, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import { colors, margin, position } from '../../styles';
import { Button } from '../buttons';
import Icon from '../icons/Icon';
import { Centered, Column } from '../layout';
import AssetListHeader from './AssetListHeader';

const ButtonContainer = styled(Centered)`
  bottom: 28;
  position: absolute;
  width: 100%;
`;

const Container = styled(Column)`
  ${position.size('100%')}
`;

const SkeletonElement = styled(Icon).attrs({ name: 'assetListItemSkeleton' })`
  ${({ index }) => margin((index === 0 ? 15 : 12.5), 19, 12.5, 15)}
  opacity: ${({ index }) => (1 - (0.2 * index))};
`;

const AssetListSkeleton = ({ onPressAddFunds, skeletonCount }) => (
  <Container>
    <AssetListHeader section={{ title: 'Balances', totalValue: '$0.00' }} />
    <Column>
      {times(skeletonCount, index => (
        <SkeletonElement
          index={index}
          key={`${SkeletonElement}${index}`}
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
  withHandlers({
    onPressAddFunds: ({ navigation }) => () => navigation.navigate('SettingsScreen'),
  }),
  omitProps('navigation'),
)(AssetListSkeleton);
