import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import styled, { css } from 'styled-components/primitives';
import { colors, position, shadow } from '../../styles';
import { ButtonPressAnimation } from '../buttons';
import { Centered } from '../layout';

const containerStyles = css`
  ${({ size }) => position.size(size)}
  border-radius: 24;
`;

const Container = styled(Centered)`
  ${containerStyles}
  background-color: ${({ disabled }) => (disabled ? '#F6F7F9' : colors.blue)};
  overflow: hidden;
`;

const InnerBorder = styled.View`
  ${position.cover}
  border-color: ${colors.alpha(colors.black, 0.06)};
  border-radius: 24;
  border-width: 0.5;
`;

const Shadow = styled.View`
  ${containerStyles}
  ${({ disabled }) => (disabled ? null : shadow.build(0, 1, 18, colors.alpha(colors.purple, 0.12)))}
  ${({ disabled }) => (disabled ? null : shadow.build(0, 3, 5, colors.alpha(colors.purple, 0.2)))}
  ${({ disabled }) => (disabled ? null : shadow.build(0, 6, 10, colors.alpha(colors.purple, 0.14)))}
`;

const FloatingActionButton = ({
  children,
  disabled,
  onPress,
  onPressIn,
  onPressOut,
  size,
  ...props
}) => (
  <ButtonPressAnimation
    disabled={disabled}
    onPress={onPress}
    onPressIn={onPressIn}
    onPressOut={onPressOut}
  >
    <Shadow size={size} disabled={disabled}>
      <Container {...props} disabled={disabled} size={size}>
        <Fragment>
          {(typeof children === 'function')
            ? children({ size })
            : children
          }
          {!disabled && <InnerBorder />}
        </Fragment>
      </Container>
    </Shadow>
  </ButtonPressAnimation>
);

FloatingActionButton.propTypes = {
  children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
  disabled: PropTypes.bool,
  onPress: PropTypes.func,
  onPressIn: PropTypes.func,
  onPressOut: PropTypes.func,
  size: PropTypes.number,
};

FloatingActionButton.defaultProps = {
  size: 54,
};

export default FloatingActionButton;
