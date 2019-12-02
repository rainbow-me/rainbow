import React from 'react';
import { ButtonPressAnimation } from '../animations';
import { colors } from '../../styles';
import { Icon } from '../icons';
import { RadialGradient } from 'svgs';
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
            /*backgroundColor: category === activeCategory ? colors.alpha(colors.blueGreyDark, 0.05) : null,
            borderRadius: 12,*/
            flex: 1,
            height: 30,
            justifyContent: 'center',
            maxWidth: 30,
          }}
        >
          {category === activeCategory && (
            <RadialGradient
              borderRadius={14}
              center={[32, 16]}
              colors={['#FFB114', '#FF54BB', '#00F0FF']}
              left={-1}
              opacity={0.1}
              overflow="hidden"
              position="absolute"
              radius={32}
              style={{ height: 32, width: 32 }}
              stops={[0, 0.635483871, 1]}
              top={-1}
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
