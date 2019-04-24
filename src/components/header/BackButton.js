import PropTypes from 'prop-types';
import React from 'react';
import { NavigationActions, withNavigation } from 'react-navigation';
import { compose, omitProps, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import { directionPropType } from '../../utils';
import Icon from '../icons/Icon';
import { Flex } from '../layout';
import HeaderButton from './HeaderButton';

const ContainerElement = omitProps('direction')(Flex);
const Container = styled(ContainerElement).attrs({ align: 'end' })`
  height: 100%;
  padding-bottom: 4;
  padding-left: ${({ direction }) => ((direction === 'left') ? 0 : 20)};
  padding-right: ${({ direction }) => ((direction === 'right') ? 0 : 20)};
`;

const BackButton = ({
  color, direction, onPress, ...props
}) => (
  <HeaderButton onPress={onPress} transformOrigin={direction}>
    <Container direction={direction} {...props}>
      <Icon
        color={color}
        direction={direction}
        name="caret"
        {...props}
      />
    </Container>
  </HeaderButton>
);

BackButton.propTypes = {
  color: colors.propType,
  direction: directionPropType,
  onPress: PropTypes.func,
};

export default compose(
  withNavigation,
  withHandlers({
    onPress: ({ navigation, onPress }) => (event) => {
      if (onPress) {
        return onPress(event);
      }

      return navigation.dispatch(NavigationActions.back());
    },
  }),
)(BackButton);
