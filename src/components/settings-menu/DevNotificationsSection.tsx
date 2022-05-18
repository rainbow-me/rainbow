import messaging from '@react-native-firebase/messaging';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { MiniButton } from '../buttons';
import { ListFooter } from '../list';
import { useTheme } from '@rainbow-me/context';
import { Box, Columns, Text } from '@rainbow-me/design-system';
import { useAccountSettings, useWallets } from '@rainbow-me/hooks';
import { formatAddressForDisplay } from '@rainbow-me/utils/abbreviations';

const firebaseUnsubscribeBoth = async (address: string) => {
  await messaging().unsubscribeFromTopic(`watcher_${address.toLowerCase()}`);
  await messaging().unsubscribeFromTopic(`owner_${address.toLowerCase()}`);
};

const DevNotificationsSection = () => {
  const { colors } = useTheme();
  const { wallets } = useWallets();
  const { chainId } = useAccountSettings();
  const [loading, setLoading] = useState<boolean>(true);
  const walletIDs = Object.keys(wallets);
  let allWallets: any[] = useMemo(() => [], []);
  const [notificationState, setNotificationState] = useState<any>({});

  useEffect(() => {
    walletIDs.forEach(key => {
      const wallet = wallets[key];

      wallet.addresses.forEach((item: { address: string }) => {
        allWallets.push(item);

        if (loading) {
          setNotificationState((state: any) => ({
            ...state,
            [item.address]: { subscription: null, tx: null },
          }));
        }
      });
    });

    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unsubscribe = async (address: string) => {
    setNotificationState((state: any) => ({
      ...state,
      [address]: { subscription: 'off', tx: state[address].tx },
    }));

    firebaseUnsubscribeBoth(address);
  };

  const unsubscribeAll = async () => {
    allWallets.forEach(wallet => {
      setNotificationState((state: any) => ({
        ...state,
        [wallet.address]: { subscription: 'off', tx: state[wallet.address].tx },
      }));

      firebaseUnsubscribeBoth(wallet.address);
    });
  };

  const subscribeAsWatcher = async (address: string) => {
    setNotificationState((state: any) => ({
      ...state,
      [address]: { subscription: 'watcher', tx: state[address].tx },
    }));

    await messaging().unsubscribeFromTopic(`owner_${address.toLowerCase()}`);
    await messaging().subscribeToTopic(`watcher_${address.toLowerCase()}`);
  };

  const subscribeAllAsWatcher = async () => {
    allWallets.forEach(async wallet => {
      setNotificationState((state: any) => ({
        ...state,
        [wallet.address]: {
          subscription: 'watcher',
          tx: state[wallet.address].tx,
        },
      }));

      await messaging().unsubscribeFromTopic(
        `owner_${wallet.address.toLowerCase()}`
      );
      await messaging().subscribeToTopic(
        `watcher_${wallet.address.toLowerCase()}`
      );
    });
  };

  const subscribeAsOwner = async (address: string) => {
    setNotificationState((state: any) => ({
      ...state,
      [address]: { subscription: 'owner' },
    }));

    await messaging().unsubscribeFromTopic(`watcher_${address.toLowerCase()}`);
    await messaging().subscribeToTopic(`owner_${address.toLowerCase()}`);
  };

  const subscribeAllAsOwner = async () => {
    allWallets.forEach(async wallet => {
      setNotificationState((state: any) => ({
        ...state,
        [wallet.address]: {
          subscription: 'owner',
          tx: state[wallet.address].tx,
        },
      }));

      await messaging().unsubscribeFromTopic(
        `watcher_${wallet.address.toLowerCase()}`
      );
      await messaging().subscribeToTopic(
        `owner_${wallet.address.toLowerCase()}`
      );
    });
  };

  const subscribeTx = async (address: string) => {
    setNotificationState((state: any) => ({
      ...state,
      [address]: { subscription: state[address].subscription, tx: 'on' },
    }));

    await messaging().subscribeToTopic(`${chainId}_${address.toLowerCase()}`);
  };

  const subscribeAllTx = async () => {
    allWallets.forEach(async wallet => {
      setNotificationState((state: any) => ({
        ...state,
        [wallet.address]: {
          subscription: state[wallet.address].subscription,
          tx: 'on',
        },
      }));

      await messaging().subscribeToTopic(
        `${chainId}_${wallet.address.toLowerCase()}`
      );
    });
  };

  const unsubscribeTx = async (address: string) => {
    setNotificationState((state: any) => ({
      ...state,
      [address]: { subscription: state[address].subscription, tx: 'off' },
    }));

    await messaging().unsubscribeFromTopic(
      `${chainId}_${address.toLowerCase()}`
    );
  };

  const unsubscribeAllTx = async () => {
    allWallets.forEach(async wallet => {
      setNotificationState((state: any) => ({
        ...state,
        [wallet.address]: {
          subscription: state[wallet.address].subscription,
          tx: 'off',
        },
      }));

      await messaging().unsubscribeFromTopic(
        `${chainId}_${wallet.address.toLowerCase()}`
      );
    });
  };

  return (
    <ScrollView>
      <Box paddingHorizontal="19px" paddingTop="19px">
        {!loading && (
          <Columns space="8px">
            {/* 
            // @ts-expect-error */}
            <MiniButton
              backgroundColor={colors.blueGreyDark30}
              color="secondary60"
              hideShadow
              onPress={unsubscribeAll}
            >
              All Off
            </MiniButton>
            {/* 
            // @ts-expect-error */}
            <MiniButton
              backgroundColor={colors.blueGreyDark30}
              color="secondary60"
              hideShadow
              onPress={subscribeAllAsWatcher}
            >
              All Watcher
            </MiniButton>
            {/* 
            // @ts-expect-error */}
            <MiniButton
              backgroundColor={colors.blueGreyDark30}
              color="secondary60"
              hideShadow
              onPress={subscribeAllAsOwner}
            >
              All Owner
            </MiniButton>
          </Columns>
        )}
        <Box paddingTop="8px">
          {!loading && (
            <Columns space="8px">
              {/* 
              // @ts-expect-error */}
              <MiniButton
                backgroundColor={colors.blueGreyDark30}
                color="secondary60"
                hideShadow
                onPress={unsubscribeAllTx}
              >
                All Tx Off
              </MiniButton>
              {/* 
              // @ts-expect-error */}
              <MiniButton
                backgroundColor={colors.blueGreyDark30}
                color="secondary60"
                hideShadow
                onPress={subscribeAllTx}
              >
                All Tx On
              </MiniButton>
            </Columns>
          )}
        </Box>
      </Box>
      <Box paddingBottom="19px" paddingHorizontal="19px">
        {!loading &&
          allWallets.map(wallet => {
            const isOff =
              notificationState[wallet.address].subscription === 'off';
            const isWatcher =
              notificationState[wallet.address].subscription === 'watcher';
            const isOwner =
              notificationState[wallet.address].subscription === 'owner';
            const isTx = notificationState[wallet.address].tx === 'on';
            const isNotTx = notificationState[wallet.address].tx === 'off';

            return (
              <Box key={wallet.address}>
                <Box
                  height={{ custom: 1 }}
                  paddingBottom="24px"
                  paddingTop="24px"
                  width="full"
                >
                  <Box
                    height={{ custom: 1 }}
                    style={{ backgroundColor: colors.blueGreyDark30 }}
                    width="full"
                  />
                </Box>
                <Box>
                  <Text containsEmoji size="18px" weight="bold">
                    {wallet.label}
                  </Text>
                </Box>
                <Box paddingTop="15px">
                  <Text color="secondary60" size="16px">
                    {formatAddressForDisplay(wallet.address)}
                  </Text>
                </Box>
                <Box paddingTop="15px">
                  <Columns space="8px">
                    {/* 
                    // @ts-expect-error */}
                    <MiniButton
                      backgroundColor={
                        isOff ? colors.appleBlue : colors.blueGreyDark30
                      }
                      color={isOff ? 'white' : 'secondary60'}
                      hideShadow
                      onPress={() => unsubscribe(wallet.address)}
                    >
                      Off
                    </MiniButton>
                    {/* 
                    // @ts-expect-error */}
                    <MiniButton
                      backgroundColor={
                        isWatcher ? colors.appleBlue : colors.blueGreyDark30
                      }
                      color={isWatcher ? 'white' : 'secondary60'}
                      hideShadow
                      onPress={() => subscribeAsWatcher(wallet.address)}
                    >
                      Watcher
                    </MiniButton>
                    {/* 
                    // @ts-expect-error */}
                    <MiniButton
                      backgroundColor={
                        isOwner ? colors.appleBlue : colors.blueGreyDark30
                      }
                      color={isOwner ? 'white' : 'secondary60'}
                      hideShadow
                      onPress={() => subscribeAsOwner(wallet.address)}
                    >
                      Owner
                    </MiniButton>
                  </Columns>
                </Box>
                <Box paddingTop="8px">
                  <Columns space="8px">
                    {/* 
                    // @ts-expect-error */}
                    <MiniButton
                      backgroundColor={
                        isNotTx ? colors.appleBlue : colors.blueGreyDark30
                      }
                      color={isNotTx ? 'white' : 'secondary60'}
                      hideShadow
                      onPress={() => unsubscribeTx(wallet.address)}
                    >
                      Transactions Off
                    </MiniButton>
                    {/* 
                    // @ts-expect-error */}
                    <MiniButton
                      backgroundColor={
                        isTx ? colors.appleBlue : colors.blueGreyDark30
                      }
                      color={isTx ? 'white' : 'secondary60'}
                      hideShadow
                      onPress={() => subscribeTx(wallet.address)}
                    >
                      Transactions On
                    </MiniButton>
                  </Columns>
                </Box>
              </Box>
            );
          })}
      </Box>
      <ListFooter />
    </ScrollView>
  );
};

export default DevNotificationsSection;
