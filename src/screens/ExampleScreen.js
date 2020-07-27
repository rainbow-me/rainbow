import React, { PureComponent } from 'react';
import { Text } from 'react-native';
import RNCloudFs from 'react-native-cloud-fs';
import SplashScreen from 'react-native-splash-screen';
import { ButtonPressAnimation } from '../components/animations';
import { Centered, Column, Page } from '../components/layout';
import {
  deleteAllBackups,
  encryptAndSaveDataToCloud,
  getDataFromCloud,
  REMOTE_BACKUP_WALLET_DIR,
} from '../handlers/cloudBackup';
import { position } from '@rainbow-me/styles';

class ExampleScreen extends PureComponent {
  componentDidMount() {
    console.log('Example Screen');
    SplashScreen.hide();
  }

  readFile = async () => {
    try {
      const data = await getDataFromCloud('123', 'test.json');
      console.log('BACKUP ====> GOT DATA?', data);
    } catch (e) {
      console.log('BACKUP ====> ERROR READING FILE', e);
    }
  };

  listFiles = async () => {
    try {
      await RNCloudFs.loginIfNeeded();
      const backups = await RNCloudFs.listFiles({
        scope: 'hidden',
        targetPath: REMOTE_BACKUP_WALLET_DIR,
      });
      console.log('BACKUP ====> GOT FILES');
      backups.files.forEach(async file => {
        console.log(file);
      });
    } catch (e) {
      console.log('BACKUP ====> ERROR LISTING FILES', e);
    }
  };

  onCreateFile = async () => {
    try {
      const success = await encryptAndSaveDataToCloud(
        { something: Date.now(), test: true },
        '123',
        'test.json'
      );
      console.log('BACKUP ====> FILE CREATED?', success);
    } catch (e) {
      console.log('BACKUP ====> ERROR CREATING FILE', e);
    }
  };

  onDeleteFile = async () => {
    try {
      const success = await deleteAllBackups();
      console.log('BACKUP ====> FILES DELETED?', success);
    } catch (e) {
      console.log('BACKUP ====> ERROR DELETING FILES', e);
    }
  };

  render = () => (
    <Page
      {...position.centeredAsObject}
      {...position.sizeAsObject('100%')}
      color="#EAEAEA"
      flex={1}
    >
      <Centered width="100%">
        <Column>
          <ButtonPressAnimation onPress={this.onCreateFile}>
            <Text color="red">Create file</Text>
          </ButtonPressAnimation>
          <ButtonPressAnimation onPress={this.listFiles}>
            <Text color="blue">List File</Text>
          </ButtonPressAnimation>
          <ButtonPressAnimation onPress={this.readFile}>
            <Text color="blue">Read file</Text>
          </ButtonPressAnimation>
          <ButtonPressAnimation onPress={this.onDeleteFile}>
            <Text color="blue">Delete file</Text>
          </ButtonPressAnimation>
        </Column>
      </Centered>
    </Page>
  );
}

export default ExampleScreen;
