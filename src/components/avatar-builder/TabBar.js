import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { colors, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Categories } from './EmojiSelector';

const TabBar = ({ categoryKeys, activeCategory, onPress }) => {
  return categoryKeys.map(c => {
    const category = Categories[c];
    if (c !== 'all')
      return (
        <ButtonPressAnimation
          activeOpacity={1}
          duration={100}
          enableHapticFeedback
          key={category.name}
          onPress={() => onPress(category)}
          scaleTo={0.75}
          style={{
            alignItems: 'center',
            flex: 1,
            height: 30,
            justifyContent: 'center',
            maxWidth: 30,
          }}
        >
          {category === activeCategory && (
            <LinearGradient
              borderRadius={15}
              overflow="hidden"
              colors={['#FFB114', '#FF54BB', '#00F0FF']}
              end={{ x: 0, y: 0.5 }}
              pointerEvents="none"
              start={{ x: 1, y: 0.5 }}
              opacity={0.1}
              style={position.coverAsObject}
            />
          )}
          <Icon
            name={category.icon}
            color={
              category === activeCategory
                ? null
                : colors.alpha(colors.blueGreyDark, 0.4)
            }
          />
        </ButtonPressAnimation>
      );
  });
};

export default TabBar;
