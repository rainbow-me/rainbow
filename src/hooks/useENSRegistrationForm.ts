import { isEmpty, omit } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { atom, useRecoilState } from 'recoil';
import { useENSRegistration } from '.';
import { Records } from '@rainbow-me/entities';
import { textRecordFields } from '@rainbow-me/helpers/ens';

const disabledAtom = atom({
  default: false,
  key: 'ensProfileForm.disabled',
});

const selectedFieldsAtom = atom({
  default: [],
  key: 'ensProfileForm.selectedFields',
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
    existingRecords,
    records: allRecords,
    recordsQuery,
    removeRecordByKey,
    updateRecordByKey,
    updateRecords,
  } = useENSRegistration();

  // The initial records will be the existing records belonging to the profile in "edit mode",
  // but will be all of the records in "create mode".
  const initialRecords = useMemo(
    () => (mode === 'edit' ? existingRecords : allRecords),
    [allRecords, existingRecords, mode]
  );

  const dispatch = useDispatch();

  const [disabled, setDisabled] = useRecoilState(disabledAtom);
  useEffect(() => {
    // If we are in edit mode, we want to disable the "Review" button
    // when there are no changed records.
    // Note: We don't want to do this in create mode as we have the "Skip"
    // button.
    if (mode === 'edit') {
      setDisabled(isEmpty(changedRecords));
    }
  }, [changedRecords, disabled, mode, setDisabled]);

  const [selectedFields, setSelectedFields] = useRecoilState(
    selectedFieldsAtom
  );
  useEffect(() => {
    if (createForm) {
      // If there are existing records in the global state, then we
      // populate with that.
      if (!isEmpty(initialRecords)) {
        setSelectedFields(
          // @ts-ignore
          Object.keys(initialRecords)
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
  }, [name, isEmpty(initialRecords)]); // eslint-disable-line react-hooks/exhaustive-deps

  const [valuesMap, setValuesMap] = useRecoilState(valuesAtom);
  const values = useMemo(() => valuesMap[name] || {}, [name, valuesMap]);
  useEffect(
    () => {
      if (createForm) {
        setValuesMap(values => ({ ...values, [name]: initialRecords }));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name, isEmpty(initialRecords)]
  );

  // Set initial records in redux depending on user input (defaultFields)
  useEffect(() => {
    if (defaultFields && isEmpty(initialRecords)) {
      const records = defaultFields.reduce((records, field) => {
        return {
          ...records,
          [field.key]: '',
        };
      }, {});
      updateRecords(records);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    defaultFields,
    dispatch,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    isEmpty(initialRecords),
    selectedFields,
    updateRecords,
  ]);

  const onAddField = useCallback(
    (fieldToAdd, selectedFields) => {
      setSelectedFields(selectedFields);
      updateRecordByKey(fieldToAdd.key, '');
    },
    [setSelectedFields, updateRecordByKey]
  );

  const onRemoveField = useCallback(
    (fieldToRemove, selectedFields) => {
      setSelectedFields(selectedFields);
      removeRecordByKey(fieldToRemove.key);
      setValuesMap(values => ({
        ...values,
        [name]: omit(values?.[name] || {}, fieldToRemove.key) as Records,
      }));
    },
    [name, removeRecordByKey, setSelectedFields, setValuesMap]
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
      setValuesMap(values => ({
        ...values,
        [name]: { ...values?.[name], [key]: value },
      }));
    },
    [name, setValuesMap]
  );

  const blurFields = useCallback(() => {
    updateRecords(values);
  }, [updateRecords, values]);

  const [isLoading, setIsLoading] = useState(recordsQuery.isLoading);
  useEffect(() => {
    if (!recordsQuery.isLoading) {
      setTimeout(() => setIsLoading(false), 200);
    } else {
      setIsLoading(true);
    }
  }, [recordsQuery.isLoading]);

  const empty = useMemo(() => !Object.values(values).some(Boolean), [values]);

  return {
    blurFields,
    disabled,
    isEmpty: empty,
    isLoading,
    onAddField,
    onBlurField,
    onChangeField,
    onRemoveField,
    selectedFields,
    setDisabled,
    values,
  };
}
