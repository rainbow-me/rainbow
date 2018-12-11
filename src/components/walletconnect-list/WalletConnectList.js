import { get, pickBy, values } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { FlatList } from 'react-native';
import { compose, onlyUpdateForPropTypes, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import { withWalletConnectConnections, withSafeAreaViewInsetValues } from '../../hoc';
import { walletConnectDisconnectAll } from '../../model/walletconnect';
import { borders, colors, shadow } from '../../styles';
import { Column } from '../layout';
import WalletConnectListItem from './WalletConnectListItem';
import { showActionSheetWithOptions } from '../../utils/actionsheet';

const SheetBorderRadius = 17;

const Sheet = styled(Column)`
  ${borders.buildRadius('top', SheetBorderRadius)}
  ${shadow.build(0, 10, 50, colors.alpha(colors.black, 0.6))}
  background-color: ${colors.white};
  bottom: 0;
  left: 0;
  max-height: ${({ bottomInset }) => bottomInset + (WalletConnectListItem.height * 3)};
  min-height: ${({ bottomInset }) => bottomInset + WalletConnectListItem.height};
  position: absolute;
  right: 0;
  width: 100%;
`;

const WalletConnectList = ({
  onHandleDisconnectAlert,
  onLayout,
  safeAreaInset,
  walletConnectorsByDappName,
}) => (
  <Sheet bottomInset={safeAreaInset.bottom} onLayout={onLayout}>
    <FlatList
      contentContainerStyle={{ paddingBottom: safeAreaInset.bottom }}
      data={walletConnectorsByDappName}
      removeClippedSubviews
      renderItem={({ index, item }) => (
        <WalletConnectListItem
          {...item}
          key={get(item, 'dappName', index)}
          onPress={onHandleDisconnectAlert}
        />
      )}
      scrollIndicatorInsets={{
        bottom: safeAreaInset.bottom,
        top: SheetBorderRadius,
      }}
    />
  </Sheet>
);

WalletConnectList.propTypes = {
  onLayout: PropTypes.func,
  safeAreaInset: PropTypes.object,
  walletConnectorsByDappName: PropTypes.arrayOf(PropTypes.object),
};

export default compose(
  withSafeAreaViewInsetValues,
  withWalletConnectConnections,
  withHandlers({
    onHandleDisconnectAlert: ({ getValidWalletConnectors, removeWalletConnectorByDapp }) => (dappName) => {
      showActionSheetWithOptions({
        cancelButtonIndex: 1,
        destructiveButtonIndex: 0,
        options: ['Disconnect', 'Cancel'],
        title: `Would you like to disconnect from ${dappName}?`,
      }, (buttonIndex) => {
        if (buttonIndex === 0) {
          const validSessions = getValidWalletConnectors();
          const dappSessions = values(pickBy(validSessions, (session) => session.dappName === dappName));
          walletConnectDisconnectAll(dappSessions)
          .then(() => {
            removeWalletConnectorByDapp(dappName);
          });
        }
      });
    }
  }),
  onlyUpdateForPropTypes,
)(WalletConnectList);
