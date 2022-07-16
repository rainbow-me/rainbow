import { useTheme } from '@rainbow-me/theme';
import React, { useReducer } from 'react';
import { Switch } from 'react-native';
import Menu from './components/Menu';
import MenuContainer from './components/MenuContainer';
import MenuItem from './components/MenuItem';
import lang from 'i18n-js';

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
          titleComponent={
            <MenuItem.Title
              weight="bold"
              text={lang.t(
                'settings.notifications_section.allow_notifications'
              )}
            />
          }
          rightComponent={
            <Switch
              value={notificationsAllowed}
              onValueChange={toggleNotifications}
            />
          }
          size="medium"
        />
      </Menu>
      {notificationsAllowed && (
        <Menu>
          <MenuItem
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.sent')}
              />
            }
            leftComponent={
              <MenuItem.Title colorOverride={colors.appleBlue} text="􀈟" />
            }
            rightComponent={<Switch />}
            iconPadding="small"
            size="medium"
          />
          <MenuItem
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.received')}
              />
            }
            leftComponent={
              <MenuItem.Title colorOverride={colors.green} text="􀅀" />
            }
            rightComponent={<Switch />}
            iconPadding="small"
            size="medium"
          />
          <MenuItem
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.purchased')}
              />
            }
            leftComponent={
              <MenuItem.Title colorOverride={colors.pink} text="􀑉" />
            }
            rightComponent={<Switch />}
            iconPadding="small"
            size="medium"
          />
          <MenuItem
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.sold')}
              />
            }
            leftComponent={
              <MenuItem.Title colorOverride={colors.orange} text="􀋡" />
            }
            rightComponent={<Switch />}
            iconPadding="small"
            size="medium"
          />
          <MenuItem
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.minted')}
              />
            }
            leftComponent={
              <MenuItem.Title colorOverride={colors.yellowOrange} text="􀆿" />
            }
            rightComponent={<Switch />}
            iconPadding="small"
            size="medium"
          />
          <MenuItem
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.swapped')}
              />
            }
            leftComponent={
              <MenuItem.Title colorOverride={colors.swapPurple} text="􀖅" />
            }
            rightComponent={<Switch />}
            iconPadding="small"
            size="medium"
          />
          <MenuItem
            titleComponent={
              <MenuItem.Title
                text={lang.t('settings.notifications_section.approvals')}
              />
            }
            leftComponent={
              <MenuItem.Title colorOverride={colors.green} text="􀁢" />
            }
            rightComponent={<Switch />}
            iconPadding="small"
            size="medium"
          />
          <MenuItem
            titleComponent={
              <MenuItem.Title
                text={lang.t(
                  'settings.notifications_section.contracts_and_more'
                )}
              />
            }
            leftComponent={
              <MenuItem.Title colorOverride={colors.blueGreyDark60} text="􀍡" />
            }
            rightComponent={<Switch />}
            iconPadding="small"
            size="medium"
          />
        </Menu>
      )}
    </MenuContainer>
  );
};

export default WalletNotificationsSettings;
