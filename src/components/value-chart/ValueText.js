import PropTypes from 'prop-types';
import React, { Fragment, useRef } from 'react';
import { Transition, Transitioning } from 'react-native-reanimated';
import { colors } from '../../styles';
import { Icon } from '../icons';
import { RowWithMargins } from '../layout';
import { Text, TruncatedText } from '../text';

const Subtitle = props => (
  <TruncatedText
    {...props}
    color={colors.blueGreyLight}
    letterSpacing="uppercase"
    size="smedium"
    weight="semibold"
  />
);

const Title = props => <TruncatedText {...props} size="h2" weight="bold" />;

const transition = (
  <Transition.Together>
    <Transition.Out
      durationMs={220}
      interpolation="easeInOut"
      propagation="right"
      type="slide-top"
    />
    <Transition.In
      delayMs={120}
      durationMs={200}
      propagation="left"
      type="fade"
    />
  </Transition.Together>
);

const ValueText = ({ change, direction, headerText, value }) => {
  const transitionRef = useRef();

  if (transitionRef.current) {
    transitionRef.current.animateNextTransition();
  }

  return (
    <Transitioning.View
      height={85}
      paddingLeft={15}
      ref={transitionRef}
      transition={transition}
      width="100%"
    >
      {value ? (
        <Fragment>
          <Subtitle>{headerText}</Subtitle>
          <Title>${value}</Title>
          <RowWithMargins align="center" margin={2} marginTop={2}>
            <Icon
              color={direction ? colors.chartGreen : colors.red}
              direction={direction ? 'right' : 'left'}
              fat
              height={15}
              name="arrow"
              width={13}
            />
            <Text
              color={direction ? colors.chartGreen : colors.red}
              letterSpacing="roundedTight"
              lineHeight="loose"
              size="large"
              weight="bold"
            >
              {Math.abs(Number(change))}%
            </Text>
          </RowWithMargins>
        </Fragment>
      ) : (
        <Fragment>
          <Subtitle>Downloading data...</Subtitle>
          <Title>Loading...</Title>
        </Fragment>
      )}
    </Transitioning.View>
  );
};

ValueText.propTypes = {
  change: PropTypes.string,
  direction: PropTypes.bool,
  headerText: PropTypes.string,
  value: PropTypes.number,
};

export default React.memo(ValueText);
