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
            leftComponent={
              <MenuItem.TextIcon
                colorOverride={colors.appleBlue}
                icon="􀈟"
                shiftLeft
              />
            }
            rightComponent={<Switch />}
            shiftLeft
            size={52}
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.sent')}
              />
            }
          />
          <MenuItem
            disabled
            leftComponent={
              <MenuItem.TextIcon
                colorOverride={colors.green}
                icon="􀅀"
                shiftLeft
              />
            }
            rightComponent={<Switch />}
            shiftLeft
            size={52}
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.received')}
              />
            }
          />
          <MenuItem
            disabled
            leftComponent={
              <MenuItem.TextIcon
                colorOverride={colors.pink}
                icon="􀑉"
                shiftLeft
              />
            }
            rightComponent={<Switch />}
            shiftLeft
            size={52}
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.purchased')}
              />
            }
          />
          <MenuItem
            disabled
            leftComponent={
              <MenuItem.TextIcon
                colorOverride={colors.orange}
                icon="􀋡"
                shiftLeft
              />
            }
            rightComponent={<Switch />}
            shiftLeft
            size={52}
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.sold')}
              />
            }
          />
          <MenuItem
            disabled
            leftComponent={
              <MenuItem.TextIcon
                colorOverride={colors.yellowOrange}
                icon="􀆿"
                shiftLeft
              />
            }
            rightComponent={<Switch />}
            shiftLeft
            size={52}
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.minted')}
              />
            }
          />
          <MenuItem
            disabled
            leftComponent={
              <MenuItem.TextIcon
                colorOverride={colors.swapPurple}
                icon="􀖅"
                shiftLeft
              />
            }
            rightComponent={<Switch />}
            shiftLeft
            size={52}
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.swapped')}
              />
            }
          />
          <MenuItem
            disabled
            leftComponent={
              <MenuItem.TextIcon
                colorOverride={colors.green}
                icon="􀁢"
                shiftLeft
              />
            }
            rightComponent={<Switch />}
            shiftLeft
            size={52}
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.approvals')}
              />
            }
          />
          <MenuItem
            disabled
            leftComponent={
              <MenuItem.TextIcon
                colorOverride={colors.blueGreyDark60}
                icon="􀍡"
                shiftLeft
              />
            }
            rightComponent={<Switch />}
            shiftLeft
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
