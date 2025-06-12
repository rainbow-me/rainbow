import { isEmpty } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useENSModifiedRegistration, useENSRegistration } from '.';
import { Records } from '@/entities';
import { deprecatedTextRecordFields, ENS_RECORDS, REGISTRATION_MODES, TextRecordField, textRecordFields } from '@/helpers/ens';
import { 
  useENSRegistrationStore, 
  getENSRegistrationStore
} from '@/state/ensRegistration/ensRegistration';

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

  const errors = useENSRegistrationStore(state => state.errors);
  const submitting = useENSRegistrationStore(state => state.submitting);
  const isValidating = useENSRegistrationStore(state => state.isValidating);
  const disabled = useENSRegistrationStore(state => state.disabled);
  useEffect(() => {
    // If we are in edit mode, we want to disable the "Review" button
    // when there are no changed records.
    // Note: We don't want to do this in create mode as we have the "Skip"
    // button.
    getENSRegistrationStore().setDisabled(mode === REGISTRATION_MODES.EDIT && isEmpty(changedRecords));
  }, [changedRecords, mode]);

  const selectedFields = useENSRegistrationStore(state => state.selectedFields);
  useEffect(() => {
    if (!initializeForm) return;
    // If there are existing records in the global state, then we
    // populate with that.
    if (!isEmpty(defaultRecords)) {
      getENSRegistrationStore().setSelectedFields(
        Object.values(textRecordFields)
          .map(field => (defaultRecords[field.key] !== undefined ? field : undefined))
          .filter(Boolean) as TextRecordField[]
      );
    } else {
      if (defaultFields) {
        getENSRegistrationStore().setSelectedFields(defaultFields);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, defaultRecords]);

  const valuesMap = useENSRegistrationStore(state => state.values);
  const values = useMemo(() => valuesMap[name] || {}, [name, valuesMap]);
  useEffect(
    () => {
      if (!initializeForm) return;
      getENSRegistrationStore().setValues(values => ({
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
      getENSRegistrationStore().setErrors({});
    }
  }, [changedRecords, initializeForm]);

  const onAddField = useCallback(
    (fieldToAdd: TextRecordField, selectedFields: TextRecordField[]) => {
      getENSRegistrationStore().setSelectedFields(selectedFields);
      updateRecordByKey(fieldToAdd.key, '');
    },
    [updateRecordByKey]
  );

  const onRemoveField = useCallback(
    (fieldToRemove: Pick<TextRecordField, 'key'>, selectedFields: TextRecordField[] | undefined = undefined) => {
      if (!isEmpty(errors)) {
        getENSRegistrationStore().setErrors(errors => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [fieldToRemove.key]: _, ...newErrors } = errors;

          return newErrors;
        });
      }
      if (selectedFields) {
        getENSRegistrationStore().setSelectedFields(selectedFields);
      }
      removeRecordByKey(fieldToRemove.key);

      getENSRegistrationStore().setValues(values => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [fieldToRemove.key as ENS_RECORDS]: _, ...restRecords } = values?.[name] || {};
        return {
          ...values,
          [name]: restRecords as Records,
        };
      });
    },
    [errors, name, removeRecordByKey]
  );

  const onBlurField = useCallback(
    ({ key, value }: { key: string; value: string }) => {
      getENSRegistrationStore().setValues(values => ({
        ...values,
        [name]: { ...values?.[name], [key]: value },
      }));
      updateRecordByKey(key, value);
    },
    [name, updateRecordByKey]
  );

  const onChangeField = useCallback(
    ({ key, value }: { key: string; value: string }) => {
      getENSRegistrationStore().setIsValidating(true);
      const validation = textRecordFields[key as ENS_RECORDS]?.validation;
      if (validation) {
        const { message, validator } = validation;
        const isValid = !value || validator(value);
        isValid
          ? key in errors &&
            getENSRegistrationStore().setErrors(errors => {
              // omit key from errors
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { [key]: _, ...newErrors } = errors;
              return newErrors;
            })
          : getENSRegistrationStore().setErrors({ ...errors, [key]: message });
      }
      getENSRegistrationStore().setIsValidating(false);
      getENSRegistrationStore().setValues(values => ({
        ...values,
        [name]: { ...values?.[name], [key]: value },
      }));
      updateRecordByKey(key, value);
    },
    [errors, name, updateRecordByKey]
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
    getENSRegistrationStore().setValues({});
  }, []);

  const empty = useMemo(() => !Object.values(values).some(Boolean), [values]);

  const submit = useCallback(
    async (submitFn: () => Promise<void> | void) => {
      getENSRegistrationStore().setSubmitting(true);
      try {
        await submitFn();
        // eslint-disable-next-line no-empty
      } catch (err) {}

      setTimeout(() => {
        getENSRegistrationStore().setSubmitting(false);
      }, 100);
    },
    []
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
    setDisabled: getENSRegistrationStore().setDisabled,
    submit,
    submitting,
    values,
  };
}

// Deprecated - use useENSRegistrationStore instead
export const valuesAtom = {
  // This is a compatibility shim - the actual store is in @/state/ensRegistration/ensRegistration
};
