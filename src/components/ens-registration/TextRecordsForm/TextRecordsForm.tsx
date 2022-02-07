import React from 'react';
import InlineField from '../../inputs/InlineField';
import { Box, Divider } from '@rainbow-me/design-system';

type Field = {
  id: string;
  key: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
};

export const fields = {
  bio: {
    id: 'bio',
    key: 'description',
    label: 'Bio',
    multiline: true,
    placeholder: 'Add a bio to your profile',
  },
  github: {
    id: 'github',
    key: 'com.github',
    label: 'GitHub',
    placeholder: '@username',
  },
  instagram: {
    id: 'instagram',
    key: 'com.instagram',
    label: 'Instagram',
    placeholder: '@username',
  },
  name: {
    id: 'name',
    key: 'me.rainbow.displayName',
    label: 'Name',
    placeholder: 'Add a display name',
  },
  snapchat: {
    id: 'snapchat',
    key: 'com.snapchat',
    label: 'Snapchat',
    placeholder: '@username',
  },
  twitter: {
    id: 'twitter',
    key: 'com.twitter',
    label: 'Twitter',
    placeholder: '@username',
  },
  website: {
    id: 'website',
    key: 'website',
    label: 'Website',
    placeholder: 'Add your website',
  },
  youtube: {
    id: 'youtube',
    key: 'com.youtube',
    label: 'YouTube',
    placeholder: '@username',
  },
};

type TextRecordsFormProps = {
  defaultFields: Field[];
};

export default function TextRecordsForm({
  defaultFields,
}: TextRecordsFormProps) {
  return (
    <Box>
      {defaultFields.map(({ label, multiline, placeholder }, i) => (
        <Box key={i}>
          <Divider />
          <InlineField
            label={label}
            multiline={multiline}
            placeholder={placeholder}
          />
        </Box>
      ))}
    </Box>
  );
}
