import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import styled from 'styled-components/primitives';
import { colors, position, shadow } from '../../styles';
import { ButtonPressAnimation } from '../buttons';
import { Centered } from '../layout';

const Container = styled(Centered)`
  ${({ size }) => position.size(size)}
  ${shadow.build(0, 1, 18, colors.alpha(colors.purple, 0.12))}
  ${shadow.build(0, 3, 5, colors.alpha(colors.purple, 0.2))}
  ${shadow.build(0, 6, 10, colors.alpha(colors.purple, 0.14))}
  background-color: ${colors.blue};
  border-radius: 24;
  overflow: hidden;
`;

const InnerBorder = styled.View`
  ${position.cover}
  border-color: ${colors.alpha(colors.black, 0.06)};
  border-radius: 24;
  border-width: 0.5;
`;

const FloatingActionButton = ({ children, size, ...props }) => (
  <ButtonPressAnimation>
    <Container {...props} size={size}>
      <Fragment>
        {(typeof children === 'function')
          ? children({ size })
          : children
        }
        <InnerBorder />
      </Fragment>
    </Container>
  </ButtonPressAnimation>
);

FloatingActionButton.propTypes = {
  children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
  size: PropTypes.number,
};

FloatingActionButton.defaultProps = {
  size: 54,
};

export default FloatingActionButton;
