import PropTypes from 'prop-types';
import React, { cloneElement } from 'react';
import styled from 'styled-components/primitives';
import { withSafeAreaViewInsetValues } from '../../hoc';
import { position } from '../../styles';
import { Row } from '../layout';

const FabWrapperBottomPosition = 21;

const Container = styled.View`
  ${position.cover}
`;

const Wrapper = styled(Row)`
  bottom: ${({ bottomInset }) => (bottomInset + FabWrapperBottomPosition)};
  position: absolute;
  right: 12;
`;

const FabWrapper = withSafeAreaViewInsetValues(({ children, items, safeAreaInset }) => (
  <Container>
    {children}
    <Wrapper bottomInset={safeAreaInset.bottom} direction="row-reverse">
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
));

FabWrapper.propTypes = {
  children: PropTypes.node,
  items: PropTypes.arrayOf(PropTypes.node).isRequired,
  safeAreaInset: PropTypes.shape({ bottom: PropTypes.number }),
};

FabWrapper.bottomPosition = FabWrapperBottomPosition;

export default FabWrapper;
