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
            disabled
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
            disabled
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
            disabled
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
            disabled
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
            disabled
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
            disabled
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
            disabled
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
            disabled
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
