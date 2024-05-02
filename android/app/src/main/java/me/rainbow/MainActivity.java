package me.rainbow;

import android.content.Intent;
import android.content.IntentSender;
import android.content.res.Configuration;
import android.os.Bundle;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.annotation.NonNull;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.facebook.react.modules.network.OkHttpClientProvider;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.appupdate.AppUpdateOptions;
import com.google.android.play.core.install.InstallStateUpdatedListener;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.InstallStatus;
import com.google.android.play.core.install.model.UpdateAvailability;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;
import com.zoontek.rnbootsplash.RNBootSplash;

import io.branch.rnbranch.RNBranchModule;
import me.rainbow.NativeModules.Internals.CustomNetworkModule;
import me.rainbow.NativeModules.RNBackHandler.RNBackHandlerPackage;

public class MainActivity extends ReactActivity {
    private final static int UPDATE_TYPE = AppUpdateType.IMMEDIATE;
    private static AppUpdateManager appUpdateManager;

      @Override
      protected void onCreate(Bundle savedInstanceState) {
          OkHttpClientProvider.setOkHttpClientFactory(new CustomNetworkModule());
          super.onCreate(null);
          WebView.setWebContentsDebuggingEnabled(false);

          appUpdateManager = AppUpdateManagerFactory.create(this);
          if (UPDATE_TYPE == AppUpdateType.FLEXIBLE) {
              appUpdateManager.registerListener(getInstallStateUpdatedListener());
          }
          checkForAppUpdates();
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
      public void onResume() {
          super.onResume();

          if (UPDATE_TYPE == AppUpdateType.IMMEDIATE) {
              appUpdateManager.getAppUpdateInfo().addOnSuccessListener(info -> {
                  if (info.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS) {
                      try {
                          appUpdateManager.startUpdateFlowForResult(
                                  info,
                                  UPDATE_TYPE,
                                  this,
                                  AppUpdateOptions.newBuilder(UPDATE_TYPE).build().appUpdateType()
                          );
                      } catch (IntentSender.SendIntentException e) {
                          throw new RuntimeException(e);
                      }
                  }
              });
          }
      }

      @Override
      public void onDestroy() {
          super.onDestroy();
          if (UPDATE_TYPE == AppUpdateType.FLEXIBLE) {
              appUpdateManager.unregisterListener(getInstallStateUpdatedListener());
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

    @NonNull
    private InstallStateUpdatedListener getInstallStateUpdatedListener() {
        return state -> {
            if (state.installStatus() == InstallStatus.DOWNLOADING) {
                long bytesDownloaded = state.bytesDownloaded();
                long totalBytesToDownload = state.totalBytesToDownload();
                // TODO: Implement progress bar or some sort of user shown loader
            }

            if (state.installStatus() == InstallStatus.DOWNLOADED) {
                Toast.makeText(this, "New update successfully downloaded! Restarting app to install update.", Toast.LENGTH_SHORT).show();
                appUpdateManager.completeUpdate();
            }
        };
    }

    private void checkForAppUpdates() {
        appUpdateManager.getAppUpdateInfo().addOnSuccessListener((info) -> {
            boolean isUpdateAvailable = info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE;
            boolean isUpdateAllowed = info.isUpdateTypeAllowed(UPDATE_TYPE);

            if (isUpdateAvailable && isUpdateAllowed) {
                try {
                    appUpdateManager.startUpdateFlowForResult(
                        info,
                        UPDATE_TYPE,
                        this,
                        AppUpdateOptions.newBuilder(UPDATE_TYPE).build().appUpdateType()
                    );
                } catch (IntentSender.SendIntentException e) {
                    throw new RuntimeException(e);
                }
            }
        });
    }
}
