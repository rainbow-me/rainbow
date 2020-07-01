import PropTypes from 'prop-types';
import React, { Children, Fragment } from 'react';
import styled from 'styled-components';
import Divider from '../Divider';
import { Row } from '../layout';
import { colors } from '@rainbow-me/styles';

const Container = styled(Row)`
  border-top-color: ${colors.rowDivider};
  border-top-width: 2;
`;

const ModalFooterButtonsRow = ({ children, ...props }) => (
  <Container {...props}>
    {Children.map(children, (child, index) => (
      <Fragment>
        {child}
        {index < children.length - 1 && <Divider horizontal={false} />}
      </Fragment>
    ))}
  </Container>
);

ModalFooterButtonsRow.propTypes = {
  children: PropTypes.node,
};

export default ModalFooterButtonsRow;
