import PropTypes from 'prop-types';
import React, { Children, Fragment } from 'react';
import styled from 'styled-components/primitives';
import { colors, padding } from '../../styles';
import Divider from '../Divider';
import InnerBorder from '../InnerBorder';
import { Row } from '../layout';

const ModalFooterBorderRadius = 30;

const Container = styled(Row).attrs({
  align: 'center',
  flex: 0,
})`
  ${padding(0, 3.5)};
  background-color: ${colors.dark};
  border-radius: ${ModalFooterBorderRadius};
`;

const ModalFooterButtonsRow = ({ children, ...props }) => (
  <Container {...props}>
    {Children.map(children, (child, index) => (
      <Fragment>
        {child}
        {(index < children.length - 1) && (
          <Divider
            backgroundColor={colors.dark}
            color={colors.alpha(colors.blueGreyLighter, 0.1)}
            horizontal={false}
            inset={[10, 0]}
          />
        )}
      </Fragment>
    ))}
    <InnerBorder radius={ModalFooterBorderRadius} />
  </Container>
);

ModalFooterButtonsRow.propTypes = {
  children: PropTypes.node,
};

ModalFooterButtonsRow.borderRadius = ModalFooterBorderRadius;

export default ModalFooterButtonsRow;
