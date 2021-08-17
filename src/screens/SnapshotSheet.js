/* eslint-disable sort-keys */
import { useRoute } from '@react-navigation/native';
import snapshot from '@snapshot-labs/snapshot.js';
import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';

import styled from 'styled-components';
import { snapshotClient } from '../apollo/client';
import { SNAPSHOT_PROPOSALS } from '../apollo/queries';
import ActivityIndicator from '../components/ActivityIndicator';
import { ButtonPressAnimation } from '../components/animations';
import { Centered, Column } from '../components/layout';

import { SheetActionButton, SheetTitle } from '../components/sheet';
import { Text } from '../components/text';
import { fonts, fontWithWidth, position } from '@rainbow-me/styles';

async function fetchProposals(space) {
  const response = await snapshotClient.query({
    query: SNAPSHOT_PROPOSALS,
    variables: {
      space: space,
    },
  });

  return response.data.proposals;
}

 const getVotingPower = proposal => {
    const space = 'friendswithbenefits.eth';
    const strategies = proposal.strategies;
    const network = '1';
    const provider = snapshot.utils.getProvider(network);
    const voters = ['0xe826F1C06d5ae90E4C098459D1b7464a8dC604cA'];

    const blockNumber = proposal.snapshot;

    snapshot.utils
      .getScores(space, strategies, network, provider, voters, blockNumber)
      .then(scores => {
        console.log('Scores', scores);
      });
  };


const Container = styled(Column)`
  margin-horizontal: 30;
`;

const Wrapper = styled.View`
  background-color: ${({ theme: { colors } }) => colors.white};
  border-top-left-radius: 15;
  border-top-right-radius: 15;
  height: 100%;
  overflow: hidden;
`;

const LoadingWrapper = styled.View`
  align-items: center;
  height: 100%;
  justify-content: center;
  width: 100%;
`;

export default function SnapshotSheet() {
  const { params: { space } = {} } = useRoute();

  //const hubUrl = 'https://hub.snapshot.org';
  //const client = new Client(hubUrl);

  const [proposals, setProposals] = useState(null);

  const message = (id, choice) => {
    return {
      version: '0.1.3',
      timestamp: new Date().toString(),
      space: space || 'friendswithbenefits.eth',
      type: 'vote',
      payload: {
        proposal: id,
        choice: choice || 1,
        metadata: {},
      },
    };
  };

  const logMessage = (id, choice, proposal) => {
    console.log(message(id, choice));
    getVotingPower(proposal);
  };

  useEffect(() => {
    const init = async () => {
      const proposals = await fetchProposals('friendswithbenefits.eth');
      setProposals(proposals);
    };
    init();
  }, [space]);

  const loading = proposals === null;

  return (
    <Wrapper>
      {loading ? (
        <LoadingWrapper>
          <ActivityIndicator />
        </LoadingWrapper>
      ) : (
        <Container>
          <SheetTitle>FWB</SheetTitle>
          {proposals.map(proposal => {
            return (
              <Column key={proposal.id} style={{ padding: 10 }}>
                <Text>{proposal.title}</Text>
                {proposal.choices.map((choice, index) => {
                  return (
                    <ButtonPressAnimation
                      key={index}
                      onPress={() => logMessage(proposal.id, index + 1, proposal)}
                    >
                      <Text>{choice}</Text>
                    </ButtonPressAnimation>
                  );
                })}
                <Text>{JSON.stringify(proposal.strategies)}</Text>
              </Column>
            );
          })}
        </Container>
      )}
    </Wrapper>
  );
}
