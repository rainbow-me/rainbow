import { useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import ShadowStack from 'react-native-shadow-stack/dist/ShadowStack';
import styled from 'styled-components';
import WalletTypes from '../../helpers/walletTypes';
import { useClipboard, useDimensions, useWallets } from '../../hooks';
import {
  identifyWalletType,
  loadSeedPhraseAndMigrateIfNeeded,
} from '../../model/wallet';
import { colors, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { CopyFloatingEmojis } from '../floating-emojis';
import { Icon } from '../icons';
import { Centered, Column, Row, RowWithMargins } from '../layout';
import { SheetButton } from '../sheet';
import { Nbsp, Text } from '../text';

const SecretDisplayItemText = styled(Text).attrs({

  lineHeight: 'looser',
  size: 'lmedium',
})``;

export default function SecretDisplayItem({
  align = 'left',
  number,
  word,
}) {
  return (
    <RowWithMargins marginBottom={9}>
      <SecretDisplayItemText align={align} color="appleBlue">
        {number}
        <Nbsp />
        <SecretDisplayItemText align={align} color="blueGreyDark" weight="bold">
          {word}
        </SecretDisplayItemText>
      </SecretDisplayItemText>
    </RowWithMargins>
  );
}
