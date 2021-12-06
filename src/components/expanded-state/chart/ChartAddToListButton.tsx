import React, { Fragment, useCallback } from 'react';
import { View } from 'react-native';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../../animations';
import { Centered } from '../../layout';
import { Text } from '../../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
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

const ChartAddToListButton = ({ asset }: any) => {
  const { navigate } = useNavigation();

  const handlePress = useCallback(() => {
    navigate(Routes.ADD_TOKEN_SHEET, { item: asset });
  }, [asset, navigate]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Fragment>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <AddToListButton
        as={ButtonPressAnimation}
        onPress={handlePress}
        testID="add-to-list-button"
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Circle>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <PlusIcon>􀅼</PlusIcon>
        </Circle>
      </AddToListButton>
    </Fragment>
  );
};

export default magicMemo(ChartAddToListButton, ['asset']);
