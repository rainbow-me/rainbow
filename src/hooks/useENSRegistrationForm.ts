import { isEmpty, omit } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { atom, useRecoilState } from 'recoil';
import { useENSModifiedRegistration, useENSRegistration } from '.';
import { Records } from '@rainbow-me/entities';
import {
  ENS_RECORDS,
  REGISTRATION_MODES,
  TextRecordField,
  textRecordFields,
} from '@rainbow-me/helpers/ens';

const disabledAtom = atom({
  default: false,
  key: 'ensProfileForm.disabled',
});

const errorsAtom = atom<{ [name: string]: string }>({
  default: {},
  key: 'ensProfileForm.errors',
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
  [ENS_RECORDS.displayName]: '',
  [ENS_RECORDS.description]: '',
  [ENS_RECORDS.url]: '',
  [ENS_RECORDS.twitter]: '',
};

const cleanFormRecords = (initialRecords: Records) => {
  // delete these to show an empty form if the user only have one of these set
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { ETH, avatar, cover, ...cleanFormRecords } = initialRecords;
  // if ENS has some records, only show those
  if (Object.keys(cleanFormRecords).length) return initialRecords;
  return { ...defaultInitialRecords, ...initialRecords };
};

export default function useENSRegistrationForm({
  defaultFields,
  initializeForm,
}: {
  defaultFields?: TextRecordField[];
  /** A flag that indicates if a new form should be initialised */
  initializeForm?: boolean;
} = {}) {
  const {
    name,
    mode,
    initialRecords,
    records: allRecords,
    removeRecordByKey,
    updateRecordByKey,
    updateRecords,
  } = useENSRegistration();
  const { changedRecords, profileQuery } = useENSModifiedRegistration();

  // The initial records will be the existing records belonging to the profile in "edit mode",
  // but will be all of the records in "create mode".
  const defaultRecords = useMemo(() => {
    return mode === REGISTRATION_MODES.EDIT
      ? cleanFormRecords(initialRecords)
      : allRecords;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRecords, mode]);

  const [errors, setErrors] = useRecoilState(errorsAtom);
  const [submitting, setSubmitting] = useRecoilState(submittingAtom);

  const [disabled, setDisabled] = useRecoilState(disabledAtom);
  useEffect(() => {
    // If we are in edit mode, we want to disable the "Review" button
    // when there are no changed records.
    // Note: We don't want to do this in create mode as we have the "Skip"
    // button.
    setDisabled(
      mode === REGISTRATION_MODES.EDIT ? isEmpty(changedRecords) : false
    );
  }, [changedRecords, disabled, mode, setDisabled]);

  const [selectedFields, setSelectedFields] = useRecoilState(
    selectedFieldsAtom
  );
  useEffect(() => {
    if (!initializeForm) return;
    // If there are existing records in the global state, then we
    // populate with that.
    if (!isEmpty(defaultRecords)) {
      setSelectedFields(
        // @ts-ignore
        Object.keys(defaultRecords)
          // @ts-ignore
          .map(key => textRecordFields[key])
          .filter(Boolean)
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
    } else if (mode === REGISTRATION_MODES.EDIT && !isEmpty(defaultRecords)) {
      updateRecords(defaultRecords);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmpty(defaultRecords), updateRecords]);

  const onAddField = useCallback(
    (fieldToAdd, selectedFields) => {
      setSelectedFields(selectedFields);
      updateRecordByKey(fieldToAdd.key, '');
    },
    [setSelectedFields, updateRecordByKey]
  );

  const onRemoveField = useCallback(
    (fieldToRemove, selectedFields = undefined) => {
      if (!isEmpty(errors)) {
        setErrors(errors => {
          const newErrors = omit(errors, fieldToRemove.key);
          return newErrors;
        });
      }
      if (selectedFields) {
        setSelectedFields(selectedFields);
      }
      removeRecordByKey(fieldToRemove.key);
      setValuesMap(values => ({
        ...values,
        [name]: omit(values?.[name] || {}, fieldToRemove.key) as Records,
      }));
    },
    [
      errors,
      name,
      removeRecordByKey,
      setErrors,
      setSelectedFields,
      setValuesMap,
    ]
  );

  const onBlurField = useCallback(
    ({ key, value }) => {
      setValuesMap(values => ({
        ...values,
        [name]: { ...values?.[name], [key]: value },
      }));
      updateRecordByKey(key, value);
    },
    [name, setValuesMap, updateRecordByKey]
  );

  const onChangeField = useCallback(
    ({ key, value }) => {
      if (!isEmpty(errors)) {
        setErrors(errors => {
          const newErrors = omit(errors, key);
          return newErrors;
        });
      }

      setValuesMap(values => ({
        ...values,
        [name]: { ...values?.[name], [key]: value },
      }));
      updateRecordByKey(key, value);
    },
    [errors, name, setErrors, setValuesMap, updateRecordByKey]
  );

  const blurFields = useCallback(() => {
    updateRecords(values);
  }, [updateRecords, values]);

  const [isLoading, setIsLoading] = useState(
    mode === REGISTRATION_MODES.EDIT &&
      (!profileQuery.isSuccess || isEmpty(values))
  );

  useEffect(() => {
    if (mode === REGISTRATION_MODES.EDIT) {
      if (profileQuery.isSuccess || !isEmpty(values)) {
        setTimeout(() => setIsLoading(false), 200);
      } else {
        setIsLoading(true);
      }
    }
  }, [mode, profileQuery.isSuccess, values]);

  const clearValues = useCallback(() => {
    setValuesMap({});
  }, [setValuesMap]);

  const empty = useMemo(() => !Object.values(values).some(Boolean), [values]);

  const submit = useCallback(
    async submitFn => {
      const errors = Object.entries(textRecordFields).reduce(
        (currentErrors, [key, { validations }]) => {
          const value = values[key as ENS_RECORDS];
          if (validations?.onSubmit?.match) {
            const { value: regex, message } =
              validations?.onSubmit?.match || {};
            if (regex && value && !value.match(regex)) {
              return {
                ...currentErrors,
                [key]: message,
              };
            }
          }
          if (validations?.onSubmit?.validate) {
            const { callback, message } = validations?.onSubmit?.validate || {};
            if (value && !callback(value)) {
              return {
                ...currentErrors,
                [key]: message,
              };
            }
          }
          return currentErrors;
        },
        {}
      );
      setErrors(errors);

      setSubmitting(true);
      if (isEmpty(errors)) {
        try {
          await submitFn();
          // eslint-disable-next-line no-empty
        } catch (err) {}
      }
      setTimeout(() => {
        setSubmitting(false);
      }, 100);
    },
    [setErrors, setSubmitting, values]
  );

  return {
    blurFields,
    clearValues,
    disabled,
    errors,
    isEmpty: empty,
    isLoading,
    onAddField,
    onBlurField,
    onChangeField,
    onRemoveField,
    profileQuery,
    selectedFields,
    setDisabled,
    submit,
    submitting,
    values,
  };
}
