package me.rainbow.NativeModules.RNFrameRateMonitor;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.util.Log;

import androidx.annotation.Nullable;

public class RNFrameRateMonitorKillListenerService extends Service {
  public static RNFrameRateMonitorModule module;

  @Nullable
  @Override
  public IBinder onBind(Intent intent) {
    return null;
  }

  @Override
  public void onTaskRemoved(Intent rootIntent) {
    super.onTaskRemoved(rootIntent);
    if (module != null) {
      module.stopMonitoring();
    }
  }
}
