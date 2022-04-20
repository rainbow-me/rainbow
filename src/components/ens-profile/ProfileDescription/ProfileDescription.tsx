import React from 'react';
import RecordHyperlink from '../RecordHyperlink/RecordHyperlink';
import { Inline, Text } from '@rainbow-me/design-system';

const ENS_REGEX = /[^\s]+.eth/g;

const ProfileDescription = ({ description }: { description?: string }) => {
  if (!description) return null;
  const ensNames = description.match(ENS_REGEX);
  const text = description.split(ENS_REGEX);
  return (
    <Inline alignVertical="center">
      {text?.map((t, i) => (
        <>
          <Text containsEmoji key={i} weight="medium">
            {t}
          </Text>
          {ensNames?.[i] && <RecordHyperlink value={ensNames?.[i]} />}
        </>
      ))}
    </Inline>
  );
};

export default ProfileDescription;
