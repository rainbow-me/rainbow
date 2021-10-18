package com.rainbowmeultimatelist;

import android.util.Log;

import androidx.annotation.Keep;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.hermes.reactexecutor.HermesExecutorFactory;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.JavaScriptExecutor;
import com.facebook.react.bridge.JavaScriptExecutorFactory;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.jscexecutor.JSCExecutorFactory;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl;
import com.facebook.soloader.SoLoader;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.WeakHashMap;

@ReactModule(name = "rnultimatelist")
@Keep
public class UltimateNativeModule extends ReactContextBaseJavaModule {
  static {
    System.loadLibrary("rnultimatelist");
  }

  static public Map<Integer, RecyclerListView> sLists = new WeakHashMap<>();

  private static native byte[] getTypeAtIndex(int index, int id);
  private static native byte[] getHashAtIndex(int index, int id);
  private static native void installNative(long jsiRuntimePointer);
  public static native byte[] getStringValueAtIndexByKey(int index, String key, int id);
  public static native boolean getIsHeaderAtIndex(int index, int id);
  public static native int getLength(int id);
  public static native int[] getAdded(int id);
  public static native int[] getRemoved(int id);
  public static native int[] getMoved(int id);
  public static native void moveFromPreSet(int id);
  public static native void setNotifier();

  private ReactContext mContext;

  public UltimateNativeModule(ReactContext reactContext) {
    super();
    mContext = reactContext;
    setNotifier();
  }



  @Override
  public void initialize() {
    long x = mContext.getJavaScriptContextHolder().get();
    install(mContext.getJavaScriptContextHolder());
    super.initialize();
  }

  @Keep
  @DoNotStrip
  public static void notifyNewData(int id) {
    RecyclerListView list = sLists.get(id);
    if (list != null) {
      list.notifyNewData();
    }
  }

  public String stringValueAtIndexByKey(int index, String key, int id) {
    byte[] bytes = getStringValueAtIndexByKey(index, key, id);
    return new String(bytes, StandardCharsets.UTF_8);
  }

  public String typeAtIndex(int index, int id) {
    byte[] bytes = getTypeAtIndex(index, id);
    return new String(bytes, StandardCharsets.UTF_8);
  }

  public String hashAtIndex(int index, int id) {
    byte[] bytes = getTypeAtIndex(index, id);
    return new String(bytes, StandardCharsets.UTF_8);
  }

  public boolean isHeaderAtIndex(int index, int id) {
    return getIsHeaderAtIndex(index, id);
  }

  public int length(int id) {
    return getLength(id);
  }

  static String TAG = "rnultimatelist";

  @NonNull
  @Override
  public String getName() {
    return TAG;
  }


  // copied
  public static void install(JavaScriptContextHolder jsContext) {
    installNative(jsContext.get());
  }


  // Called from the C++ code
  @SuppressWarnings({"unused", "RedundantSuppression"})
  public static JavaScriptExecutor makeJSExecutor() {
    Log.i(TAG, "Creating JavaScriptExecutorFactory...");
    JavaScriptExecutorFactory factory = makeJSExecutorFactory();
    try {
      Log.i(TAG, "Factory created! Creating JavaScriptExecutor...");
      return factory.create();
    } catch (Exception e) {
      Log.e(TAG, "Failed to create JavaScriptExecutor!");
      e.printStackTrace();
      return null;
    }
  }

  // method from React native
  public static JavaScriptExecutorFactory makeJSExecutorFactory() {
    try {
      Log.i(TAG, "Trying to create JSC Factory...");
      SoLoader.loadLibrary("jscexecutor");
      return new JSCExecutorFactory("Multithreading", "Multithreading");
    } catch (UnsatisfiedLinkError jscE) {
      // https://github.com/facebook/hermes/issues/78 shows that
      // people who aren't trying to use Hermes are having issues.
      // https://github.com/facebook/react-native/issues/25923#issuecomment-554295179
      // includes the actual JSC error in at least one case.
      //
      // So, if "__cxa_bad_typeid" shows up in the jscE exception
      // message, then we will assume that's the failure and just
      // throw now.

      if (jscE.getMessage().contains("__cxa_bad_typeid")) {
        throw jscE;
      }

      // Otherwise use Hermes
      try {
        Log.i(TAG, "Trying to create Hermes Factory...");
        return new HermesExecutorFactory();
      } catch (UnsatisfiedLinkError hermesE) {
        // If we get here, either this is a JSC build, and of course
        // Hermes failed (since it's not in the APK), or it's a Hermes
        // build, and Hermes had a problem.

        // We suspect this is a JSC issue (it's the default), so we
        // will throw that exception, but we will print hermesE first,
        // since it could be a Hermes issue and we don't want to
        // swallow that.
        hermesE.printStackTrace();
        throw jscE;
      }
    }
  }
}
