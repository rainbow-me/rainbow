import React, { createElement, Fragment } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components/primitives';
import { withThemeContext } from '../../context/ThemeContext';
import { useDimensions } from '../../hooks';
import Divider from '../Divider';
import { ContextMenu } from '../context-menu';
import { Row } from '../layout';
import SavingsListHeader from '../savings/SavingsListHeader';
import { H1 } from '../text';
import { padding, position } from '@rainbow-me/styles';

export const ListHeaderHeight = 44;

const BackgroundGradient = withThemeContext(styled(LinearGradient).attrs(
  ({ colors }) => ({
    colors: [
      colors.listHeaders.firstGradient,
      colors.listHeaders.secondGradient,
      colors.listHeaders.thirdGradient,
    ],
    end: { x: 0, y: 0 },
    pointerEvents: 'none',
    start: { x: 0, y: 0.5 },
  })
)`
  ${position.cover};
`);

const Content = withThemeContext(styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(0, 19, 2)};
  background-color: ${({ isSticky, colors }) =>
    isSticky ? colors.white : colors.transparent};
  height: ${ListHeaderHeight};
  width: 100%;
`);

const StickyBackgroundBlocker = withThemeContext(styled.View`
  background-color: ${({ colors }) => colors.white};
  height: ${({ isEditMode }) => (isEditMode ? ListHeaderHeight : 0)};
  top: ${({ isEditMode }) => (isEditMode ? -40 : 0)};
  width: ${({ deviceDimensions }) => deviceDimensions.width};
`);

export default function ListHeader({
  children,
  contextMenuOptions,
  isCoinListEdited,
  isSticky,
  showDivider = true,
  title,
  titleRenderer = H1,
  totalValue,
}) {
  const deviceDimensions = useDimensions();

  if (title === 'Pools') {
    return (
      <SavingsListHeader
        emoji="whale"
        isOpen={false}
        onPress={() => {}}
        savingsSumValue={totalValue}
        showSumValue
        title="Pools"
      />
    );
  } else {
    return (
      <Fragment>
        <BackgroundGradient />
        <Content isSticky={isSticky}>
          <Row align="center">
            {createElement(titleRenderer, { children: title })}
            <ContextMenu marginTop={3} {...contextMenuOptions} />
          </Row>
          {children}
        </Content>
        {showDivider && <Divider />}
        {!isSticky && title !== 'Balances' && (
          <StickyBackgroundBlocker
            deviceDimensions={deviceDimensions}
            isEditMode={isCoinListEdited}
          />
        )}
      </Fragment>
    );
  }
}
