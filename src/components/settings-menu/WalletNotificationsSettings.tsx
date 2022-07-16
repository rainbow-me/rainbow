import { useTheme } from '@rainbow-me/theme';
import React, { useReducer } from 'react';
import { Switch } from 'react-native';
import Menu from './components/Menu';
import MenuContainer from './components/MenuContainer';
import MenuItem from './components/MenuItem';

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
            <MenuItem.Title weight="bold" text="Allow Notifications" />
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
            titleComponent={<MenuItem.Title text="Sent" />}
            leftComponent={
              <MenuItem.Title colorOverride={colors.appleBlue} text="􀈟" />
            }
            rightComponent={<Switch />}
            iconPadding="small"
            size="medium"
          />
          <MenuItem
            titleComponent={<MenuItem.Title text="Received" />}
            leftComponent={
              <MenuItem.Title colorOverride={colors.green} text="􀅀" />
            }
            rightComponent={<Switch />}
            iconPadding="small"
            size="medium"
          />
          <MenuItem
            titleComponent={<MenuItem.Title text="Purchased" />}
            leftComponent={
              <MenuItem.Title colorOverride={colors.pink} text="􀑉" />
            }
            rightComponent={<Switch />}
            iconPadding="small"
            size="medium"
          />
          <MenuItem
            titleComponent={<MenuItem.Title text="Sold" />}
            leftComponent={
              <MenuItem.Title colorOverride={colors.orange} text="􀋡" />
            }
            rightComponent={<Switch />}
            iconPadding="small"
            size="medium"
          />
          <MenuItem
            titleComponent={<MenuItem.Title text="Minted" />}
            leftComponent={
              <MenuItem.Title colorOverride={colors.yellowOrange} text="􀆿" />
            }
            rightComponent={<Switch />}
            iconPadding="small"
            size="medium"
          />
          <MenuItem
            titleComponent={<MenuItem.Title text="Swapped" />}
            leftComponent={
              <MenuItem.Title colorOverride={colors.swapPurple} text="􀖅" />
            }
            rightComponent={<Switch />}
            iconPadding="small"
            size="medium"
          />
          <MenuItem
            titleComponent={<MenuItem.Title text="Approvals" />}
            leftComponent={
              <MenuItem.Title colorOverride={colors.green} text="􀁢" />
            }
            rightComponent={<Switch />}
            iconPadding="small"
            size="medium"
          />
          <MenuItem
            titleComponent={<MenuItem.Title text="Contracts & More" />}
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
