package com.balancewallet;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.tradle.react.UdpSocketsModule;
import com.peel.react.TcpSocketsModule;
import com.peel.react.rnos.RNOSModule;
import com.reactnativenavigation.NavigationReactPackage;
import com.RNRSA.RNRSAPackage;
import org.reactnative.camera.RNCameraPackage;
import com.evollu.react.fcm.FIRMessagingPackage;
import com.bitgo.randombytes.RandomBytesPackage;
import com.oblador.keychain.KeychainPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new UdpSocketsModule(),
            new TcpSocketsModule(),
            new RNOSModule(),
            new NavigationReactPackage(),
            new RNRSAPackage(),
            new RNCameraPackage(),
            new FIRMessagingPackage(),
            new RandomBytesPackage(),
            new KeychainPackage()
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
