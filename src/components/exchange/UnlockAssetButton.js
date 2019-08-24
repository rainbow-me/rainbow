import React from 'react';
import { withNeverRerender } from '../../hoc';
import {
  colors,
  fonts,
  margin,
  padding,
  position,
} from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { CoolButton } from '../buttons';
import { Icon } from '../icons';
import InnerBorder from '../InnerBorder';
import { Row, RowWithMargins } from '../layout';
import { ShadowStack } from '../shadow-stack';
import { Text } from '../text';

const UnlockAssetButton = ({
  borderRadius,
  children,
  color,
  onPress,
  shadows,
}) => (
  <ButtonPressAnimation onPress={onPress}>
    <Row flex={0} css={margin(0, 15)}>
      <ShadowStack
        {...position.coverAsObject}
        backgroundColor={colors.appleBlue}
        borderRadius={borderRadius}
        shadows={shadows}
      />
      <RowWithMargins
        align="center"
        css={padding(7, 12, 9)}
        margin={4.8}
        zIndex={1}
      >
        <Icon
          color={colors.white}
          flex={0}
          lineHeight={0}
          name="lock"
        />
        <Text
          color={colors.white}
          flex={1}
          lineHeight={fonts.lineHeight.tight}
          size="smedium"
          weight="semibold"
        >
          Locked
        </Text>
      </RowWithMargins>
      <InnerBorder radius={borderRadius} />
    </Row>
  </ButtonPressAnimation>
);

UnlockAssetButton.propTypes = CoolButton.propTypes;

UnlockAssetButton.defaultProps = CoolButton.defaultProps;

export default withNeverRerender(UnlockAssetButton);
