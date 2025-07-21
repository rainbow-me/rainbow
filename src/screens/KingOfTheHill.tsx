import React from 'react';
import { Box, Text, TextIcon } from '@/design-system';
import { KingOfTheHillContextProvider, useKingOfTheHillContext } from '@/components/king-of-the-hill/context';
import { BlurGradient } from '@/components/blur/BlurGradient';
import { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';
import { Navbar } from '@/components/navbar/Navbar';
import { ButtonPressAnimation } from '@/components/animations';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { ContactAvatar } from '@/components/contacts';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import * as i18n from '@/languages';
import { useAirdropsStore } from '@/state/claimables/airdropsStore';

function KingOfTheHillBackground() {
  const { accentColors } = useKingOfTheHillContext();

  return (
    <>
      <Box
        position="absolute"
        top="0px"
        left="0px"
        width={{ custom: DEVICE_WIDTH }}
        height={{ custom: DEVICE_HEIGHT }}
        style={{ backgroundColor: accentColors.opacity24 }}
        zIndex={-1}
      />
      <BlurGradient
        gradientPoints={[
          { x: 0, y: 1 },
          { x: 0, y: 0 },
        ]}
        intensity={87.39836883544922}
        color={accentColors.opacity75}
        height={DEVICE_HEIGHT}
        width={DEVICE_WIDTH}
      />
    </>
  );
}

const onNavigateToChangeWallet = () => {
  Navigation.handleAction(Routes.CHANGE_WALLET_SHEET);
};

const onNavigateToAirdrops = () => {
  Navigation.handleAction(Routes.AIRDROPS_SHEET);
};

function KingOfTheHillNavbar() {
  const { accountSymbol, accountColor, accountImage } = useAccountProfileInfo();
  const numberOfAirdrops = useAirdropsStore(state => state.getNumberOfAirdrops());

  return (
    <Navbar
      hasStatusBarInset
      leftComponent={
        <ButtonPressAnimation onPress={onNavigateToChangeWallet} scaleTo={0.8} overflowMargin={50}>
          {accountImage ? (
            <ImageAvatar image={accountImage} marginRight={10} size="header" />
          ) : (
            <ContactAvatar color={accountColor} marginRight={10} size="small" value={accountSymbol} />
          )}
        </ButtonPressAnimation>
      }
      rightComponent={
        <ButtonPressAnimation onPress={onNavigateToAirdrops} scaleTo={0.8} overflowMargin={50} testID="king-of-the-hill-airdrop-icon">
          <Box
            background="fillSecondary"
            borderRadius={20}
            paddingHorizontal="12px"
            height={{ custom: 36 }}
            flexDirection="row"
            alignItems="center"
            justifyContent="center"
            borderWidth={THICK_BORDER_WIDTH}
            borderColor="buttonStroke"
          >
            <Text color="labelSecondary" size="icon 14px" weight="heavy">
              {'􀑉'} {numberOfAirdrops}
            </Text>
          </Box>
        </ButtonPressAnimation>
      }
      testID={'king-of-the-hill-header'}
      title={i18n.t(i18n.l.king_of_the_hill.title)}
    />
  );
}

export function KingOfTheHillScreen() {
  return (
    <KingOfTheHillContextProvider>
      <KingOfTheHillNavbar />
      <KingOfTheHillBackground />
    </KingOfTheHillContextProvider>
  );
}
