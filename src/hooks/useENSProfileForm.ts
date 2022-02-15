import { isEmpty } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { textRecordFields } from '@rainbow-me/helpers/ens';
import {
  ensRegistrationRemoveRecordByKey,
  ensRegistrationUpdateRecordByKey,
  ensRegistrationUpdateRecords,
} from '@rainbow-me/redux/ensRegistration';
import { AppState } from '@rainbow-me/redux/store';

export default function useENSProfileForm({
  defaultFields,
}: {
  defaultFields: any[];
}) {
  const records = useSelector(
    ({ ensRegistration }: AppState) => ensRegistration.records
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
      dispatch(ensRegistrationUpdateRecords(records));
    }
  }, [defaultFields, dispatch, records, selectedFields]);

  const onAddField = useCallback(
    (fieldToAdd, selectedFields) => {
      setSelectedFields(selectedFields);
      dispatch(ensRegistrationUpdateRecordByKey(fieldToAdd.key, ''));
    },
    [dispatch]
  );

  const onRemoveField = useCallback(
    (fieldToRemove, selectedFields) => {
      setSelectedFields(selectedFields);
      dispatch(ensRegistrationRemoveRecordByKey(fieldToRemove.key));
      setValues(values => ({ ...values, [fieldToRemove.key]: '' }));
    },
    [dispatch]
  );

  const onBlurField = useCallback(
    ({ key, value }) => {
      dispatch(ensRegistrationUpdateRecordByKey(key, value));
    },
    [dispatch]
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
