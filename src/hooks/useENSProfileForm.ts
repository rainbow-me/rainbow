import { isEmpty, omit } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useAccountSettings, useENSProfile } from '.';
import { Records } from '@rainbow-me/entities';
import { textRecordFields } from '@rainbow-me/helpers/ens';
import {
  removeRecordByKey,
  updateRecordByKey,
  updateRecords,
} from '@rainbow-me/redux/ensRegistration';

export default function useENSProfileForm({
  defaultFields,
}: {
  defaultFields: any[];
}) {
  const { accountAddress } = useAccountSettings();
  const { name, records } = useENSProfile();

  const dispatch = useDispatch();

  const [selectedFields, setSelectedFields] = useState(defaultFields);
  useEffect(() => {
    // If there are existing records in the global state, then we
    // populate with that.
    if (!isEmpty(records)) {
      // @ts-ignore
      setSelectedFields(Object.keys(records).map(key => textRecordFields[key]));
    } else {
      setSelectedFields(defaultFields);
    }
  }, [name]); // eslint-disable-line react-hooks/exhaustive-deps

  const [values, setValues] = useState(records);
  useEffect(() => setValues(records), [name]); // eslint-disable-line react-hooks/exhaustive-deps

  // Set initial records in redux depending on user input (defaultFields)
  useEffect(() => {
    if (isEmpty(records)) {
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
    [accountAddress, dispatch]
  );

  const onRemoveField = useCallback(
    (fieldToRemove, selectedFields) => {
      setSelectedFields(selectedFields);
      dispatch(removeRecordByKey(accountAddress, fieldToRemove.key));
      setValues(values => omit(values, fieldToRemove.key) as Records);
    },
    [accountAddress, dispatch]
  );

  const onBlurField = useCallback(
    ({ key, value }) => {
      dispatch(updateRecordByKey(accountAddress, key, value));
    },
    [accountAddress, dispatch]
  );

  const onChangeField = useCallback(({ key, value }) => {
    setValues(values => ({ ...values, [key]: value }));
  }, []);

  const formIsEmpty = Object.values(values).join('');

  return {
    formIsEmpty,
    onAddField,
    onBlurField,
    onChangeField,
    onRemoveField,
    selectedFields,
    values,
  };
}
