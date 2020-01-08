import { addHours, differenceInMinutes, isPast } from 'date-fns';
import PropTypes from 'prop-types';
import React from 'react';
import { withNavigation } from 'react-navigation';
import { connect } from 'react-redux';
import { compose, onlyUpdateForKeys, withProps } from 'recompact';
import { removeRequest } from '../../redux/requests';
import { colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Button } from '../buttons';
import { RequestCoinIcon } from '../coin-icon';
import { Text } from '../text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';

const BottomRow = ({ dappName }) => <CoinName>{dappName}</CoinName>;

BottomRow.propTypes = {
  dappName: PropTypes.string,
};

const TopRow = ({ expirationColor, expiresAt }) => {
  const minutes = differenceInMinutes(expiresAt, Date.now());

  return (
    <Text color={expirationColor} weight="semibold">
      Expires in {minutes || 0}m
    </Text>
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
        >
          <Button
            backgroundColor={colors.primaryBlue}
            containerStyles={`
              border-radius: 18;
              height: 36;
              padding-left: 12;
              padding-right: 12;
            `}
            disabled={false}
            onPress={this.handlePressOpen}
            ref={this.buttonRef}
            size="small"
            textProps={{ size: 'smedium' }}
          >
            Open
          </Button>
        </CoinRow>
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
        expirationColor:
          percentElapsed > 25 ? colors.primaryBlue : colors.orangeMedium,
        expiresAt,
        percentElapsed,
      };
    }
  ),
  onlyUpdateForKeys(['expirationColor', 'expiresAt', 'percentElapsed'])
)(RequestCoinRow);
