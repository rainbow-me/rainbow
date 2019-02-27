import PropTypes from 'prop-types';
import React, { Component } from 'react';
import styled from 'styled-components/primitives';
import { HoldToAuthorizeButton } from '../components/buttons';
import { Centered, FlexItem, Page } from '../components/layout';
import { padding, position } from '../styles';

export default class ExamplePage extends Component {

  render = () => {
    return (
      <Page style={{ flex: 1, ...position.sizeAsObject('100%') }}>
        <Centered
          css={`
            ${padding(15)};
            ${position.cover};
            flex: 0;
         `}
        >
          <FlexItem>
            <HoldToAuthorizeButton
              leftIconProps={{ name: 'faceid' }}
              onLongPress={this.onLongPressSend}
              onPress={this.onPressSend}
              onRelease={this.onReleaseSend}
            >
              Hold to Action
            </HoldToAuthorizeButton>
          </FlexItem>
        </Centered>
      </Page>
    );
  }
}
