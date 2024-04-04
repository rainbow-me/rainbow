import { useState, useEffect } from 'react';
import * as lang from '@/languages';
import { isCloudBackupPasswordValid, cloudBackupPasswordMinLength } from '@/handlers/cloudBackup';
import { useForegroundColor } from '@/design-system';
import { useTheme } from '@/theme';

export const usePasswordValidation = (password: string, confirmPassword: string) => {
  const { colors } = useTheme();
  const [validPassword, setValidPassword] = useState(false);
  const [label, setLabel] = useState('');
  const [labelColor, setLabelColor] = useState('');
  const labelDefaultColor = useForegroundColor('labelQuaternary');

  useEffect(() => {
    let passwordIsValid = false;
    let newLabel = '';
    setLabelColor(labelDefaultColor);

    if (password === confirmPassword && isCloudBackupPasswordValid(password)) {
      passwordIsValid = true;
    } else if (password.length < cloudBackupPasswordMinLength) {
      newLabel = lang.t('back_up.cloud.password.minimum_characters', {
        minimumLength: cloudBackupPasswordMinLength,
      });
      passwordIsValid = false;
    } else if (
      isCloudBackupPasswordValid(password) &&
      isCloudBackupPasswordValid(confirmPassword) &&
      confirmPassword.length >= password.length &&
      password !== confirmPassword
    ) {
      newLabel = lang.t(lang.l.back_up.cloud.password.passwords_dont_match);
      setLabelColor(colors.red);
      passwordIsValid = false;
    }

    setValidPassword(passwordIsValid);
    setLabel(newLabel);
  }, [password, confirmPassword, colors, labelDefaultColor]);

  return { validPassword, label, labelColor };
};
