import PropTypes from 'prop-types';
import React, { Children, Fragment } from 'react';
import { colors, padding } from '../../styles';
import { safeAreaInsetValues } from '../../utils';
import { Row } from '../layout';
import Divider from '../Divider';

const ModalFooterButtonsRow = ({ children, ...props }) => (
  <Row
    align="center"
    css={`
      ${padding(0, 3.5)};
      background-color: ${colors.dark};
      border-radius: 30px;
      bottom: ${safeAreaInsetValues.bottom + 20};
    `}
    flex={0}
    {...props}
  >
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
  </Row>
);

ModalFooterButtonsRow.propTypes = {
  children: PropTypes.node,
};

export default ModalFooterButtonsRow;
