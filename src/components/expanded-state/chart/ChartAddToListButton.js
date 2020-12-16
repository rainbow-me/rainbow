import React, { Fragment, useCallback } from 'react';
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components/primitives';
import { ButtonPressAnimation } from '../../animations';
import { Centered } from '../../layout';
import { Text } from '../../text';
import { useUniswapAssets } from '@rainbow-me/hooks';
import { colors, padding } from '@rainbow-me/styles';
import { magicMemo } from '@rainbow-me/utils';

const AddToListButtonPadding = 19;

const AddToListButton = styled(Centered)`
  ${padding(0, AddToListButtonPadding)};
  height: 40px;
  width: 40px;
  margin-right: 10px;
`;

const Circle = styled(RadialGradient).attrs({
  center: [0, 15],
  colors: ['#FFFFFF', '#F2F4F7'],
})`
  border-radius: 30px;
  height: 40px;
  overflow: hidden;
  width: 40px;
  padding-top: 5px;
  padding-left: 2px;
`;

const PlusIcon = styled(Text).attrs({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.2),
  letterSpacing: 'zero',
  size: 'larger',
  weight: 'heavy',
})`
  height: 100%;
  line-height: 28px;
  width: 100%;
`;

const ChartAddToListButton = ({ asset }) => {
  const { updateList } = useUniswapAssets();
  const handlePress = useCallback(() => {
    updateList(asset.address, 'watchlist', !asset.isInWatchlist);
  }, [asset.address, asset.isInWatchlist, updateList]);

  return (
    <Fragment>
      <AddToListButton as={ButtonPressAnimation} onPress={handlePress}>
        <Circle>
          <PlusIcon>{asset.isInWatchlist ? `􀅽` : `􀅼`}</PlusIcon>
        </Circle>
      </AddToListButton>
    </Fragment>
  );
};

export default magicMemo(ChartAddToListButton, ['asset']);
