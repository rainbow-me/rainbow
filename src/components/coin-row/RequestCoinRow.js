import { addHours, differenceInMinutes, isPast } from 'date-fns';
import PropTypes from 'prop-types';
import React from 'react';
import { withNavigation } from 'react-navigation';
import { connect } from 'react-redux';
import { compose, onlyUpdateForKeys, withProps } from 'recompact';
import { removeRequest } from '../../redux/requests';
import { colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { RequestCoinIcon } from '../coin-icon';
import { RowWithMargins } from '../layout';
import { Emoji, Text } from '../text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';

const BottomRow = ({ dappName, expirationColor }) => (
  <CoinName color={expirationColor} weight="semibold">
    {dappName}
  </CoinName>
);

BottomRow.propTypes = {
  dappName: PropTypes.string,
};

const TopRow = ({ expirationColor, expiresAt }) => {
  const minutes = differenceInMinutes(expiresAt, Date.now());

  return (
    <RowWithMargins margin={2}>
      <Emoji name="clock4" size="tiny" style={{ marginTop: 1.75 }} />
      <Text color={expirationColor} size="smedium" weight="semibold">
        Expires in {minutes || 0}m
      </Text>
    </RowWithMargins>
  );
};

TopRow.propTypes = {
  expirationColor: PropTypes.string,
  expiresAt: PropTypes.number,
};

class RequestCoinRow extends React.PureComponent {
  static propTypes = {
    ...TopRow.propTypes,
    item: PropTypes.object,
    onPressOpen: PropTypes.func,
  };

  componentDidMount = () => this.handleExpiredRequests();

  componentDidUpdate = () => this.handleExpiredRequests();

  buttonRef = React.createRef();

  handleExpiredRequests = () => {
    if (isPast(this.props.expiresAt)) {
      this.props.removeExpiredRequest(this.props.item.requestId);
    }
  };

  handlePressOpen = () => {
    this.props.navigation.navigate({
      params: { transactionDetails: this.props.item },
      routeName: 'ConfirmRequest',
    });
  };

  render = () => {
    const { expirationColor, expiresAt, item, ...props } = this.props;

    return (
      <ButtonPressAnimation
        onPress={this.handlePressOpen}
        scaleTo={0.98}
        waitFor={this.buttonRef}
      >
        <CoinRow
          {...item}
          {...props}
          bottomRowRender={BottomRow}
          coinIconRender={RequestCoinIcon}
          expirationColor={expirationColor}
          expiresAt={expiresAt}
          topRowRender={TopRow}
        />
      </ButtonPressAnimation>
    );
  };
}

const getPercentageOfTimeElapsed = (startDate, endDate) => {
  const originalDifference = differenceInMinutes(endDate, startDate);
  const currentDifference = differenceInMinutes(endDate, Date.now());

  return Math.floor((currentDifference * 100) / originalDifference);
};

export default compose(
  connect(null, { removeExpiredRequest: removeRequest }),
  withNavigation,
  withProps(
    ({
      item: {
        displayDetails: { timestampInMs },
      },
    }) => {
      const createdAt = new Date(timestampInMs);
      const expiresAt = addHours(createdAt, 1);
      const percentElapsed = getPercentageOfTimeElapsed(createdAt, expiresAt);

      return {
        createdAt,
        expirationColor: percentElapsed > 25 ? colors.appleBlue : colors.orange,
        expiresAt,
        percentElapsed,
      };
    }
  ),
  onlyUpdateForKeys(['expirationColor', 'expiresAt', 'percentElapsed'])
)(RequestCoinRow);
