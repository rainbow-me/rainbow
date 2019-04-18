import { debounce } from 'lodash';
import { Clipboard } from 'react-native';
import Mailer from 'react-native-mail';
import { withHandlers } from 'recompact';
import { Alert } from '../components/alerts';

const FeedbackEmailAddress = 'support@rainbow.me';

const setClipboardToFeedbackEmail = () => Clipboard.setString(FeedbackEmailAddress);

const FeedbackErrorAlert = () => Alert({
  buttons: [{
    onPress: setClipboardToFeedbackEmail,
    text: 'Copy email address',
  }, {
    style: 'cancel',
    text: 'No thanks',
  }],
  message: 'Would you like to manually copy our feedback email address to your clipboard?',
  title: 'Error launching email client',
});

const handleMailError = debounce(
  error => (error ? FeedbackErrorAlert() : null),
  250,
);

const feedbackEmailOptions = {
  recipients: [FeedbackEmailAddress],
  subject: '🌈️ Rainbow Feedback',
};

const withSendFeedback = ComponentToWrap => withHandlers({
  onSendFeedback: () => () => Mailer.mail(feedbackEmailOptions, handleMailError),
})(ComponentToWrap);

export default withSendFeedback;
