import PropTypes from 'prop-types';
import React, { createElement, Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, position } from '../../styles';
import { deviceUtils } from '../../utils';
import Divider from '../Divider';
import { ContextMenu } from '../context-menu';
import { Row } from '../layout';
import { H1 } from '../text';

const ListHeaderHeight = 44;

const gradientProps = {
  colors: [
    colors.listHeaders.firstGradient,
    colors.listHeaders.secondGradient,
    colors.listHeaders.thirdGradient,
  ],
  end: { x: 0, y: 0 },
  start: { x: 0, y: 0.5 },
};

const sx = StyleSheet.create({
  background: {
    backgroundColor: colors.white,
    width: deviceUtils.dimensions.width,
  },
});

const ListHeader = ({
  children,
  contextMenuOptions,
  isCoinListEdited,
  isSticky,
  showDivider,
  title,
  titleRenderer,
}) => (
  <Fragment>
    <LinearGradient
      {...gradientProps}
      pointerEvents="none"
      style={position.coverAsObject}
    />
    <Row
      align="center"
      backgroundColor={isSticky ? colors.white : colors.transparent}
      height={ListHeaderHeight}
      justify="space-between"
      paddingBottom={2}
      paddingHorizontal={19}
      width="100%"
    >
      <Row align="center">
        {createElement(titleRenderer, { children: title })}
        <ContextMenu marginTop={3} {...contextMenuOptions} />
      </Row>
      {children}
    </Row>
    {showDivider && <Divider />}
    {!isSticky && title !== 'Balances' && (
      <View
        height={isCoinListEdited ? ListHeaderHeight : 0}
        style={sx.background}
        top={isCoinListEdited ? -40 : 0}
      />
    )}
  </Fragment>
);

ListHeader.propTypes = {
  children: PropTypes.node,
  contextMenuOptions: PropTypes.object,
  isCoinListEdited: PropTypes.bool,
  isSticky: PropTypes.bool,
  showDivider: PropTypes.bool,
  title: PropTypes.string,
  titleRenderer: PropTypes.func,
};

ListHeader.defaultProps = {
  showDivider: true,
  titleRenderer: H1,
};

ListHeader.height = ListHeaderHeight;

export default ListHeader;
