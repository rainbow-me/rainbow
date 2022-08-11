import lang from 'i18n-js';
import React, { useReducer } from 'react';
import { Switch } from 'react-native';
import Menu from './components/Menu';
import MenuContainer from './components/MenuContainer';
import MenuItem from './components/MenuItem';
import { useTheme } from '@rainbow-me/theme';

const WalletNotificationsSettings = () => {
  const { colors } = useTheme();

  const [notificationsAllowed, toggleNotifications] = useReducer(
    s => !s,
    false
  );

  return (
    <MenuContainer>
      <Menu>
        <MenuItem
          disabled
          rightComponent={
            <Switch
              onValueChange={toggleNotifications}
              value={notificationsAllowed}
            />
          }
          size={52}
          titleComponent={
            <MenuItem.Title
              text={lang.t(
                'settings.notifications_section.allow_notifications'
              )}
              weight="bold"
            />
          }
        />
      </Menu>
      {notificationsAllowed && (
        <Menu>
          <MenuItem
            disabled
            hasSfSymbol
            leftComponent={
              <MenuItem.TextIcon colorOverride={colors.appleBlue} icon="􀈟" />
            }
            rightComponent={<Switch />}
            size={52}
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.sent')}
              />
            }
          />
          <MenuItem
            disabled
            hasSfSymbol
            leftComponent={
              <MenuItem.TextIcon colorOverride={colors.green} icon="􀅀" />
            }
            rightComponent={<Switch />}
            size={52}
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.received')}
              />
            }
          />
          <MenuItem
            disabled
            hasSfSymbol
            leftComponent={
              <MenuItem.TextIcon colorOverride={colors.pink} icon="􀑉" />
            }
            rightComponent={<Switch />}
            size={52}
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.purchased')}
              />
            }
          />
          <MenuItem
            disabled
            hasSfSymbol
            leftComponent={
              <MenuItem.TextIcon colorOverride={colors.orange} icon="􀋡" />
            }
            rightComponent={<Switch />}
            size={52}
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.sold')}
              />
            }
          />
          <MenuItem
            disabled
            hasSfSymbol
            leftComponent={
              <MenuItem.TextIcon colorOverride={colors.yellowOrange} icon="􀆿" />
            }
            rightComponent={<Switch />}
            size={52}
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.minted')}
              />
            }
          />
          <MenuItem
            disabled
            hasSfSymbol
            leftComponent={
              <MenuItem.TextIcon colorOverride={colors.swapPurple} icon="􀖅" />
            }
            rightComponent={<Switch />}
            size={52}
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.swapped')}
              />
            }
          />
          <MenuItem
            disabled
            hasSfSymbol
            leftComponent={
              <MenuItem.TextIcon colorOverride={colors.green} icon="􀁢" />
            }
            rightComponent={<Switch />}
            size={52}
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.approvals')}
              />
            }
          />
          <MenuItem
            disabled
            hasSfSymbol
            leftComponent={
              <MenuItem.TextIcon
                colorOverride={colors.blueGreyDark60}
                icon="􀍡"
              />
            }
            rightComponent={<Switch />}
            size={52}
            titleComponent={
              <MenuItem.Title
                text={lang.t(
                  'settings.notifications_section.contracts_and_more'
                )}
              />
            }
          />
        </Menu>
      )}
    </MenuContainer>
  );
};

export default WalletNotificationsSettings;
