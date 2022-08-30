import PropTypes from 'prop-types';
import React, { Children, Fragment } from 'react';
import Divider from '../Divider';
import { Row } from '../layout';
import styled from '@/styled-thing';

const Container = styled(Row)({
  borderTopColor: ({ theme: { colors } }) => colors.rowDivider,
  borderTopWidth: 2,
});

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
