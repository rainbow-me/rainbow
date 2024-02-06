import { isEmpty } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { atom, useRecoilState } from 'recoil';
import { useENSModifiedRegistration, useENSRegistration } from '.';
import { Records } from '@/entities';
import { deprecatedTextRecordFields, ENS_RECORDS, REGISTRATION_MODES, TextRecordField, textRecordFields } from '@/helpers/ens';

const disabledAtom = atom({
  default: false,
  key: 'ensProfileForm.disabled',
});

const errorsAtom = atom<{ [name: string]: string }>({
  default: {},
  key: 'ensProfileForm.errors',
});

const isValidatingAtom = atom({
  default: false,
  key: 'ensProfileForm.isValidating',
});

const selectedFieldsAtom = atom<TextRecordField[]>({
  default: [],
  key: 'ensProfileForm.selectedFields',
});

const submittingAtom = atom({
  default: false,
  key: 'ensProfileForm.submitting',
});

export const valuesAtom = atom<{ [name: string]: Partial<Records> }>({
  default: {},
  key: 'ensProfileForm.values',
});

const defaultInitialRecords = {
  [ENS_RECORDS.name]: '',
  [ENS_RECORDS.description]: '',
  [ENS_RECORDS.url]: '',
  [ENS_RECORDS.twitter]: '',
};

const prepareFormRecords = (initialRecords: Records) => {
  // delete these to show an empty form if the user only have one of these set
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { ETH, avatar, header, ...cleanFormRecords } = initialRecords;

  // if the profile has existing records, use these
  if (Object.keys(cleanFormRecords).length) {
    return {
      ...initialRecords,
      // migrate any deprecated field keys to their new keys
      ...Object.entries(deprecatedTextRecordFields).reduce((fields, [deprecatedFieldKey, fieldKey]) => {
        return {
          ...fields,
          [deprecatedFieldKey]: '',
          [fieldKey]: initialRecords[fieldKey] || initialRecords[deprecatedFieldKey as ENS_RECORDS],
        };
      }, {}),
    };
  }

  return {
    ...defaultInitialRecords,
    ...initialRecords,
  };
};

