import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import { Row } from '../layout';
import Text from './Text';

const Cents = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'right',
  color: colors.dark,
  letterSpacing: 'roundedTightest',
  size: 'large',
  weight: 'heavy',
}))`
  top: 7;
`;

const DollarFigure = ({ value, decimals = 2 }: any) => {
  const [dollars, cents = '00'] = value.split('.');
  const formattedCents = cents.substr(0, decimals);
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Row>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Text color={colors.dark} letterSpacing="zero" size="h1" weight="heavy">
        {dollars}
      </Text>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Cents>{`.${formattedCents}`}</Cents>
    </Row>
  );
};

DollarFigure.propTypes = {
  decimals: PropTypes.number,
  value: PropTypes.string,
};

export default React.memo(DollarFigure);
