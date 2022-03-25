import { isEmpty, omit } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { atom, useRecoilState } from 'recoil';
import { useENSRegistration } from '.';
import { Records } from '@rainbow-me/entities';
import { ENS_RECORDS, textRecordFields } from '@rainbow-me/helpers/ens';

const disabledAtom = atom({
  default: false,
  key: 'ensProfileForm.disabled',
});

const errorsAtom = atom<{ [name: string]: string }>({
  default: {},
  key: 'ensProfileForm.errors',
});

const selectedFieldsAtom = atom({
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

export default function useENSRegistrationForm({
  defaultFields,
  createForm,
}: {
  defaultFields?: any[];
  /** A flag that indicates if a new form should be initialised */
  createForm?: boolean;
} = {}) {
  const {
    name,
    mode,
    changedRecords,
    initialRecords,
    records: allRecords,
    profileQuery,
    removeRecordByKey,
    updateRecordByKey,
    updateRecords,
  } = useENSRegistration();

  // The initial records will be the existing records belonging to the profile in "edit mode",
  // but will be all of the records in "create mode".
  const defaultRecords = useMemo(
    () => (mode === 'edit' ? initialRecords : allRecords),
    [allRecords, initialRecords, mode]
  );

  const dispatch = useDispatch();

  const [errors, setErrors] = useRecoilState(errorsAtom);
  const [submitting, setSubmitting] = useRecoilState(submittingAtom);

  const [disabled, setDisabled] = useRecoilState(disabledAtom);
  useEffect(() => {
    // If we are in edit mode, we want to disable the "Review" button
    // when there are no changed records.
    // Note: We don't want to do this in create mode as we have the "Skip"
    // button.
    setDisabled(mode === 'edit' ? isEmpty(changedRecords) : false);
  }, [changedRecords, disabled, mode, setDisabled]);

  const [selectedFields, setSelectedFields] = useRecoilState(
    selectedFieldsAtom
  );
  useEffect(() => {
    if (createForm) {
      // If there are existing records in the global state, then we
      // populate with that.
      if (!isEmpty(defaultRecords)) {
        setSelectedFields(
          // @ts-ignore
          Object.keys(defaultRecords)
            // @ts-ignore
            .map(key => textRecordFields[key])
            .filter(x => x)
        );
      } else {
        if (defaultFields) {
          setSelectedFields(defaultFields as any);
        }
      }
    }
  }, [name, isEmpty(defaultRecords)]); // eslint-disable-line react-hooks/exhaustive-deps

  const [valuesMap, setValuesMap] = useRecoilState(valuesAtom);
  const values = useMemo(() => valuesMap[name] || {}, [name, valuesMap]);
  useEffect(
    () => {
      if (createForm) {
        setValuesMap(values => ({ ...values, [name]: defaultRecords }));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name, isEmpty(defaultRecords)]
  );

  // Set initial records in redux depending on user input (defaultFields)
  useEffect(() => {
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
  }, [isEmpty(defaultRecords), dispatch, selectedFields, updateRecords]);

  const onAddField = useCallback(
    (fieldToAdd, selectedFields) => {
      setSelectedFields(selectedFields);
      updateRecordByKey(fieldToAdd.key, '');
    },
    [setSelectedFields, updateRecordByKey]
  );

  const onRemoveField = useCallback(
    (fieldToRemove, selectedFields) => {
      if (!isEmpty(errors)) {
        setErrors(errors => {
          const newErrors = omit(errors, fieldToRemove.key);
          return newErrors;
        });
      }
      setSelectedFields(selectedFields);
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

  const [isLoading, setIsLoading] = useState(mode === 'edit');
  useEffect(() => {
    if (!profileQuery.isLoading) {
      setTimeout(() => setIsLoading(false), 200);
    } else {
      setIsLoading(true);
    }
  }, [profileQuery.isLoading]);

  const empty = useMemo(() => !Object.values(values).some(Boolean), [values]);

  const submit = useCallback(
    async submitFn => {
      const errors = Object.entries(textRecordFields).reduce(
        (currentErrors, [key, { validations }]) => {
          const { value: regex, message } = validations?.onSubmit?.match || {};
          const value = values[key as ENS_RECORDS];
          if (regex && value && !value.match(regex)) {
            return {
              ...currentErrors,
              [key]: message,
            };
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
    disabled,
    errors,
    isEmpty: empty,
    isLoading,
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
