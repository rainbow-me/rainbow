import PropTypes from 'prop-types';
import React, { cloneElement } from 'react';
import styled from 'styled-components/primitives';
import { position } from '../../styles';
import { withSafeAreaViewInsetValues } from '../../hoc';
import { Row } from '../layout';

const Container = styled.View`
  ${position.cover}
`;

const Wrapper = styled(Row)`
  bottom: ${({ bottomInset }) => (bottomInset + 21)};
  position: absolute;
  right: 12;
`;

const FabWrapper = ({ children, items, safeAreaInset }) => (
  <Container>
    {children}
    <Wrapper
      bottomInset={safeAreaInset.bottom}
      direction="row-reverse"
    >
      {items.map((fab, index) => (
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
  items: PropTypes.arrayOf(PropTypes.node).isRequired,
  safeAreaInset: PropTypes.shape({ bottom: PropTypes.number }),
};

export default withSafeAreaViewInsetValues(FabWrapper);
