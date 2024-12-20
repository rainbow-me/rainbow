import React from 'react';
import { BackgroundProvider, Box, Separator, Text, useForegroundColor } from '@/design-system';
import { View, Text as NativeText } from 'react-native';
import chroma from 'chroma-js';
import { useInitializeWallet, useWallets } from '@/hooks';
import { PROFILES, useExperimentalFlag } from '@/config';
import { useDispatch } from 'react-redux';
import Routes from '@/navigation/routesNames';
import { useNavigation } from './Navigation';
import WalletBackupTypes from '@/helpers/walletBackupTypes';
import WalletTypes from '@/helpers/walletTypes';
import { backupUserDataIntoCloud } from '@/handlers/cloudBackup';
import { logger, RainbowError } from '@/logger';
import { createAccountForWallet, walletsLoadState } from '@/redux/wallets';
import { createWallet, RainbowAccount, RainbowWallet } from '@/model/wallet';
import { ButtonPressAnimation } from '@/components/animations';
import { abbreviateEnsForDisplay, formatAddressForDisplay } from '@/utils/abbreviations';
import { ImgixImage } from '@/components/images';
import { useTheme } from '@/theme';
import { removeFirstEmojiFromString, returnStringFirstEmoji } from '@/helpers/emojiHandler';
import { profileUtils } from '@/utils';
import * as i18n from '@/languages';
import showWalletErrorAlert from '@/helpers/support';
import { ScrollView } from 'react-native-gesture-handler';
import CreateNewWalletGroupIcon from '@/assets/CreateNewWalletGroup.png';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';

function NewWalletGroup({ numWalletGroups }: { numWalletGroups: number }) {
  const blue = useForegroundColor('blue');

  const { navigate } = useNavigation();
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const dispatch = useDispatch();
  const initializeWallet = useInitializeWallet();

  const onNewWalletGroup = () => {
    navigate(Routes.MODAL_SCREEN, {
      actionType: 'Create',
      numWalletGroups,
      onCloseModal: async (args: { name: string; color: number }) => {
        if (!args) return;
        try {
          const { name, color } = args;
          await createWallet({ color, name });
          await dispatch(walletsLoadState(profilesEnabled));
          // @ts-ignore
          await initializeWallet();
          navigate(Routes.WALLET_SCREEN, {}, true);
        } catch (error) {
          logger.error(new RainbowError('[AddWalletSheet]: Error while trying to add account'), { error });
        }
      },
      profile: { color: null, name: `` },
      type: 'new_wallet_group',
    });
  };

  return (
    <ButtonPressAnimation
      onPress={onNewWalletGroup}
      scaleTo={0.95}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 30,
        height: 60,
        width: '100%',
        backgroundColor: chroma(blue).alpha(0.05).hex(),
        borderWidth: 1,
        borderColor: chroma(blue).alpha(0.06).hex(),
      }}
    >
      <ImgixImage style={{ height: 36, width: 36, borderRadius: 18 }} source={CreateNewWalletGroupIcon} />
      <View style={{ gap: 10 }}>
        <Text color="blue" size="17pt" weight="heavy">
          {i18n.t(i18n.l.wallet.new.new_wallet_group.title)}
        </Text>
        <Text color="labelQuaternary" size="13pt" weight="bold">
          {i18n.t(i18n.l.wallet.new.new_wallet_group.description)}
        </Text>
      </View>
    </ButtonPressAnimation>
  );
}

function AccountAvatar({ account, size }: { account: RainbowAccount; size: number }) {
  const { colors } = useTheme();

  if (account.image) {
    return <ImgixImage source={{ uri: account.image }} style={{ height: size, width: size, borderRadius: size / 2 }} />;
  }

  const backgroundColor = colors.avatarBackgrounds[account.color];
  const emoji = returnStringFirstEmoji(account.label) || profileUtils.addressHashedEmoji(account.address);

  return (
    <View
      style={[
        { backgroundColor, height: size, width: size, borderRadius: size / 2 },
        { alignItems: 'center', justifyContent: 'center' },
      ]}
    >
      <NativeText style={{ fontSize: size / 2, textAlign: 'center' }}>{emoji}</NativeText>
    </View>
  );
}

