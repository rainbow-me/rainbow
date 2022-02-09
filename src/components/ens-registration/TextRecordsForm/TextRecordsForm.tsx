/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import InlineField, { InlineFieldProps } from '../../inputs/InlineField';
import { Box, Divider } from '@rainbow-me/design-system';

type Field = {
  id: string;
  key: string;
  label: InlineFieldProps['label'];
  placeholder: InlineFieldProps['placeholder'];
  inputProps?: InlineFieldProps['inputProps'];
  validations?: InlineFieldProps['validations'];
};

export const fields = {
  name: {
    id: 'name',
    key: 'me.rainbow.displayName',
    label: 'Name',
    placeholder: 'Add a display name',
    inputProps: {
      maxLength: 50,
    },
  },
  bio: {
    id: 'bio',
    inputProps: {
      maxLength: 100,
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
    inputProps: {
      maxLength: 16,
    },
    validations: {
      allowCharacterRegex: {
        match: /^@?\w*$/,
      },
    },
  },
  website: {
    id: 'website',
    inputProps: {
      maxLength: 100,
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
    inputProps: {
      maxLength: 20,
    },
  },
  instagram: {
    id: 'instagram',
    key: 'com.instagram',
    label: 'Instagram',
    placeholder: '@username',
    inputProps: {
      maxLength: 30,
    },
    validations: {
      allowCharacterRegex: {
        match: /^@?([\w.])*$/,
      },
    },
  },
  snapchat: {
    id: 'snapchat',
    key: 'com.snapchat',
    label: 'Snapchat',
    placeholder: '@username',
    inputProps: {
      maxLength: 16,
    },
    validations: {
      allowCharacterRegex: {
        match: /^@?([\w.])*$/,
      },
    },
  },
  youtube: {
    id: 'youtube',
    key: 'com.youtube',
    label: 'YouTube',
    placeholder: '@username',
    inputProps: {
      maxLength: 50,
    },
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
      {selectedFields.map(
        ({ label, inputProps, placeholder, validations, id }) => (
          <Box key={id}>
            <Divider />
            <InlineField
              inputProps={inputProps}
              label={label}
              placeholder={placeholder}
              validations={validations}
            />
          </Box>
        )
      )}
    </Box>
  );
}
