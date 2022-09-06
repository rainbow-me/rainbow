import lang from 'i18n-js';
import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { cloudPlatform } from '../../../utils/platform';
import { ContactAvatar } from '../../contacts';
import Menu from '../components/Menu';
import MenuContainer from '../components/MenuContainer';
import MenuItem from '../components/MenuItem';
import { removeFirstEmojiFromString } from '@/helpers/emojiHandler';
import WalletBackupTypes from '@/helpers/walletBackupTypes';
import WalletTypes from '@/helpers/walletTypes';
import { useManageCloudBackups, useWallets } from '@/hooks';
import { useNavigation } from '@/navigation';
import { abbreviations } from '@/utils';
import { fetchRainbowProfile } from '@/hooks/useRainbowProfile';
import { EthereumAddress } from '@/entities';
import { RainbowWallet } from '@/model/wallet';

interface Backup {
  address: EthereumAddress;
  color: string;
  emoji: string;
  key: string;
  label: string;
  numAccounts: number;
  wallet: RainbowWallet;
}

const BackupSection = () => {
  const { navigate } = useNavigation();
  const { walletNames, wallets } = useWallets();
  const { manageCloudBackups } = useManageCloudBackups();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [cloudBackedUpWallets, incrementCloudBackedUpWallets] = useReducer(
    n => n + 1,
    0
  );

  const onPress = useCallback(
    (walletId: string, name: string) => {
      const wallet = wallets?.[walletId];
      if (wallet?.backedUp || wallet?.imported) {
        navigate('SettingsBackupView', {
          imported: wallet.imported,
          title: name,
          type: 'AlreadyBackedUpView',
          walletId,
        });
      } else {
        navigate('SettingsBackupView', {
          title: name,
          type: 'NeedsBackupView',
          walletId,
        });
      }
    },
    [navigate, wallets]
  );

  useEffect(() => {
    const loadBackups = async () => {
      if (wallets) {
        const loadedBackups = await Promise.all(
          Object.keys(wallets)
            .filter(key => wallets[key].type !== WalletTypes.readOnly)
            .map(async key => {
              const wallet = wallets[key];
              const visibleAccounts = wallet.addresses.filter(
                (a: any) => a.visible
              );
              const account = visibleAccounts[0];
              const totalAccounts = visibleAccounts.length;
              const { label, address } = account;
              if (wallet.backupType === WalletBackupTypes.cloud) {
                incrementCloudBackedUpWallets();
              }
              const rainbowProfile = await fetchRainbowProfile(address, {
                cacheFirst: true,
              });
              let labelOrName = label;
              if (!label) {
                if (walletNames[address]) {
                  labelOrName = walletNames[address];
                }
              }
              return {
                address,
                color: rainbowProfile?.color,
                emoji: rainbowProfile?.emoji,
                key,
                label: labelOrName,
                numAccounts: totalAccounts,
                wallet,
              } as Backup;
            })
        );
        setBackups(loadedBackups);
      }
    };
    loadBackups();
  }, [walletNames, wallets]);

  return (
    <MenuContainer>
      <Menu>
        {backups.map(
          ({
            address,
            color,
            emoji,
            key,
            label: labelOrName,
            numAccounts,
            wallet,
          }: Backup) => (
            <MenuItem
              hasRightArrow
              key={key}
              labelComponent={
                <MenuItem.Label
                  text={
                    numAccounts > 1
                      ? numAccounts > 2
                        ? lang.t('wallet.back_ups.and_more_wallets', {
                            moreWalletCount: numAccounts - 1,
                          })
                        : lang.t('wallet.back_ups.and_1_more_wallet')
                      : wallet.backedUp
                      ? wallet.backupType === WalletBackupTypes.cloud
                        ? lang.t('wallet.back_ups.backed_up')
                        : lang.t('wallet.back_ups.backed_up_manually')
                      : wallet.imported
                      ? lang.t('wallet.back_ups.imported')
                      : lang.t('back_up.needs_backup.not_backed_up')
                  }
                  warn={
                    numAccounts <= 1 && !wallet.backedUp && !wallet.imported
                  }
                />
              }
              leftComponent={
                <ContactAvatar
                  address={address}
                  alignSelf="center"
                  color={color}
                  emoji={emoji}
                  marginRight={10}
                  size="small"
                />
              }
              onPress={() =>
                onPress(
                  key,
                  removeFirstEmojiFromString(labelOrName) ||
                    abbreviations.address(address, 4, 6) ||
                    ''
                )
              }
              rightComponent={
                <MenuItem.StatusIcon
                  status={
                    wallet.backupType === WalletBackupTypes.cloud
                      ? 'complete'
                      : wallet.backedUp || wallet.imported
                      ? 'incomplete'
                      : 'warning'
                  }
                />
              }
              size={60}
              titleComponent={
                <MenuItem.Title
                  text={
                    removeFirstEmojiFromString(labelOrName) ||
                    abbreviations.address(address, 4, 6) ||
                    ''
                  }
                />
              }
            />
          )
        )}
      </Menu>
      {cloudBackedUpWallets > 0 && (
        <Menu>
          <MenuItem
            hasSfSymbol
            leftComponent={<MenuItem.TextIcon icon="􀡜" isLink />}
            onPress={manageCloudBackups}
            size={52}
            titleComponent={
              <MenuItem.Title
                isLink
                text={lang.t('back_up.cloud.manage_platform_backups', {
                  cloudPlatformName: cloudPlatform,
                })}
              />
            }
          />
        </Menu>
      )}
    </MenuContainer>
  );
};

export default BackupSection;
