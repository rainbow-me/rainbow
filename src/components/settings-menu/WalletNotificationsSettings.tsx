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
          rightComponent={
            <Switch
              onValueChange={toggleNotifications}
              value={notificationsAllowed}
            />
          }
          size="medium"
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
            iconPadding="small"
            leftComponent={
              <MenuItem.Title colorOverride={colors.appleBlue} text="􀈟" />
            }
            rightComponent={<Switch />}
            size="medium"
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.sent')}
              />
            }
          />
          <MenuItem
            iconPadding="small"
            leftComponent={
              <MenuItem.Title colorOverride={colors.green} text="􀅀" />
            }
            rightComponent={<Switch />}
            size="medium"
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.received')}
              />
            }
          />
          <MenuItem
            iconPadding="small"
            leftComponent={
              <MenuItem.Title colorOverride={colors.pink} text="􀑉" />
            }
            rightComponent={<Switch />}
            size="medium"
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.purchased')}
              />
            }
          />
          <MenuItem
            iconPadding="small"
            leftComponent={
              <MenuItem.Title colorOverride={colors.orange} text="􀋡" />
            }
            rightComponent={<Switch />}
            size="medium"
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.sold')}
              />
            }
          />
          <MenuItem
            iconPadding="small"
            leftComponent={
              <MenuItem.Title colorOverride={colors.yellowOrange} text="􀆿" />
            }
            rightComponent={<Switch />}
            size="medium"
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.minted')}
              />
            }
          />
          <MenuItem
            iconPadding="small"
            leftComponent={
              <MenuItem.Title colorOverride={colors.swapPurple} text="􀖅" />
            }
            rightComponent={<Switch />}
            size="medium"
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.swapped')}
              />
            }
          />
          <MenuItem
            iconPadding="small"
            leftComponent={
              <MenuItem.Title colorOverride={colors.green} text="􀁢" />
            }
            rightComponent={<Switch />}
            size="medium"
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.approvals')}
              />
            }
          />
          <MenuItem
            iconPadding="small"
            leftComponent={
              <MenuItem.Title colorOverride={colors.blueGreyDark60} text="􀍡" />
            }
            rightComponent={<Switch />}
            size="medium"
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
