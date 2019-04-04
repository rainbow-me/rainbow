package me.rainbow;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.swmansion.rnscreens.RNScreensPackage;
import com.apsl.versionnumber.RNVersionNumberPackage;
import de.bonify.reactnativepiwik.PiwikPackage;
import com.dylanvann.fastimage.FastImageViewPackage;
import com.cmcewen.blurview.BlurViewPackage;
import com.reactcommunity.rnlanguages.RNLanguagesPackage;
import com.swmansion.reanimated.ReanimatedPackage;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import io.invertase.firebase.RNFirebasePackage;
import com.microsoft.codepush.react.CodePush;
import com.reactlibrary.RNReactNativeHapticFeedbackPackage;
import com.tradle.react.UdpSocketsModule;
import com.rnfingerprint.FingerprintAuthPackage;
import com.peel.react.TcpSocketsModule;
import com.horcrux.svg.SvgPackage;
import org.devio.rn.splashscreen.SplashScreenReactPackage;
import com.bitgo.randombytes.RandomBytesPackage;
import com.surajit.rnrg.RNRadialGradientPackage;
import com.peel.react.rnos.RNOSModule;
import com.chirag.RNMail.RNMail;
import com.BV.LinearGradient.LinearGradientPackage;
import com.oblador.keychain.KeychainPackage;
import org.reactnative.camera.RNCameraPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {

        @Override
        protected String getJSBundleFile() {
        return CodePush.getJSBundleFile();
        }

    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new RNDeviceInfo(),
            new RNScreensPackage(),
            new RNVersionNumberPackage(),
            new PiwikPackage(),
            new FastImageViewPackage(),
            new BlurViewPackage(),
            new RNLanguagesPackage(),
            new ReanimatedPackage(),
            new RNGestureHandlerPackage(),
            new RNFirebasePackage(),
            new CodePush(BuildConfig.CODEPUSH_KEY, getApplicationContext(), BuildConfig.DEBUG),
            new RNReactNativeHapticFeedbackPackage(),
            new UdpSocketsModule(),
            new FingerprintAuthPackage(),
            new TcpSocketsModule(),
            new SvgPackage(),
            new SplashScreenReactPackage(),
            new RandomBytesPackage(),
            new RNRadialGradientPackage(),
            new RNOSModule(),
            new RNMail(),
            new LinearGradientPackage(),
            new KeychainPackage(),
            new RNCameraPackage()
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
