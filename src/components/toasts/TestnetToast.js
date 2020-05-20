import React from 'react';
import networkInfo from '../../helpers/networkInfo';
import networkTypes from '../../helpers/networkTypes';
import { useAccountSettings } from '../../hooks';
import { colors } from '../../styles';
import { Nbsp } from '../html-entities';
import { Icon } from '../icons';
import { Text } from '../text';
import Toast from './Toast';

const TestnetToast = () => {
  const { network } = useAccountSettings();
  const isMainnet = network === networkTypes.mainnet;

  const { name, color } = networkInfo[network];

  return (
    <Toast isVisible={!isMainnet}>
      <Icon color={color} marginHorizontal={5} marginTop={5} name="dot" />
      <Text color={colors.white} size="smedium" weight="semibold">
        <Nbsp /> {name} <Nbsp />
      </Text>
    </Toast>
  );
};

const neverRerender = () => true;
export default React.memo(TestnetToast, neverRerender);
