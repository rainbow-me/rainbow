import React, { Fragment, useCallback } from 'react';
import { View } from 'react-native';
import { IS_TESTING } from 'react-native-dotenv';
import RadialGradient from 'react-native-radial-gradient';
import { ButtonPressAnimation } from '../../animations';
import { Centered } from '../../layout';
import { Text } from '../../text';
import { isL2Asset } from '@/handlers/assets';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { magicMemo } from '@/utils';

const AddToListButtonPadding = 19;

const AddToListButton = styled(Centered)({
  ...padding.object(0, AddToListButtonPadding),
  height: 40,
  marginRight: 10,
  width: 40,
});

const Circle = styled(IS_TESTING === 'true' ? View : RadialGradient).attrs(
  ({ theme: { colors } }) => ({
    center: [0, 20],
    colors: colors.gradients.lightestGrey,
  })
)({
  borderRadius: 20,
  height: 40,
  overflow: 'hidden',
  width: 40,
});

const PlusIcon = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.4),
  letterSpacing: 'zero',
  size: 'large',
  weight: 'bold',
}))({
  height: '100%',
  lineHeight: 39,
  width: '100%',
});

const ChartAddToListButton = ({ asset }) => {
  const { navigate } = useNavigation();

  const handlePress = useCallback(() => {
    navigate(Routes.ADD_TOKEN_SHEET, {
      isL2: isL2Asset(asset?.network),
      item: asset,
    });
  }, [asset, navigate]);

  return (
    <Fragment>
      <AddToListButton
        as={ButtonPressAnimation}
        onPress={handlePress}
        testID="add-to-list-button"
      >
        <Circle>
          <PlusIcon>􀅼</PlusIcon>
        </Circle>
      </AddToListButton>
    </Fragment>
  );
};

export default magicMemo(ChartAddToListButton, ['asset']);
