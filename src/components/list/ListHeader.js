import PropTypes from 'prop-types';
import React, { createElement, Fragment } from 'react';
import { View } from 'react-native';
import { pure } from 'recompact';
import { colors, padding, position } from '../../styles';
import LinearGradient from 'react-native-linear-gradient';
import { Row } from '../layout';
import { H1 } from '../text';
import ContextMenu from '../ContextMenu';
import Divider from '../Divider';
import { deviceUtils } from '../../utils';

const height = 44;

const ListHeader = pure(
  ({
    children,
    contextMenuOptions,
    isSticky,
    showDivider,
    title,
    titleRenderer,
  }) => (
    <Fragment>
      <LinearGradient
        colors={[
          colors.listHeaders.firstGradient,
          colors.listHeaders.secondGradient,
          colors.listHeaders.thirdGradient,
        ]}
        end={{ x: 0, y: 0 }}
        pointerEvents="none"
        start={{ x: 0, y: 0.5 }}
        style={[position.coverAsObject]}
      />
      <Row
        align="center"
        backgroundColor={isSticky ? colors.white : colors.transparent}
        css={padding(0, 19, 2, 19)}
        height={height}
        justify="space-between"
        width="100%"
      >
        <Row align="center">
          {createElement(titleRenderer, { children: title })}
          {contextMenuOptions && <ContextMenu {...contextMenuOptions} />}
        </Row>
        {children}
      </Row>
      {showDivider && <Divider />}
      {!isSticky && title !== 'Balances' && (
        <View
          style={{
            backgroundColor: colors.white,
            height: deviceUtils.dimensions.height,
            width: deviceUtils.dimensions.width,
          }}
        />
      )}
    </Fragment>
  )
);

ListHeader.propTypes = {
  children: PropTypes.node,
  contextMenuOptions: PropTypes.object,
  showDivider: PropTypes.bool,
  title: PropTypes.string,
  titleRenderer: PropTypes.func,
};

ListHeader.defaultProps = {
  showDivider: true,
  titleRenderer: H1,
};

ListHeader.height = height;

export default ListHeader;
