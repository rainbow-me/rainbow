package me.rainbow;
import android.content.res.Configuration;
import android.os.Bundle;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;
import io.branch.rnbranch.*;
import me.rainbow.NativeModules.RNBackHandler.RNBackHandlerPackage;
import me.rainbow.NativeModules.Internals.*;
import android.webkit.WebView;
import com.zoontek.rnbootsplash.RNBootSplash;

import android.content.Intent;

public class MainActivity extends ReactActivity {

  @Override
  protected void onCreate(Bundle savedInstanceState) {
      super.onCreate(null);
      WebView.setWebContentsDebuggingEnabled(false);
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "Rainbow";
  }

  @Override
  protected void onStart() {
      super.onStart();
      RNBranchModule.initSession(getIntent().getData(), this);
  }

  @Override
  public void onBackPressed() {
      if (!RNBackHandlerPackage.sBlockBack) {
          super.onBackPressed();
      }
  }

  @Override
  public void onConfigurationChanged(Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
    getReactInstanceManager().onConfigurationChanged(this, newConfig);
  }

  @Override
  public void onNewIntent(Intent intent) {
      super.onNewIntent(intent);
      setIntent(intent);
      RNBranchModule.onNewIntent(intent);
    }

  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new ReactActivityDelegate(this, getMainComponentName()) {
      @Override
      protected ReactRootView createRootView() {
       return new RNGestureHandlerEnabledRootView(MainActivity.this);
      }
      @Override
      protected void loadApp(String appKey) {
          RNBootSplash.init(MainActivity.this);
          super.loadApp(appKey);
      }
    };
  }
}
