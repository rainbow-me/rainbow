import PropTypes from 'prop-types';
import React from 'react';
import { Linking } from 'react-native';
import { withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import { Button } from '../buttons';
import Icon from '../icons/Icon';
import { Column, Row } from '../layout';
import { Monospace } from '../text';
import { colors, fonts, padding } from '../../styles';

const QRCodeScannerInitializing = () => (
  <Monospace color="white">
    initializing...
  </Monospace>
);

export default QRCodeScannerInitializing;
