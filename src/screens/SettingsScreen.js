import React, { Component } from 'react';
import personalData from '../model/personalData';
import Container from '../components/Container';
import Card from '../components/Card';
import Section from '../components/Section';
import Label from '../components/Label';
import Text from '../components/Text';
import { capitalize } from '../helpers/utilities';

class SettingsScreen extends Component {
  render() {
    return (
      <Container>
        {Object.keys(personalData).map(section => (
          <Card key={section}>
            {Object.keys(personalData[section]).map(label => (
              <Section key={label}>
                <Label>{capitalize(label)}</Label>
                <Text>{personalData[section][label]}</Text>
              </Section>
            ))}
          </Card>
        ))}
      </Container>
    );
  }
}

export default SettingsScreen;
