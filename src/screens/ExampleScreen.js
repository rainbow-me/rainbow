import PropTypes from 'prop-types';
import React, { PureComponent, useState } from 'react';
import { TextInput, KeyboardAvoidingView, useWindowDimensions } from 'react-native';
import { compose } from 'recompact';
import { AnimatedNumber, defaultAnimatedNumberProps } from '../components/animations';
import { Button } from '../components/buttons';
import { GasSpeedButton } from '../components/gas';
import { Text } from '../components/text';
import { Input } from '../components/inputs';
import { Centered,ColumnWithMargins, Column, Row, FlexItem, Page } from '../components/layout';
import { withDataInit, withAccountData } from '../hoc';
import { colors, position } from '../styles';
import { CompoundInvestmentCard } from '../components/investment-cards';

const Thingy = () => {
  const dims = useWindowDimensions();
  const [value, setValue] = useState(0);
  const [time, setTime] = useState(`${defaultAnimatedNumberProps.time}`);
  const [steps, setSteps] = useState(`${defaultAnimatedNumberProps.steps}`);

  let huh = false;
  const loop = () => {
    setValue(p => {

      if (p > 1000) {
        huh = true;
      }

      return p + (200.65 * (huh ? -1 : 1));
    })
  }

  return (
    <KeyboardAvoidingView behavior="padding">
      <Column {...position.size('100%')} backgroundColor="white" align="start" justify="center">
        <Centered height={dims.height / 3} padding={80} width="100%">
          <Centered {...position.coverAsObject} marginTop={50} margin={34} backgroundColor="pink" borderRadius={20}>
            <AnimatedNumber
              color="white"
              fontSize={40}
              steps={steps}
              time={time}
              value={value}
            />
          </Centered>
        </Centered>
        <ColumnWithMargins
          backgroundColor={colors.white}
          direction="column"
          flexGrow={1}
          flexShrink={0}
          maxHeight={dims.height / 3}
          paddingHorizontal={19}
          paddingVertical={50}
          width="100%"
        >
          <Row align="center" justify="space-between" width="100%">
            <Text>Time:</Text>
            <Input
              align="right"
              backgroundColor="white"
              defaultValue={time}
              keyboardType="numeric"
              height={30}
              onChange={({ nativeEvent: { text } }) => setTime(text)}
              value={time}
              width={dims.width / 3}
            />
          </Row>
          <Row align="center" justify="space-between" width="100%">
            <Text>Steps:</Text>
            <Input
              align="right"
              backgroundColor="white"
              keyboardType="numeric"
              defaultValue={steps}
              height={30}
              onChange={({ nativeEvent: { text } }) => setSteps(text)}
              value={steps}
              width={dims.width / 3}
            />
          </Row>
        </ColumnWithMargins>
        <Centered
          backgroundColor={colors.dark}
          flexGrow={1}
          flexShrink={0}
          maxHeight={dims.height / 3}
          padding={50}
          width="100%"
        >
          <Button onPress={loop}>Animate Number</Button>
        </Centered>
      </Column>
    </KeyboardAvoidingView>
  );
}

class ExampleScreen extends PureComponent {
  static propTypes = {
    initializeWallet: PropTypes.func,
  };

  componentDidMount = async () => {
    try {
      await this.props.initializeWallet();
    } catch (error) {
      console.log('lol error on ExampleScreen like a n00b: ', error);
    }
  };

  render = () => (
        <Thingy />
  );
}

export default compose(withAccountData, withDataInit)(ExampleScreen);


       // {/*<CompoundInvestmentCard />*/}

    //   {
    //     // haha you can put stuff here if you wanna test a component in isolation!
    //     // ... i dont want to set up storybook right now

    // <Page
    //   {...position.centeredAsObject}
    //   {...position.sizeAsObject('100%')}
    //   color={colors.dark}
    //   flex={1}
    // >
    //   <Centered width="100%">
    //   </Centered>
    // </Page>
    //   }
