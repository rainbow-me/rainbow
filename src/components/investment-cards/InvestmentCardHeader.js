import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForKeys } from 'recompact';
import styled from 'styled-components/primitives';
import { colors, padding, position } from '../../styles';
import { Icon } from '../icons';
import {
  Centered,
  Column,
  Row,
  RowWithMargins,
} from '../layout';
import { Emoji, Monospace, Text } from '../text';

const HeaderHeight = 48;

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(0, 15)};
  height: ${HeaderHeight};
`;

const enhance = onlyUpdateForKeys(['collapsed', 'title', 'value']);

const InvestmentCardHeader = enhance(({
  collapsed,
  color,
  emoji,
  isCollapsible,
  title,
  titleColor,
  value,
}) => (
  <Container>
    <Row align="center">
      <Column
        align="start"
        justify="center"
        width={24}
      >
        <Emoji
          name={emoji}
          lineHeight="none"
          size="smedium"
        />
      </Column>
      <Text
        color={titleColor || color}
        letterSpacing="tight"
        size="lmedium"
        weight="medium"
      >
        {title}
      </Text>
    </Row>
    <RowWithMargins align="center" margin={1}>
      <Monospace
        color={color}
        size="lmedium"
        weight="medium"
      >
        {value}
      </Monospace>
      {isCollapsible && (
        <Centered justify="end" style={position.sizeAsObject(19)}>
          <Centered
            flex={0}
            justify="end"
            style={{
              ...position.sizeAsObject(13),
              paddingBottom: collapsed ? 1 : 0,
              paddingTop: collapsed ? 0 : 2,
              position: 'absolute',
              right: 0,
            }}
          >
            <Icon
              color={color}
              direction={collapsed ? 'right' : 'down'}
              name="caretThin"
              width={13}
            />
          </Centered>
        </Centered>
      )}
    </RowWithMargins>
  </Container>
));

InvestmentCardHeader.propTypes = {
  collapsed: PropTypes.bool,
  color: PropTypes.string,
  emoji: PropTypes.string,
  isCollapsible: PropTypes.bool,
  title: PropTypes.string,
  titleColor: PropTypes.string,
  value: PropTypes.string,
};

InvestmentCardHeader.defaultProps = {
  color: colors.dark,
  isCollapsible: false,
};

InvestmentCardHeader.height = HeaderHeight;

export default InvestmentCardHeader;
