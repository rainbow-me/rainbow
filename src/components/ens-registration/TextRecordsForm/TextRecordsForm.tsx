/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { TextInputProps } from 'react-native';
import InlineField from '../../inputs/InlineField';
import { Box, Divider } from '@rainbow-me/design-system';

type Field = {
  id: string;
  key: string;
  label: string;
  placeholder: string;
  inputProps?: Partial<TextInputProps>;
};

export const fields = {
  name: {
    id: 'name',
    key: 'me.rainbow.displayName',
    label: 'Name',
    placeholder: 'Add a display name',
  },
  bio: {
    id: 'bio',
    inputProps: {
      multiline: true,
    },
    key: 'description',
    label: 'Bio',
    placeholder: 'Add a bio to your profile',
  },
  twitter: {
    id: 'twitter',
    key: 'com.twitter',
    label: 'Twitter',
    placeholder: '@username',
  },
  website: {
    id: 'website',
    inputProps: {
      keyboardType: 'url',
    },
    key: 'website',
    label: 'Website',
    placeholder: 'Add your website',
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
  snapchat: {
    id: 'snapchat',
    key: 'com.snapchat',
    label: 'Snapchat',
    placeholder: '@username',
  },
  youtube: {
    id: 'youtube',
    key: 'com.youtube',
    label: 'YouTube',
    placeholder: '@username',
  },
};

type TextRecordsFormProps = {
  selectedFields: Field[];
};

export default function TextRecordsForm({
  selectedFields,
}: TextRecordsFormProps) {
  return (
    <Box>
      {selectedFields.map(({ label, inputProps, placeholder, id }) => (
        <Box key={id}>
          <Divider />
          <InlineField
            inputProps={inputProps}
            label={label}
            placeholder={placeholder}
          />
        </Box>
      ))}
    </Box>
  );
}
