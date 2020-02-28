import PropTypes from 'prop-types';
import React from 'react';
// import {
//   WYRE_ORDER_STATUS_TYPES,
//   WYRE_TRANSFER_STATUS_TYPES,
// } from '../../helpers/wyreStatusTypes';
import { Centered } from '../layout';
import { Br, Rounded } from '../text';

const AddCashStatus = ({ orderStatus, transferHash, transferStatus }) => {
  console.log('add cash status', orderStatus, transferHash, transferStatus);
  // let label = 'Running checks';

  // if (
  //   orderStatus === WYRE_ORDER_STATUS_TYPES.failed ||
  //   transferStatus === WYRE_TRANSFER_STATUS_TYPES.failed
  // ) {
  //   label = 'Sorry, the purchase failed.';
  // } else if (transferStatus === WYRE_TRANSFER_STATUS_TYPES.success) {
  //   label = 'Completed! 🎉';
  // } else if (transferHash) {
  //   label = 'Waiting for transaction';
  // } else if (transferStatus === WYRE_TRANSFER_STATUS_TYPES.pending) {
  //   label = 'Processing';
  // }
  const currency = 'DAI';

  return (
    <Centered direction="column" flex={1}>
      <Centered flex={1}>
        <Rounded
          align="center"
          letterSpacing="looseyGoosey"
          lineHeight={30}
          size={23}
          weight="bold"
        >
          Your {currency} is on the way <Br />
          and will arrive shortly
        </Rounded>
      </Centered>
      <Centered flex={0}>
        <Rounded>need help?</Rounded>
      </Centered>
    </Centered>
  );
};

AddCashStatus.propTypes = {
  orderStatus: PropTypes.string,
  transferHash: PropTypes.string,
  transferStatus: PropTypes.string,
};

export default AddCashStatus;
