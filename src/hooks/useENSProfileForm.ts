import { isEmpty } from 'lodash';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { atom, useRecoilState } from 'recoil';
import { textRecordFields } from '@rainbow-me/helpers/ens';
import {
  ensRegistrationRemoveRecordByKey,
  ensRegistrationUpdateRecordByKey,
  ensRegistrationUpdateRecords,
} from '@rainbow-me/redux/ensRegistration';
import { AppState } from '@rainbow-me/redux/store';

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
  const records = useSelector(
    ({ ensRegistration }: AppState) => ensRegistration.records
  );
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [values, setValues] = useRecoilState(valuesAtom);
  useEffect(() => setValues(records), [records, setValues]);

  // Set initial records in redux depending on user input (defaultFields)
  useEffect(() => {
    if (isEmpty(records) && defaultFields) {
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
    [dispatch, setSelectedFields]
  );

  const onRemoveField = useCallback(
    (fieldToRemove, selectedFields) => {
      setSelectedFields(selectedFields);
      dispatch(ensRegistrationRemoveRecordByKey(fieldToRemove.key));
      setValues(values => ({ ...values, [fieldToRemove.key]: '' }));
    },
    [dispatch, setSelectedFields, setValues]
  );

  const onBlurField = useCallback(
    ({ key, value }) => {
      dispatch(ensRegistrationUpdateRecordByKey(key, value));
    },
    [dispatch]
  );

  const onChangeField = useCallback(
    ({ key, value }) => {
      setValues(values => ({ ...values, [key]: value }));
    },
    [setValues]
  );

  return {
    onAddField,
    onBlurField,
    onChangeField,
    onRemoveField,
    selectedFields,
    values,
  };
}
