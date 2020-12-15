import React, { useCallback, useState } from 'react';
import { ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { DefaultTokenLists } from '../../references';
import ButtonPressAnimation from '../animations/ButtonPressAnimation/ButtonPressAnimation.ios';
import { Column, Flex, Row } from '../layout';
import { Emoji, Text } from '../text';
import { useAccountSettings } from '@rainbow-me/hooks';
import { colors } from '@rainbow-me/styles';

const ListButton = styled(ButtonPressAnimation)`
  margin-right: 20;
  ${({ selected }) =>
    selected
      ? `
        background-color: ${colors.alpha(colors.blueGreyDark, 0.06)};
        padding-left: 8px;
        padding-right: 8px;
        padding-top: 6px;
        padding-bottom: 6px;
        border-radius: 12px;
      `
      : `
        padding-top: 6px;
      `}
`;

const ListName = styled(Text)`
  margin-left: 5px;
  margin-top: -5px;
`;

export default function PulseIndex() {
  const { network } = useAccountSettings();
  const [selectedList, setSelectedList] = useState('favorites');

  const handleSwitchList = useCallback(id => {
    setSelectedList(id);
  }, []);

  return (
    <Column>
      <Flex marginBottom={10} paddingHorizontal={19}>
        <Text size="larger" weight="bold">
          Lists
        </Text>
      </Flex>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 19 }} horizontal>
        {DefaultTokenLists[network].map(list => (
          <ListButton
            key={`list-${list.id}`}
            onPress={() => handleSwitchList(list.id)}
            selected={selectedList === list.id}
          >
            <Row>
              <Emoji name={list.emoji} size="smedium" />
              <ListName
                color={colors.blueGreyDark50}
                lineHeight="paragraphSmall"
                size="lmedium"
                weight="bold"
              >
                {list.name}
              </ListName>
            </Row>
          </ListButton>
        ))}
      </ScrollView>
    </Column>
  );
}
