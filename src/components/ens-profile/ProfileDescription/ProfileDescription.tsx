import React from 'react';
import RecordHyperlink from '../RecordHyperlink/RecordHyperlink';
import { Inline, Text } from '@rainbow-me/design-system';

const LINK_REGEX = /[^\s]+\.(eth|com|net|xyz|org|co|us|me)/g;
const DIVIDER = 'ㅤㅤㅤㅤ';

const ProfileDescription = ({ description }: { description?: string }) => {
  if (!description) return null;
  const hyperlinks = description.match(LINK_REGEX);
  const text = description.replace(LINK_REGEX, DIVIDER).split(DIVIDER);

  return (
    <Inline alignVertical="center" verticalSpace="10px">
      {text?.map((t, i) => (
        <>
          <Text
            color="secondary80"
            containsEmoji
            key={i}
            size="15px"
            weight="medium"
          >
            {t}
          </Text>
          {hyperlinks?.[i] && <RecordHyperlink value={hyperlinks?.[i]} />}
        </>
      ))}
    </Inline>
  );
};

export default ProfileDescription;
