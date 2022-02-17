import { isEmpty, omit } from 'lodash';
import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { atom, useRecoilState } from 'recoil';
import { useAccountSettings, useENSProfile } from '.';
import { Records } from '@rainbow-me/entities';
import { textRecordFields } from '@rainbow-me/helpers/ens';
import {
  removeRecordByKey,
  updateRecordByKey,
  updateRecords,
} from '@rainbow-me/redux/ensRegistration';

const selectedFieldsAtom = atom({
  default: [],
  key: 'ensProfileForm.selectedFields',
});

const valuesAtom = atom({
  default: {},
  key: 'ensProfileForm.values',
});

export default function useENSProfileForm({
  defaultFields,
}: {
  defaultFields?: any[];
} = {}) {
  const { accountAddress } = useAccountSettings();
  const { name, records } = useENSProfile();

  const dispatch = useDispatch();

  const [selectedFields, setSelectedFields] = useRecoilState(
    selectedFieldsAtom
  );
  useEffect(() => {
    // If there are existing records in the global state, then we
    // populate with that.
    if (!isEmpty(records)) {
      // @ts-ignore
      setSelectedFields(Object.keys(records).map(key => textRecordFields[key]));
    } else {
      if (defaultFields) {
        setSelectedFields(defaultFields as any);
      }
    }
  }, [name]); // eslint-disable-line react-hooks/exhaustive-deps

  const [values, setValues] = useRecoilState(valuesAtom);
  useEffect(() => setValues(records), [name]); // eslint-disable-line react-hooks/exhaustive-deps

  // Set initial records in redux depending on user input (defaultFields)
  useEffect(() => {
    if (isEmpty(records) && defaultFields) {
      const records = defaultFields.reduce((records, field) => {
        return {
          ...records,
          [field.key]: '',
        };
      }, {});
      dispatch(updateRecords(accountAddress, records));
    }
  }, [accountAddress, defaultFields, dispatch, records, selectedFields]);

  const onAddField = useCallback(
    (fieldToAdd, selectedFields) => {
      setSelectedFields(selectedFields);
      dispatch(updateRecordByKey(accountAddress, fieldToAdd.key, ''));
    },
    [accountAddress, dispatch, setSelectedFields]
  );

  const onRemoveField = useCallback(
    (fieldToRemove, selectedFields) => {
      setSelectedFields(selectedFields);
      dispatch(removeRecordByKey(accountAddress, fieldToRemove.key));
      setValues(values => omit(values, fieldToRemove.key) as Records);
    },
    [accountAddress, dispatch, setSelectedFields, setValues]
  );

  const onBlurField = useCallback(
    ({ key, value }) => {
      dispatch(updateRecordByKey(accountAddress, key, value));
    },
    [accountAddress, dispatch]
  );

  const onChangeField = useCallback(
    ({ key, value }) => {
      setValues(values => ({ ...values, [key]: value }));
    },
    [setValues]
  );

  const empty = useMemo(() => !Object.values(values).some(Boolean), [values]);

  return {
    isEmpty: empty,
    onAddField,
    onBlurField,
    onChangeField,
    onRemoveField,
    selectedFields,
    values,
  };
}
