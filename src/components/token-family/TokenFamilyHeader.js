import PropTypes from 'prop-types';
import React from 'react';
import { View, Text } from 'react-primitives';
import { onlyUpdateForKeys } from 'recompact';
import Divider from '../Divider';
import { ListHeader } from '../list';
import styled from 'styled-components/primitives/dist/styled-components-primitives.esm';
import { TruncatedText, Monospace } from '../text';
import Highlight from '../Highlight';
import CloseIcon from '../icons/svg/CloseIcon';
import { Icon } from '../icons';
import { ButtonPressAnimation } from '../animations';

const Wrapper = styled.View`
  height: 56px;
  width: 100%;
  padding: 11px 19px;
  align-items: center;
  flex-direction: row;
  justify-content: space-between;
`;

const Image = styled.View`
  height: 34px;
  width: 34px;
  background-color: #ffd9fe;
  justify-content: center;
  border-radius: 10.3px;
`;

const LeftView = styled.View`
  align-items: center;
  flex-direction: row;
`;

const RightView = styled.View`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: row;
`;

const ArrowWrap = styled.View`
  padding-left: 9px;
  transform: scale(0.8);
`;

const SendWrap = styled.View`
  background-color: #f3f5f7;
  border-radius: 15px;
  height: 30px;
  width: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const SendIconWrap = styled.View`
  transform: scale(0.6);
  opacity: 0.6;
`;

const TokenListHeader = (props) => (
  <Wrapper>
    <Highlight highlight={props.highlight} />
    <LeftView>
      <Image>

      </Image>
      <TruncatedText
        style={{ paddingLeft: 9 }}
        lineHeight="normal"
        size="medium"
        weight="semibold"
      >
        {props.familyName}
      </TruncatedText>
      {!props.isOpen &&
        <ArrowWrap>
          <Icon
            color={'black'}
            name={'caret'}
            direction={'right'}
          />
        </ArrowWrap>
      }
    </LeftView>
    {!props.isOpen ?
      <Monospace
        color="blueGreyDark"
        size="lmedium"
      >
        {props.childrenAmount}
      </Monospace> :
      <ButtonPressAnimation
        scaleTo={0.8}
        onPress={() => {}}
      >
        <SendWrap>
          <SendIconWrap>
            <Icon
              color={'#3c4252'}
              name={'share'}
            />
          </SendIconWrap>
        </SendWrap>
      </ButtonPressAnimation>
    }
  </Wrapper>
);

TokenListHeader.propTypes = {

};

export default TokenListHeader;
