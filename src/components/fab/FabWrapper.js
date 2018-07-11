import PropTypes from 'prop-types';
import React, { cloneElement } from 'react';
import styled from 'styled-components/primitives';
// import SuperEllipseMask from 'react-native-super-ellipse-mask';
import { position } from '../../styles';
import { Row } from '../layout';

const Container = styled.View`
  ${position.cover}
`;

const Wrapper = styled(Row)`
  bottom: 12;
  position: absolute;
  right: 12;
`;

const FabWrapper = ({ children, fabs }) => (
  <Container>
    {children}
    <Wrapper direction="row-reverse">
      {fabs.map((fab, index) => (
        cloneElement(fab, {
          key: index,
          style: {
            marginLeft: (index > 0) ? 12 : 0,
          },
        })
      ))}
    </Wrapper>
  </Container>
);

FabWrapper.propTypes = {
  children: PropTypes.node,
  fabs: PropTypes.arrayOf(PropTypes.node).isRequired,
};

export default FabWrapper;
