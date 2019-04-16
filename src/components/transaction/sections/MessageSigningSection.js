import lang from 'i18n-js';
import PropTypes from 'prop-types';
import React from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { pure } from 'recompact';
import { colors } from '../../../styles';
import { deviceUtils } from '../../../utils';
import { Monospace } from '../../text';
import TransactionRow from '../TransactionRow';
import TransactionSheet from '../TransactionSheet';

const MessageSigningSection = ({ message, sendButton }) => (
  <TransactionSheet sendButton={sendButton}>
    <TransactionRow title={lang.t('wallet.message_signing.message')}>
      <ScrollView style={{ maxHeight: deviceUtils.isSmallPhone ? 100 : 250 }}>
        <Monospace color={colors.blueGreyDarkTransparent} size="lmedium">
          {message}
        </Monospace>
      </ScrollView>
    </TransactionRow>
  </TransactionSheet>
);

MessageSigningSection.propTypes = {
  message: PropTypes.string,
  sendButton: PropTypes.object,
};

export default pure(MessageSigningSection);
