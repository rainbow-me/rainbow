import React, { useCallback } from 'react';
import { Linking } from 'react-native';
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { Centered, Row } from '../layout';
import { Text } from '../text';
import { padding } from '@rainbow-me/styles';

const WalletConnectLearnMoreButton = () => {
  const openWalletConnectWebsite = useCallback(async () => {
    Linking.openURL('https://walletconnect.org/');
  }, []);

  const { colors } = useTheme();
  return (
    <Row align="start">
      <ButtonPressAnimation
        activeOpacity={0.5}
        onPress={openWalletConnectWebsite}
        scaleTo={0.96}
      >
        <Centered direction="column">
          <Text
            color="paleBlue"
            css={padding(6, 0)}
            size="lmedium"
            weight="semibold"
          >
            Learn More
          </Text>
          <Divider color={colors.rowDividerLight} inset={false} />
        </Centered>
      </ButtonPressAnimation>
    </Row>
  );
};

export default WalletConnectLearnMoreButton;