function WalletGroup({ wallet }: { wallet: RainbowWallet }) {
  const separatorSecondary = useForegroundColor('separatorSecondary');

  const accounts = wallet.addresses;

  const { navigate } = useNavigation();
  const dispatch = useDispatch();
  const initializeWallet = useInitializeWallet();

  const onAddToGroup = () => {
    navigate(Routes.MODAL_SCREEN, {
      actionType: 'Create',
      asset: [],
      isNewProfile: true,
      onCloseModal: async (args: { name: string; color: number }) => {
        if (!args) return;
        try {
          const { name, color } = args;
          if (wallet.damaged) throw new Error('Wallet is damaged');
          const newWallets = await dispatch(createAccountForWallet(wallet.id, color, name));
          // @ts-ignore
          await initializeWallet();
          // If this wallet was previously backed up to the cloud
          // We need to update userData backup so it can be restored too
          if (wallet.backedUp && wallet.backupType === WalletBackupTypes.cloud) {
            try {
              await backupUserDataIntoCloud({ wallets: newWallets });
            } catch (error) {
              logger.error(new RainbowError('[AddWalletSheet]: Updating wallet userdata failed after new account creation'), { error });
              throw error;
            }
          }
          navigate(Routes.WALLET_SCREEN, {}, true);
        } catch (e) {
          logger.error(new RainbowError('[AddWalletSheet]: Error while trying to add account'), {
            error: e,
          });
          showWalletErrorAlert();
        }
      },
      profile: { color: null, name: `` },
      type: 'wallet_profile',
    });
  };

  return (
    <ButtonPressAnimation onPress={onAddToGroup} scaleTo={0.95} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View
        style={[
          { height: 40, width: 40, gap: 2, padding: 5 },
          { borderRadius: 10, backgroundColor: separatorSecondary },
          { flexWrap: 'wrap', flexDirection: 'row' },
        ]}
      >
        {accounts.slice(0, 4).map(account => (
          <AccountAvatar key={account.address} account={account} size={14} />
        ))}
      </View>
      <View style={{ gap: 8 }}>
        <Text color="label" size="15pt" weight="semibold">
          {removeFirstEmojiFromString(wallet.name)}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Text color="labelQuaternary" size="13pt" weight="bold">
            {abbreviateEnsForDisplay(accounts[0].ens) || formatAddressForDisplay(accounts[0].address, 4, 4)}
          </Text>
          {accounts.length > 1 && (
            <View
              style={[
                { height: 16, paddingHorizontal: 3.5, justifyContent: 'center', marginVertical: -2 },
                { borderColor: chroma(separatorSecondary).alpha(0.04).hex(), borderWidth: 1, borderRadius: 6 },
                { backgroundColor: separatorSecondary },
              ]}
            >
              <Text color="labelQuaternary" size="11pt" weight="bold">
                {`+${accounts.length - 1}`}
              </Text>
            </View>
          )}
        </View>
      </View>
    </ButtonPressAnimation>
  );
}

export function ChooseWalletGroup() {
  const { goBack } = useNavigation();
  const { wallets } = useWallets();

  if (!wallets) {
    showWalletErrorAlert();
    return;
  }

  const groups = Object.values(wallets).filter(wallet => wallet.type === WalletTypes.mnemonic);

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet backgroundColor={backgroundColor as string} scrollEnabled={false}>
          <Box width="full" style={{ paddingHorizontal: 24, gap: 20, alignItems: 'center', paddingBottom: 64 }}>
            <View style={{ paddingTop: 24, paddingBottom: 12, width: '100%' }}>
              <ButtonPressAnimation scaleTo={0.9} onPress={goBack} hitSlop={64} style={{ width: 20, height: 20 }}>
                <Text color="blue" size="22pt" weight="bold">
                  􀆉
                </Text>
              </ButtonPressAnimation>
            </View>
            <Text color="label" size="22pt" weight="heavy">
              {i18n.t(i18n.l.wallet.new.choose_wallet_group.title)}
            </Text>
            <Text color="labelQuaternary" size="15pt" weight="semibold" align="center">
              {i18n.t(i18n.l.wallet.new.choose_wallet_group.description)}
            </Text>

            <View style={{ width: '100%' }}>
              <Separator color={'separatorTertiary'} />
            </View>

            <NewWalletGroup numWalletGroups={groups.length} />
            {groups.length > 0 && (
              <ScrollView style={{ width: '100%' }} contentContainerStyle={{ gap: 16, paddingHorizontal: 12 }}>
                {groups.map(wallet => (
                  <WalletGroup key={wallet.id} wallet={wallet} />
                ))}
              </ScrollView>
            )}
          </Box>
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
}
