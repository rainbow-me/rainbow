import React from 'react';
import { requireNativeComponent } from 'react-native';

const NativeTransactionListView = requireNativeComponent('TransactionListView');

export default class TransactionList extends React.PureComponent {
  render() {
    return (
      <NativeTransactionListView
        transactions={this.props.transactions}
        accountAddress={this.props.accountAddress}
        onItemPress={e => this.props.onPressTransaction(e.nativeEvent)}
        style={this.props.style}
      />
    );
  }
}
