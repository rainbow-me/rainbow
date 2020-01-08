package me.rainbow;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.RNTextInputMask.RNTextInputMaskPackage;
import com.th3rdwave.safeareacontext.SafeAreaContextPackage;
import org.reactnative.maskedview.RNCMaskedViewPackage;
import com.RNTextInputMask.RNTextInputMaskPackage;
import com.segment.analytics.reactnative.core.RNAnalyticsPackage;
import react-native-tcp.TcpSocketsModule;
import com.cmcewen.blurview.BlurViewPackage;
import com.reactnativecommunity.netinfo.NetInfoPackage;
import org.reactnative.camera.RNCameraPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.swmansion.rnscreens.RNScreensPackage;
import com.apsl.versionnumber.RNVersionNumberPackage;
import de.bonify.reactnativepiwik.PiwikPackage;
import com.cmcewen.blurview.BlurViewPackage;
import com.reactcommunity.rnlanguages.RNLanguagesPackage;
import com.swmansion.reanimated.ReanimatedPackage;
import com.microsoft.codepush.react.CodePush;
import com.reactlibrary.RNReactNativeHapticFeedbackPackage;
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
            new RNTextInputMaskPackage(),
            new SafeAreaContextPackage(),
            new RNCMaskedViewPackage(),
            new RNTextInputMaskPackage(),
            new RNAnalyticsPackage(),
            new BlurViewPackage(),
            new NetInfoPackage(),
            new RNCameraPackage(),
            new RNDeviceInfo(),
            new RNScreensPackage(),
            new RNVersionNumberPackage(),
            new PiwikPackage(),
            new BlurViewPackage(),
            new RNLanguagesPackage(),
            new ReanimatedPackage(),
            new CodePush(BuildConfig.CODEPUSH_KEY, getApplicationContext(), BuildConfig.DEBUG),
            new TcpSocketsModule()
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
