import { connect } from 'react-redux';
import {
  sendClearFields,
  sendCreatedTransaction,
  sendMaxBalance,
  sendModalInit,
  sendToggleConfirmationView,
  sendUpdateAssetAmount,
  sendUpdateNativeAmount,
  sendUpdateRecipient,
  sendUpdateSelected,
} from '../redux/send';

const mapStateToProps = ({
  send: {
    address,
    assetAmount,
    confirm,
    fetching,
    isSufficientBalance,
    nativeAmount,
    recipient,
    selected,
    txHash,
  },
}) => ({
  address,
  assetAmount,
  confirm,
  fetching,
  isSufficientBalance,
  nativeAmount,
  recipient,
  selected,
  txHash,
});

export default Component =>
  connect(mapStateToProps, {
    sendClearFields,
    sendCreatedTransaction,
    sendMaxBalance,
    sendModalInit,
    sendToggleConfirmationView,
    sendUpdateAssetAmount,
    sendUpdateNativeAmount,
    sendUpdateRecipient,
    sendUpdateSelected,
  })(Component);
