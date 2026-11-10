import { useCallback, useEffect } from 'react';

import { atom, useRecoilState } from 'recoil';

import { deprecatedTextRecordFields, type ENS_RECORDS } from '@/features/ens/core/records';

import type { Records } from '../types/registration';
import { REGISTRATION_MODES, textRecordFields, type TextRecordField } from '../utils/helpers';
import { useENSRegistration } from './useENSRegistration';

const uploadsAtom = atom<Record<string, boolean>>({ default: {}, key: 'ensProfileForm.uploads' });
const errorsAtom = atom<Record<string, string>>({ default: {}, key: 'ensProfileForm.errors' });
const submittingAtom = atom({ default: false, key: 'ensProfileForm.submitting' });

export default function useENSRegistrationForm({
  defaultFields,
  initializeForm = false,
}: {
  defaultFields?: TextRecordField[];
  /** Initializes field selection when a registration form opens. */
  initializeForm?: boolean;
} = {}) {
  const {
    accountAddress,
    name,
    mode,
    initialRecords,
    registrationParameters,
    changedRecords,
    records: values,
    removeRecordByKey,
    updateRecordByKey,
    updateRecords,
  } = useENSRegistration();
  const [errors, setErrors] = useRecoilState(errorsAtom);
  const [uploads, setUploads] = useRecoilState(uploadsAtom);
  const uploadKey = `${accountAddress}:${name}`;
  const uploading = { avatar: !!uploads[`${uploadKey}:avatar`], header: !!uploads[`${uploadKey}:header`] };
  const setUploading = useCallback(
    (image: 'avatar' | 'header', uploading: boolean) => {
      setUploads(uploads => {
        const next = { ...uploads };
        const key = `${uploadKey}:${image}`;
        if (uploading) next[key] = true;
        else delete next[key];
        return next;
      });
    },
    [setUploads, uploadKey]
  );
  const [submitting, setSubmitting] = useRecoilState(submittingAtom);
  const selectedFields = Object.values(textRecordFields).filter(field => values[field.key] !== undefined);
  const hasChanges = Object.keys(changedRecords).length > 0;
  const isLoading = mode === REGISTRATION_MODES.EDIT && registrationParameters?.initialRecords === undefined;

  useEffect(() => {
    if (!initializeForm || !registrationParameters || isLoading) return;
    const records: Records = { ...values };
    for (const [oldKey, key] of Object.entries(deprecatedTextRecordFields)) {
      if (key && records[oldKey]) {
        records[key] ??= records[oldKey];
        records[oldKey] = '';
      }
    }
    const fields = Object.values(textRecordFields).filter(field => records[field.key] !== undefined);
    if (!fields.length && defaultFields) {
      for (const field of defaultFields) records[field.key] = '';
    }
    setErrors({});
    setUploading('avatar', false);
    setUploading('header', false);
    updateRecords(records);
    // The initial snapshot identifies the edit session; typing must not reinitialize it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, initialRecords, initializeForm, isLoading, updateRecords, setUploading]);

  const onRemoveField = useCallback(
    (field: Pick<TextRecordField, 'key'>) => {
      setErrors(errors => {
        const next = { ...errors };
        delete next[field.key];
        return next;
      });
      removeRecordByKey(field.key);
    },
    [removeRecordByKey, setErrors]
  );

  const toggleField = useCallback(
    (field: TextRecordField) => {
      if (values[field.key] !== undefined) onRemoveField(field);
      else updateRecordByKey(field.key, '');
    },
    [values, onRemoveField, updateRecordByKey]
  );

  const onChangeField = useCallback(
    ({ key, value }: { key: string; value: string }) => {
      const validation = textRecordFields[key as ENS_RECORDS]?.validation;
      setErrors(errors => {
        const next = { ...errors };
        if (validation && value && !validation.validator(value)) next[key] = validation.message;
        else delete next[key];
        return next;
      });
      updateRecordByKey(key, value);
    },
    [setErrors, updateRecordByKey]
  );

  const submit = useCallback(
    async (submitFn: () => Promise<void> | void) => {
      setSubmitting(true);
      try {
        await submitFn();
      } finally {
        setSubmitting(false);
      }
    },
    [setSubmitting]
  );

  return {
    disabled: uploading.avatar || uploading.header || (mode === REGISTRATION_MODES.EDIT && !hasChanges),
    errors,
    isEmpty: !Object.values(values).some(Boolean),
    isLoading,
    toggleField,
    onChangeField,
    onRemoveField,
    selectedFields,
    setUploading,
    uploading,
    submit,
    submitting,
    values,
  };
}
