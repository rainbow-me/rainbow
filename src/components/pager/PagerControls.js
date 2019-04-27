import { times } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-primitives';
import { onlyUpdateForKeys } from 'recompact';
import styled from 'styled-components/primitives';
import { Centered } from '../layout';
import { borders, colors, padding } from '../../styles';

const PagerPadding = 9;

const Container = styled(Centered)`
  ${padding(PagerPadding)};
  left: 0;
  position: absolute;
  right: 0;
`;

const enhance = onlyUpdateForKeys(['selectedIndex']);

const PagerControls = enhance(({
  color,
  length,
  selectedIndex,
  size,
  ...props
}) => (
  <Container {...props}>
    {times(length, index => (
      <View
        key={index}
        style={{
          ...borders.buildCircleAsObject(size),
          backgroundColor: color,
          marginRight: (index < length - 1) ? PagerPadding : 0,
          opacity: (index === selectedIndex) ? 1 : 0.3,
        }}
      />
    ))}
  </Container>
));

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

export default PagerControls;
