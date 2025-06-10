import { createRainbowStore } from '@/state/internal/createRainbowStore';

export interface ENSMetadata {
  image?: string;
  color?: string;
  path?: string;
}

export interface ENSFormErrors {
  [key: string]: any;
}

export interface ENSFormValues {
  [name: string]: Record<string, any>;
}

export interface ENSRegistrationState {
  // Form state
  errors: ENSFormErrors;
  submitting: boolean;
  isValidating: boolean;
  disabled: boolean;
  selectedFields: string[];
  values: ENSFormValues;
  
  // Metadata
  accentColor: string;
  avatarMetadata: ENSMetadata;
  coverMetadata: ENSMetadata;
  
  // Actions
  setErrors: (errors: ENSFormErrors) => void;
  setSubmitting: (submitting: boolean) => void;
  setIsValidating: (validating: boolean) => void;
  setDisabled: (disabled: boolean) => void;
  setSelectedFields: (fields: string[]) => void;
  setValues: (values: ENSFormValues) => void;
  setAccentColor: (color: string) => void;
  setAvatarMetadata: (metadata: ENSMetadata) => void;
  setCoverMetadata: (metadata: ENSMetadata) => void;
}

export const useENSRegistrationStore = createRainbowStore<ENSRegistrationState>(
  set => ({
    // Initial state
    errors: {},
    submitting: false,
    isValidating: false,
    disabled: false,
    selectedFields: [],
    values: {},
    accentColor: '',
    avatarMetadata: {},
    coverMetadata: {},
    
    // Actions
    setErrors: (errors: ENSFormErrors) => set({ errors }),
    setSubmitting: (submitting: boolean) => set({ submitting }),
    setIsValidating: (validating: boolean) => set({ isValidating: validating }),
    setDisabled: (disabled: boolean) => set({ disabled }),
    setSelectedFields: (fields: string[]) => set({ selectedFields: fields }),
    setValues: (values: ENSFormValues) => set({ values }),
    setAccentColor: (color: string) => set({ accentColor: color }),
    setAvatarMetadata: (metadata: ENSMetadata) => set({ avatarMetadata: metadata }),
    setCoverMetadata: (metadata: ENSMetadata) => set({ coverMetadata: metadata }),
  })
);