export default function useENSRegistrationForm({
  defaultFields,
  initializeForm,
}: {
  defaultFields?: TextRecordField[];
  /** A flag that indicates if a new form should be initialised */
  initializeForm?: boolean;
} = {}) {
  const { name, mode, initialRecords, records: allRecords, removeRecordByKey, updateRecordByKey, updateRecords } = useENSRegistration();
  const { changedRecords, isSuccess } = useENSModifiedRegistration();

  // The initial records will be the existing records belonging to the profile in "edit mode",
  // but will be all of the records in "create mode".
  const defaultRecords = useMemo(() => {
    return mode === REGISTRATION_MODES.EDIT ? prepareFormRecords(initialRecords) : allRecords;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRecords, mode]);

  const [errors, setErrors] = useRecoilState(errorsAtom);
  const [submitting, setSubmitting] = useRecoilState(submittingAtom);
  const [isValidating, setIsValidating] = useRecoilState(isValidatingAtom);

  const [disabled, setDisabled] = useRecoilState(disabledAtom);
  useEffect(() => {
    // If we are in edit mode, we want to disable the "Review" button
    // when there are no changed records.
    // Note: We don't want to do this in create mode as we have the "Skip"
    // button.
    setDisabled(mode === REGISTRATION_MODES.EDIT && isEmpty(changedRecords));
  }, [changedRecords, mode, setDisabled]);

  const [selectedFields, setSelectedFields] = useRecoilState(selectedFieldsAtom);
  useEffect(() => {
    if (!initializeForm) return;
    // If there are existing records in the global state, then we
    // populate with that.
    if (!isEmpty(defaultRecords)) {
      setSelectedFields(
        Object.values(textRecordFields)
          .map(field => (defaultRecords[field.key] !== undefined ? field : undefined))
          .filter(Boolean) as TextRecordField[]
      );
    } else {
      if (defaultFields) {
        setSelectedFields(defaultFields);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, defaultRecords]);

  const [valuesMap, setValuesMap] = useRecoilState(valuesAtom);
  const values = useMemo(() => valuesMap[name] || {}, [name, valuesMap]);
  useEffect(
    () => {
      if (!initializeForm) return;
      setValuesMap(values => ({
        ...values,
        [name]: defaultRecords,
      }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name, defaultRecords]
  );

  // Set initial records in redux depending on user input (defaultFields)
  useEffect(() => {
    if (!initializeForm) return;
    if (defaultFields && isEmpty(defaultRecords)) {
      const records = defaultFields.reduce((records, field) => {
        return {
          ...records,
          [field.key]: '',
        };
      }, {});
      updateRecords(records);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmpty(defaultRecords), updateRecords]);

  // Reset errors if changedRecords is reset
  useEffect(() => {
    if (isEmpty(changedRecords)) {
      setErrors({});
    }
  }, [changedRecords, initializeForm, setErrors]);

  const onAddField = useCallback(
    (fieldToAdd: TextRecordField, selectedFields: TextRecordField[]) => {
      setSelectedFields(selectedFields);
      updateRecordByKey(fieldToAdd.key, '');
    },
    [setSelectedFields, updateRecordByKey]
  );

  const onRemoveField = useCallback(
    (fieldToRemove: Pick<TextRecordField, 'key'>, selectedFields: TextRecordField[] | undefined = undefined) => {
      if (!isEmpty(errors)) {
        setErrors(errors => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [fieldToRemove.key]: _, ...newErrors } = errors;

          return newErrors;
        });
      }
      if (selectedFields) {
        setSelectedFields(selectedFields);
      }
      removeRecordByKey(fieldToRemove.key);

      setValuesMap(values => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [fieldToRemove.key as ENS_RECORDS]: _, ...restRecords } = values?.[name] || {};
        return {
          ...values,
          [name]: restRecords as Records,
        };
      });
    },
    [errors, name, removeRecordByKey, setErrors, setSelectedFields, setValuesMap]
  );

  const onBlurField = useCallback(
    ({ key, value }: { key: string; value: string }) => {
      setValuesMap(values => ({
        ...values,
        [name]: { ...values?.[name], [key]: value },
      }));
      updateRecordByKey(key, value);
    },
    [name, setValuesMap, updateRecordByKey]
  );

  const onChangeField = useCallback(
    ({ key, value }: { key: string; value: string }) => {
      setIsValidating(true);
      const validation = textRecordFields[key as ENS_RECORDS]?.validation;
      if (validation) {
        const { message, validator } = validation;
        const isValid = !value || validator(value);
        isValid
          ? key in errors &&
            setErrors(errors => {
              // omit key from errors
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { [key]: _, ...newErrors } = errors;
              return newErrors;
            })
          : setErrors({ ...errors, [key]: message });
      }
      setIsValidating(false);
      setValuesMap(values => ({
        ...values,
        [name]: { ...values?.[name], [key]: value },
      }));
      updateRecordByKey(key, value);
    },
    [errors, name, setErrors, setIsValidating, setValuesMap, updateRecordByKey]
  );

  const blurFields = useCallback(() => {
    updateRecords(values);
  }, [updateRecords, values]);

  const isEmptyValues = Object.values(values).filter(x => x).length === 0;

  const [isLoading, setIsLoading] = useState(mode === REGISTRATION_MODES.EDIT && (!isSuccess || isEmptyValues));

  useEffect(() => {
    if (mode === REGISTRATION_MODES.EDIT) {
      if (isSuccess || !isEmptyValues) {
        setTimeout(() => setIsLoading(false), 200);
      } else {
        setIsLoading(true);
      }
    }
  }, [mode, isSuccess, isEmptyValues]);

  const clearValues = useCallback(() => {
    setValuesMap({});
  }, [setValuesMap]);

  const empty = useMemo(() => !Object.values(values).some(Boolean), [values]);

  const submit = useCallback(
    async (submitFn: () => Promise<void> | void) => {
      setSubmitting(true);
      try {
        await submitFn();
        // eslint-disable-next-line no-empty
      } catch (err) {}

      setTimeout(() => {
        setSubmitting(false);
      }, 100);
    },
    [setSubmitting]
  );

  return {
    blurFields,
    clearValues,
    disabled,
    errors,
    isEmpty: empty,
    isLoading,
    isSuccess,
    isValidating,
    onAddField,
    onBlurField,
    onChangeField,
    onRemoveField,
    selectedFields,
    setDisabled,
    submit,
    submitting,
    values,
  };
}
