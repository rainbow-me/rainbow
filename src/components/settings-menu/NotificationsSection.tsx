import React, { useCallback } from 'react';
import { Switch } from 'react-native';
import Menu from './components/Menu';
import MenuContainer from './components/MenuContainer';
import MenuItem from './components/MenuItem';
import { ContactAvatar } from '../contacts';
import { useTheme } from '@rainbow-me/theme';
import { useNavigation } from '@rainbow-me/navigation';

const NotificationsSection = () => {
  const { colors } = useTheme();
  const { navigate } = useNavigation();

  const onPress = useCallback(
    name => {
      navigate('WalletNotificationsSettings', {
        title: name,
      });
    },
    [navigate]
  );

  return (
    <MenuContainer>
      <Menu>
        <MenuItem
          size="medium"
          rightComponent={<Switch />}
          titleComponent={<MenuItem.Title text="My Wallets" weight="bold" />}
        />
        <MenuItem
          onPress={() => onPress('notben.eth')}
          size="medium"
          leftComponent={
            <ContactAvatar
              alignSelf="center"
              color={colors.appleBlue}
              marginRight={10}
              size="small"
              value={'notben.eth'}
            />
          }
          labelComponent={<MenuItem.Label text="All" />}
          titleComponent={<MenuItem.Title text="notben.eth" />}
          hasRightArrow
        />
        <MenuItem
          onPress={() => onPress('pugson.eth')}
          size="medium"
          leftComponent={
            <ContactAvatar
              alignSelf="center"
              color={colors.red}
              marginRight={10}
              size="small"
              value={'pugson.eth'}
            />
          }
          labelComponent={
            <MenuItem.Label text="Received, Sold, Minted + 4 more" />
          }
          titleComponent={<MenuItem.Title text="pugson.eth" />}
          hasRightArrow
        />
      </Menu>
      <Menu>
        <MenuItem
          size="medium"
          rightComponent={<Switch />}
          titleComponent={
            <MenuItem.Title text="Watched Wallets" weight="bold" />
          }
        />
        <MenuItem
          onPress={() => onPress('moxey.eth')}
          size="medium"
          leftComponent={
            <ContactAvatar
              alignSelf="center"
              color={colors.red}
              marginRight={10}
              size="small"
              value={'moxey.eth'}
            />
          }
          labelComponent={<MenuItem.Label text="Off" />}
          titleComponent={<MenuItem.Title text="moxey.eth" />}
          hasRightArrow
        />
      </Menu>
    </MenuContainer>
  );
};

export default NotificationsSection;
