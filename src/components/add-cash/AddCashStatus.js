import PropTypes from 'prop-types';
import { Text } from '../text';
import React from 'react';
import { Centered } from '../../components/layout';
import {
  WYRE_ORDER_STATUS_TYPES,
  WYRE_TRANSFER_STATUS_TYPES,
} from '../../redux/wyre';

const AddCashStatus = ({ orderStatus, transferHash, transferStatus }) => {
  console.log('add cash status', orderStatus, transferHash, transferStatus);
  let label = 'Running checks';
  if (
    orderStatus === WYRE_ORDER_STATUS_TYPES.failed ||
    transferStatus === WYRE_TRANSFER_STATUS_TYPES.failed
  ) {
    label = 'Sorry, the purchase failed.';
  } else if (transferStatus === WYRE_TRANSFER_STATUS_TYPES.success) {
    label = 'Completed! 🎉';
  } else if (transferHash) {
    label = 'Waiting for transaction';
  } else if (transferStatus === WYRE_TRANSFER_STATUS_TYPES.pending) {
    label = 'Processing';
  }
  return (
    <Centered width="100%">
      <Text>{label}</Text>
    </Centered>
  );
};

AddCashStatus.propTypes = {
  orderStatus: PropTypes.string,
  transferHash: PropTypes.string,
  transferStatus: PropTypes.string,
};

export default AddCashStatus;
