import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { MiniButton } from '../buttons';
import { ListFooter } from '../list';
import { Box, Columns, Text } from '@/design-system';
import { useAccountSettings, useWallets } from '@/hooks';
import { useTheme } from '@/theme';
import { formatAddressForDisplay } from '@/utils/abbreviations';

const DevNotificationsSection = () => {
  const { colors } = useTheme();
  const { wallets } = useWallets();
  const { chainId } = useAccountSettings();
  const [loading, setLoading] = useState<boolean>(true);
  const walletIDs = Object.keys(wallets!);
  const allWallets: any[] = useMemo(() => [], []);
  const [notificationState, setNotificationState] = useState<any>({});

  useEffect(() => {
    walletIDs.forEach(key => {
      const wallet = wallets![key];

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

    unsubscribeFromTransactionTopics('watcher', chainId, address);
    unsubscribeFromTransactionTopics('owner', chainId, address);
  };

  const unsubscribeAll = async (type: string) => {
    allWallets.forEach(wallet => {
      setNotificationState((state: any) => ({
        ...state,
        [wallet.address]: { subscription: 'off', tx: state[wallet.address].tx },
      }));

      unsubscribeFromTransactionTopics(type, chainId, wallet.address);
    });
  };

  const subscribe = async (type: string, address: string) => {
    setNotificationState((state: any) => ({
      ...state,
      [address]: { subscription: type, tx: state[address].tx },
    }));

    if (type === 'owner') {
      unsubscribeFromTransactionTopics('watcher', chainId, address);
      subscribeToTransactionTopics('owner', chainId, address);
    } else {
      unsubscribeFromTransactionTopics('owner', chainId, address);
      subscribeToTransactionTopics('watcher', chainId, address);
    }
  };

  const subscribeAll = async (type: string) => {
    allWallets.forEach(async wallet => {
      setNotificationState((state: any) => ({
        ...state,
        [wallet.address]: {
          subscription: type,
          tx: state[wallet.address].tx,
        },
      }));

      if (type === 'owner') {
        unsubscribeFromTransactionTopics('watcher', chainId, wallet.address);
        subscribeToTransactionTopics('owner', chainId, wallet.address);
      } else {
        unsubscribeFromTransactionTopics('owner', chainId, wallet.address);
        subscribeToTransactionTopics('watcher', chainId, wallet.address);
      }
    });
  };

  return (
    <ScrollView>
      <Box paddingHorizontal="19px (Deprecated)" paddingTop="19px (Deprecated)">
        <Box paddingBottom="19px (Deprecated)">
          <Text
            color="primary (Deprecated)"
            size="20px / 24px (Deprecated)"
            weight="bold"
          >
            Notifications Debug
          </Text>
        </Box>
        {!loading && (
          <Columns space="8px">
            {/*
            // @ts-expect-error */}
            <MiniButton
              backgroundColor={colors.blueGreyDark30}
              color="dark"
              hideShadow
              onPress={unsubscribeAll}
            >
              All Off
            </MiniButton>
            {/*
            // @ts-expect-error */}
            <MiniButton
              backgroundColor={colors.blueGreyDark30}
              color="dark"
              hideShadow
              onPress={() => subscribeAll('watcher')}
            >
              All Watcher
            </MiniButton>
            {/*
            // @ts-expect-error */}
            <MiniButton
              backgroundColor={colors.blueGreyDark30}
              color="dark"
              hideShadow
              onPress={() => subscribeAll('owner')}
            >
              All Owner
            </MiniButton>
          </Columns>
        )}
      </Box>
      <Box
        paddingBottom="19px (Deprecated)"
        paddingHorizontal="19px (Deprecated)"
      >
        {!loading &&
          allWallets.map(wallet => {
            const isOff =
              notificationState[wallet.address].subscription === 'off';
            const isWatcher =
              notificationState[wallet.address].subscription === 'watcher';
            const isOwner =
              notificationState[wallet.address].subscription === 'owner';

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
                  <Text
                    color="primary (Deprecated)"
                    size="18px / 27px (Deprecated)"
                    weight="bold"
                  >
                    {wallet.label || wallet.color}
                  </Text>
                </Box>
                <Box paddingTop="15px (Deprecated)">
                  <Text
                    color="secondary60 (Deprecated)"
                    size="16px / 22px (Deprecated)"
                  >
                    {formatAddressForDisplay(wallet.address)}
                  </Text>
                </Box>
                <Box paddingTop="15px (Deprecated)">
                  <Columns space="8px">
                    {/*
                    // @ts-expect-error */}
                    <MiniButton
                      backgroundColor={
                        isOff ? colors.appleBlue : colors.blueGreyDark30
                      }
                      color={isOff ? 'white' : 'dark'}
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
                      color={isWatcher ? 'white' : 'dark'}
                      hideShadow
                      onPress={() => subscribe('watcher', wallet.address)}
                    >
                      Watcher
                    </MiniButton>
                    {/*
                    // @ts-expect-error */}
                    <MiniButton
                      backgroundColor={
                        isOwner ? colors.appleBlue : colors.blueGreyDark30
                      }
                      color={isOwner ? 'white' : 'dark'}
                      hideShadow
                      onPress={() => subscribe('owner', wallet.address)}
                    >
                      Owner
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
