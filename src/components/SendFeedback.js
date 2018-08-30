import { debounce } from "lodash";
import React from "react";
import { Alert, Clipboard } from "react-native";
import Mailer from "react-native-mail";

import { Button } from "../components/buttons";

const FeedbackEmailAddress = "contact+alphafeedback@balance.io";

const handleSendFeedbackError = debounce(
  error =>
    error
      ? Alert.alert(
          "Error launching email client",
          "Would you like to manually copy our feedback email address to your clipboard?",
          [
            {
              text: "Copy email address",
              onPress: () => Clipboard.setString(FeedbackEmailAddress)
            },
            { text: "No thanks", style: "cancel" }
          ]
        )
      : null,
  250
);

const handleSendFeedback = () =>
  Mailer.mail(
    {
      recipients: [FeedbackEmailAddress],
      subject: "📱 Balance Wallet Alpha Feedback"
    },
    handleSendFeedbackError
  );

const SendFeedback = () => (
  <Button onPress={handleSendFeedback}>Send Feedback</Button>
);

export default SendFeedback;
