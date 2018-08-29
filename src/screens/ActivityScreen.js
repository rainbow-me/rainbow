import PropTypes from 'prop-types';
import React from 'react';
import { StatusBar } from 'react-native';
import { compose, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import AppVersionStamp from '../components/AppVersionStamp';
import { ButtonPressAnimation } from '../components/buttons';
import Icon from '../components/icons/Icon';
import { Column, Row } from '../components/layout';
import { Monospace } from '../components/text';
import { withHideSplashScreenOnMount, withSafeAreaViewInsetValues } from '../hoc';
import { colors, fonts, padding } from '../styles';

const ActivityScreen = (props) => {


  return (
    <Container>

    </Container>
  );
}

ActivityScreen.propTypes = {
  //
};

export default ActivityScreen;
