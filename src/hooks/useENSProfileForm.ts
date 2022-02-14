import { isEmpty } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAccountSettings } from '.';
import { textRecordFields } from '@rainbow-me/helpers/ens';
import {
  removeRecordByKey,
  updateRecordByKey,
  updateRecords,
} from '@rainbow-me/redux/ensRegistration';
import { AppState } from '@rainbow-me/redux/store';

export default function useENSProfileForm({
  defaultFields,
}: {
  defaultFields: any[];
}) {
  const { accountAddress } = useAccountSettings();
  // TODO
  const name = 'esv.eth';
  const { records } = useSelector(
    ({ ensRegistration }: AppState) =>
      ensRegistration?.[accountAddress]?.[name] || { records: [] }
  );
  const dispatch = useDispatch();
  const [selectedFields, setSelectedFields] = useState(() => {
    // If there are existing records in the global state, then we
    // populate with that.
    if (!isEmpty(records)) {
      // @ts-ignore
      return Object.keys(records).map(key => textRecordFields[key]);
    }

    // Otherwise, just populate with the default fields.
    return defaultFields;
  });

  const [values, setValues] = useState(records);

  // Set initial records in redux depending on user input (defaultFields)
  useEffect(() => {
    if (isEmpty(records)) {
      const records = defaultFields.reduce((records, field) => {
        return {
          ...records,
          [field.key]: '',
        };
      }, {});
      dispatch(updateRecords(accountAddress, name, records));
    }
  }, [accountAddress, defaultFields, dispatch, records, selectedFields]);

  const onAddField = useCallback(
    (fieldToAdd, selectedFields) => {
      setSelectedFields(selectedFields);
      dispatch(updateRecordByKey(accountAddress, name, fieldToAdd.key, ''));
    },
    [accountAddress, dispatch]
  );

  const onRemoveField = useCallback(
    (fieldToRemove, selectedFields) => {
      setSelectedFields(selectedFields);
      dispatch(removeRecordByKey(accountAddress, name, fieldToRemove.key));
      setValues(values => ({ ...values, [fieldToRemove.key]: '' }));
    },
    [accountAddress, dispatch]
  );

  const onBlurField = useCallback(
    ({ key, value }) => {
      dispatch(updateRecordByKey(accountAddress, name, key, value));
    },
    [accountAddress, dispatch]
  );

  const onChangeField = useCallback(({ key, value }) => {
    setValues(values => ({ ...values, [key]: value }));
  }, []);

  return {
    onAddField,
    onBlurField,
    onChangeField,
    onRemoveField,
    selectedFields,
    values,
  };
}
