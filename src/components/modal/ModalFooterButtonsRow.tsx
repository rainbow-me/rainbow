import PropTypes from 'prop-types';
import React, { Children, Fragment } from 'react';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Divider' was resolved to '/Users/nickby... Remove this comment to see the full error message
import Divider from '../Divider';
import { Row } from '../layout';

const Container = styled(Row)`
  border-top-color: ${({ theme: { colors } }) => colors.rowDivider};
  border-top-width: 2;
`;

const ModalFooterButtonsRow = ({ children, ...props }: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <Container {...props}>
    {Children.map(children, (child, index) => (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Fragment>
        {child}
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        {index < children.length - 1 && <Divider horizontal={false} />}
      </Fragment>
    ))}
  </Container>
);

ModalFooterButtonsRow.propTypes = {
  children: PropTypes.node,
};

export default ModalFooterButtonsRow;
