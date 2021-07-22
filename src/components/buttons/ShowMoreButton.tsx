import React from 'react';
import { ButtonPressAnimation } from '../animations';
import { Row } from '../layout';
import { Text } from '../text';

interface Props {
  backgroundColor: string | null;
  color: string | null;
  onPress: () => void | null;
  label: string;
}

const ShowMoreButton = ({
  backgroundColor,
  color,
  onPress,
  label = 'Show more',
}: Props) => (
  <Row justify="center">
    <ButtonPressAnimation onPress={onPress}>
      <Row
        backgroundColor={backgroundColor}
        borderRadius={18}
        height={36}
        paddingHorizontal={12}
        paddingTop={android ? 3 : 7}
      >
        <Text align="center" color={color} size="lmedium" weight="heavy">
          {label}
        </Text>
      </Row>
    </ButtonPressAnimation>
  </Row>
);

export default ShowMoreButton;
