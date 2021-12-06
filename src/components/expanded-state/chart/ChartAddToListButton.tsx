import React, { Fragment, useCallback } from 'react';
import { View } from 'react-native';
import { IS_TESTING } from 'react-native-dotenv';
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../../animations';
import { Centered } from '../../layout';
import { Text } from '../../text';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { padding } from '@rainbow-me/styles';
import { magicMemo } from '@rainbow-me/utils';

const AddToListButtonPadding = 19;

const AddToListButton = styled(Centered)`
  ${padding(0, AddToListButtonPadding)};
  height: 40px;
  width: 40px;
  margin-right: 10px;
`;

const Circle = styled(IS_TESTING === 'true' ? View : RadialGradient).attrs(
  ({ theme: { colors } }) => ({
    center: [0, 20],
    colors: colors.gradients.lightestGrey,
  })
)`
  border-radius: 20px;
  height: 40px;
  overflow: hidden;
  width: 40px;
`;

const PlusIcon = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.4),
  letterSpacing: 'zero',
  size: 'large',
  weight: 'bold',
}))`
  height: 100%;
  line-height: 39px;
  width: 100%;
`;

const ChartAddToListButton = ({ asset }) => {
  const { navigate } = useNavigation();

  const handlePress = useCallback(() => {
    navigate(Routes.ADD_TOKEN_SHEET, { item: asset });
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
