import PropTypes from 'prop-types';
import React, { Children, Fragment } from 'react';
import styled from 'styled-components';
import { colors } from '../../styles';
import { Row } from '../layout';
import Divider from '../Divider';

const Container = styled(Row)`
  borderRadius: 30px;
  background-color: ${colors.dark};
  margin: 30px;
`;

const ModalFooterButtonsRow = ({ children, ...props }) => (
  <Container {...props}>
    {Children.map(children, (child, index) => (
      <Fragment>
        {child}
        {(index < children.length - 1) && <Divider size={0.5} color={colors.black} horizontal={false} />}
      </Fragment>
    ))}
  </Container>
);

ModalFooterButtonsRow.propTypes = {
  children: PropTypes.node,
};

export default ModalFooterButtonsRow;
