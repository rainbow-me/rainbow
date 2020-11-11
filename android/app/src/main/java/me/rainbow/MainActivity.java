package me.rainbow;
import android.os.Bundle;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;
import org.devio.rn.splashscreen.SplashScreen;
import io.branch.rnbranch.*;
import me.rainbow.NativeModules.RNBackHandler.RNBackHandlerPackage;
import android.webkit.WebView;

import android.content.Intent;

public class MainActivity extends ReactActivity {

  @Override
  protected void onCreate(Bundle savedInstanceState) {
        SplashScreen.show(this, R.style.NoActionBar);
        super.onCreate(savedInstanceState);
        WebView.setWebContentsDebuggingEnabled(true);
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
  public void onNewIntent(Intent intent) {
      super.onNewIntent(intent);
      setIntent(intent);
    }
  
  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new ReactActivityDelegate(this, getMainComponentName()) {
      @Override
      protected ReactRootView createRootView() {
       return new RNGestureHandlerEnabledRootView(MainActivity.this);
      }
    };
  }
}
