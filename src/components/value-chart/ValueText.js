import PropTypes from 'prop-types';
import React, { Fragment, useMemo, useRef } from 'react';
import { colors } from '../../styles';
import { Icon } from '../icons';
import { Column, RowWithMargins } from '../layout';
import { Text, TruncatedText } from '../text';

const Subtitle = props => (
  <TruncatedText
    {...props}
    color={colors.blueGreyDark50}
    letterSpacing="uppercase"
    size="smedium"
    weight="semibold"
  />
);

const Title = props => <TruncatedText {...props} size="h2" weight="bold" />;

const ValueText = ({ change, direction, headerText, value }) => {
  const transitionRef = useRef();

  if (transitionRef.current) {
    transitionRef.current.animateNextTransition();
  }

  const formattedChange = useMemo(() => `${Math.abs(Number(change))}%`, [
    change,
  ]);

  return (
    <Column height={85} paddingLeft={15} width="100%">
      {value ? (
        <Fragment>
          <Subtitle>{headerText}</Subtitle>
          <Title>${value}</Title>
          <RowWithMargins align="center" margin={2} marginTop={2}>
            <Icon
              color={direction ? colors.chartGreen : colors.red}
              direction={direction ? 'left' : 'right'}
              height={15}
              name="fatArrow"
              width={13}
            />
            <Text
              color={direction ? colors.chartGreen : colors.red}
              letterSpacing="roundedTight"
              lineHeight="loose"
              size="large"
              weight="bold"
            >
              {formattedChange}
            </Text>
          </RowWithMargins>
        </Fragment>
      ) : (
        <Fragment>
          <Subtitle>Downloading data...</Subtitle>
          <Title>Loading...</Title>
        </Fragment>
      )}
    </Column>
  );
};

ValueText.propTypes = {
  change: PropTypes.string,
  direction: PropTypes.bool,
  headerText: PropTypes.string,
  value: PropTypes.number,
};

export default React.memo(ValueText);
