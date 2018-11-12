import { times } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { hoistStatics, onlyUpdateForPropTypes } from 'recompact';
import styled from 'styled-components/primitives';
import { Centered, Column, Row } from '../layout';
import { borders, colors, fonts, padding, position, shadow } from '../../styles';

const PagerPadding = 9;

const Container = styled(Centered)`
  ${padding(PagerPadding)};
  left: 0;
  position: absolute;
  right: 0;
`;

const PagerItem = styled.View`
  ${({ size }) => borders.buildCircle(size)};
  background-color: ${({ color }) => color};
`;

const PagerControls = ({
  color,
  length,
  selectedIndex,
  size,
  ...props
}) => (
  <Container {...props}>
    {times(length, index => (
      <PagerItem
        color={color}
        key={index}
        size={size}
        style={{
          marginRight: (index < length - 1) ? PagerPadding : 0,
          opacity: (index === selectedIndex) ? 1 : 0.3,
        }}
      />
    ))}
  </Container>
);

PagerControls.propTypes = {
  color: PropTypes.string,
  length: PropTypes.number,
  selectedIndex: PropTypes.number,
  size: PropTypes.number,
};

PagerControls.defaultProps = {
  color: colors.black,
  size: 7,
};

PagerControls.padding = PagerPadding;

export default hoistStatics(onlyUpdateForPropTypes)(PagerControls);
