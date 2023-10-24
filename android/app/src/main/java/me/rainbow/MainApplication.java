package me.rainbow;

import android.app.Application;
import android.content.Context;
import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.ReactInstanceManager;
import com.facebook.soloader.SoLoader;
import com.oblador.keychain.KeychainModuleBuilder;
import com.oblador.keychain.KeychainPackage;
import java.util.List;
import io.branch.rnbranch.RNBranchModule;
import me.rainbow.NativeModules.Haptics.RNHapticsPackage;
import me.rainbow.NativeModules.Haptics.RNRainbowHapticsModule;
import me.rainbow.NativeModules.Internals.InternalPackage;
import me.rainbow.NativeModules.RNBip39.RNBip39Package;
import me.rainbow.NativeModules.RNBackHandler.RNBackHandlerPackage;
import me.rainbow.NativeModules.RNReview.RNReviewPackage;
import me.rainbow.NativeModules.RNStartTime.RNStartTimePackage;
import me.rainbow.NativeModules.RNTextAnimatorPackage.RNTextAnimatorPackage;
import me.rainbow.NativeModules.RNZoomableButton.RNZoomableButtonPackage;
import com.microsoft.codepush.react.CodePush;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactNativeHost;
import me.rainbow.BuildConfig;
import java.lang.reflect.InvocationTargetException;



public class MainApplication extends Application implements ReactApplication {
    private static final long START_MARK = System.currentTimeMillis();
      private static Context context;

    private final ReactNativeHost mReactNativeHost =
      new DefaultReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
          return BuildConfig.DEBUG;
        }

        @Override
        protected String getJSBundleFile() {
          return CodePush.getJSBundleFile();
        }

        @Override
        protected List<ReactPackage> getPackages() {
          @SuppressWarnings("UnnecessaryLocalVariable")
          List<ReactPackage> packages = new PackageList(this).getPackages();
          // Packages that cannot be autolinked yet can be added manually here, for example:
          packages.add(new RNBip39Package());
          packages.add(new RNReviewPackage());
          packages.add(new RNBackHandlerPackage());
          packages.add(new RNTextAnimatorPackage());
          packages.add(new RNZoomableButtonPackage());
          packages.add(new InternalPackage());
          packages.add(new KeychainPackage(new KeychainModuleBuilder().withoutWarmUp()));
          packages.add(new RNStartTimePackage(MainApplication.START_MARK));
          packages.add(new RNHapticsPackage());


            return packages;
        }

        @Override
        protected String getJSMainModuleName() {
          return "index";
        }


        @Override
        protected boolean isNewArchEnabled() {
	          return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
	        }
	
	        @Override
	        protected Boolean isHermesEnabled() {
	          return BuildConfig.IS_HERMES_ENABLED;
	        }
      };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    context = this;
    SoLoader.init(this, /* native exopackage */ false);
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      DefaultNewArchitectureEntryPoint.load();
    }	
    // Branch logging for debugging
    RNBranchModule.enableLogging();
    
    RNBranchModule.getAutoInstance(this);
    initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
  }

   public static Context getAppContext() {
        return MainApplication.context;
    }

 /**
  * Loads Flipper in React Native templates. Call this in the onCreate method with something like
  * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
  *
  * @param context
  * @param reactInstanceManager
  */
  private static void initializeFlipper(Context context,
                                       ReactInstanceManager reactInstanceManager) {
    if (BuildConfig.DEBUG) {
      try {
        /*
         We use reflection here to pick up the class that initializes Flipper,
        since Flipper library is not available in release mode
        */
        Class<?> aClass = Class.forName("me.rainbow.ReactNativeFlipper");
        aClass.getMethod("initializeFlipper", Context.class, ReactInstanceManager.class)
              .invoke(null, context, reactInstanceManager);
      } catch (ClassNotFoundException e) {
        e.printStackTrace();
      } catch (NoSuchMethodException e) {
        e.printStackTrace();
      } catch (IllegalAccessException e) {
        e.printStackTrace();
      } catch (InvocationTargetException e) {
        e.printStackTrace();
      }
    }
  }
}
