package me.rainbow.NativeModules.SystemNavigationBar;

import static com.facebook.react.bridge.UiThreadUtil.runOnUiThread;

import android.app.Activity;
import android.graphics.Color;
import android.os.Build;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.IllegalViewOperationException;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@ReactModule(name = SystemNavigationBarModule.NAME)
public class SystemNavigationBarModule extends ReactContextBaseJavaModule {

  public static final String NAME = "NavigationBar";
  public static final Integer NO_MODE = -1;
  public static final Integer LIGHT = 0;
  public static final Integer DARK = 1;
  public static final Integer NAVIGATION_BAR = 2;
  public static final Integer STATUS_BAR = 3;
  public static final Integer NAVIGATION_BAR_STATUS_BAR = 4;
  private static final Integer INSETS_TYPE_HIDE = 5;
  private static final Integer INSETS_TYPE_SHOW = 6;
  private static final Integer INSETS_TYPE_APPEARANCE = 7;
  private static final Integer INSETS_TYPE_APPEARANCE_CLEAR = 8;
  private static final Integer INSETS_TYPE_BEHAVIOR = 9;

  public SystemNavigationBarModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();
    constants.put("NO_MODE", NO_MODE);
    constants.put("LIGHT", LIGHT);
    constants.put("DARK", DARK);
    constants.put("NAVIGATION_BAR", NAVIGATION_BAR);
    constants.put("STATUS_BAR", STATUS_BAR);
    constants.put("NAVIGATION_BAR_STATUS_BAR", NAVIGATION_BAR_STATUS_BAR);
    return constants;
  }

  /* Navigation Hide */
  @ReactMethod
  public void navigationHide(Promise promise) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      setSystemInsetsController(WindowInsets.Type.navigationBars(), INSETS_TYPE_HIDE, promise);
    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
      setSystemUIFlags(
        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
          | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
          | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION,
        promise
      );
    }
  }

  /* Navigation Show */
  @ReactMethod
  public void navigationShow(Promise promise) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      setSystemInsetsController(WindowInsets.Type.navigationBars(), INSETS_TYPE_SHOW, promise);
    } else {
      setSystemUIFlags(View.SYSTEM_UI_FLAG_VISIBLE, promise);
    }
  }

  @ReactMethod
  public void fullScreen(Boolean enabled, Promise promise) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      int visibility = WindowInsets.Type.navigationBars() | WindowInsets.Type.statusBars();
      int type = enabled ? INSETS_TYPE_HIDE : INSETS_TYPE_SHOW;
      setSystemInsetsController(visibility, type, promise);
    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
      if (enabled) {
        setSystemUIFlags(
          View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_IMMERSIVE |
            View.SYSTEM_UI_FLAG_FULLSCREEN,
          promise
        );
      } else {
        setSystemUIFlags(
          View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN,
          promise
        );
      }
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
      final Activity currentActivity = getCurrentActivity();
      if (currentActivity == null) {
        promise.reject("Error: ", "current activity is null");
        return;
      }
      final Window view = currentActivity.getWindow();
      runOnUiThread(
        () -> {
          view.clearFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
          view.clearFlags(
            WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION
          );

          if (enabled) {
            view.setFlags(
              WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION,
              WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION
            );
          }
        }
      );
    }
  }

  /* Lean Back */
  @ReactMethod
  public void leanBack(Boolean enabled, Promise promise) {
    if (enabled) {
      setSystemUIFlags(
        View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION,
        promise
      );
    } else {
      setSystemUIFlags(View.SYSTEM_UI_FLAG_VISIBLE, promise);
    }
  }

  /* Immersive */
  @ReactMethod
  public void immersive(Promise promise) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      int visibility = WindowInsets.Type.navigationBars() | WindowInsets.Type.statusBars();
      setSystemInsetsController(visibility, INSETS_TYPE_HIDE, promise);
      setSystemInsetsController(WindowInsetsController.BEHAVIOR_SHOW_BARS_BY_SWIPE, INSETS_TYPE_BEHAVIOR, promise);
    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
      setSystemUIFlags(View.SYSTEM_UI_FLAG_IMMERSIVE |
        View.SYSTEM_UI_FLAG_FULLSCREEN |
        View.SYSTEM_UI_FLAG_HIDE_NAVIGATION, promise);
    }
  }

  /* Sticky Immersive */
  @ReactMethod
  public void stickyImmersive(Boolean enabled, Promise promise) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      int visibility = WindowInsets.Type.navigationBars();
      if (enabled) {
        setSystemInsetsController(visibility, INSETS_TYPE_HIDE, promise);
        setSystemInsetsController(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE, INSETS_TYPE_BEHAVIOR, promise);
      } else {
        setSystemInsetsController(visibility, INSETS_TYPE_SHOW, promise);
        setSystemInsetsController(WindowInsetsController.BEHAVIOR_SHOW_BARS_BY_SWIPE, INSETS_TYPE_APPEARANCE_CLEAR, promise);
      }
    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
      if (enabled) {
        setSystemUIFlags(
          View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
            View.SYSTEM_UI_FLAG_FULLSCREEN |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION,
          promise
        );
      } else {
        setSystemUIFlags(View.SYSTEM_UI_FLAG_VISIBLE, promise);
      }
    }
  }

  /* Low Profile */
  @ReactMethod
  public void lowProfile(Boolean enabled, Promise promise) {
    if (enabled) {
      setSystemUIFlags(View.SYSTEM_UI_FLAG_LOW_PROFILE, promise);
    } else {
      setSystemUIFlags(View.SYSTEM_UI_FLAG_VISIBLE, promise);
    }
  }

  @ReactMethod
  public void setBarMode(Integer modeStyle, Integer bar, Promise promise) {
    boolean isLight = modeStyle.equals(LIGHT);
    setModeStyle(!isLight, bar, promise);
  }

  /* Set Navigation Color */
  @ReactMethod
  public void setNavigationColor(
    Integer color,
    Boolean isTranslucent,
    Integer modeStyle,
    Integer bar,
    Promise promise
  ) {
    try {
      int requiredVersion = Build.VERSION_CODES.LOLLIPOP;
      if (Build.VERSION.SDK_INT < requiredVersion) {
        promise.reject("Error: ", errorMessage(requiredVersion));
        return;
      }
      final Activity currentActivity = getCurrentActivity();
      if (currentActivity == null) {
        promise.reject("Error: ", "current activity is null");
        return;
      }
      final Window view = currentActivity.getWindow();
      runOnUiThread(
        () -> {
          view.clearFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
          view.clearFlags(
            WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION
          );

          if (isTranslucent) {
            view.setFlags(
              WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION,
              WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION
            );
          }

          boolean isTransparent = color.equals(Color.TRANSPARENT) && !isTranslucent;
          if (isTransparent) {
            view.setFlags(
              WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
              WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
            );
            view.setFlags(
              WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION,
              WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION
            );
          }

          view.setNavigationBarColor(color);

          if (!Objects.equals(modeStyle, NO_MODE)) {
            boolean isLight = modeStyle.equals(LIGHT);
            setModeStyle(!isLight, bar);
          }
        }
      );
      promise.resolve("true");
    } catch (IllegalViewOperationException e) {
      e.printStackTrace();
      promise.reject("Error: ", e.getMessage());
    }
  }

  @ReactMethod
  public void setFitsSystemWindows(
    Boolean enabled,
    Promise promise
  ) {
    try {
      int requiredVersion = Build.VERSION_CODES.LOLLIPOP;
      if (Build.VERSION.SDK_INT < requiredVersion) {
        throw new IllegalViewOperationException(errorMessage(requiredVersion));
      }
      final Activity currentActivity = getCurrentActivity();
      if (currentActivity == null) {
        throw new IllegalViewOperationException("current activity is null");
      }
      final Window view = currentActivity.getWindow();
      runOnUiThread(
        () -> {
          if (!enabled) {
            view.getDecorView().setSystemUiVisibility(
              View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            );
          } else {
            view.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
          }
        }
      );
      promise.resolve("true");
    } catch (IllegalViewOperationException e) {
      e.printStackTrace();
      promise.reject("Error: ", e.getMessage());
    }
  }

  @ReactMethod
  public void getBarColor(Integer bar, Promise promise) {
    runOnUiThread(() -> {
      try {
        int requiredVersion = Build.VERSION_CODES.LOLLIPOP;
        if (Build.VERSION.SDK_INT < requiredVersion) {
          promise.reject("Error: ", errorMessage(requiredVersion));
          return;
        }
        final Activity currentActivity = getCurrentActivity();
        if (currentActivity == null) {
          promise.reject("Error: ", "current activity is null");
          return;
        }
        final Window view = currentActivity.getWindow();

        int navigationColor = view.getNavigationBarColor();
        int statusColor = view.getStatusBarColor();

        if (bar.equals(STATUS_BAR)) {
          promise.resolve(convertColorToHexCode(statusColor));
        } else if (bar.equals(NAVIGATION_BAR)) {
          promise.resolve(convertColorToHexCode(navigationColor));
        } else if (bar.equals(NAVIGATION_BAR_STATUS_BAR)) {
          String hexStatusColor = convertColorToHexCode(statusColor);
          String hexNavigationColor = convertColorToHexCode(navigationColor);
          String result = String.format("{ \"status\": \"%s\", \"navigation\": \"%s\" }", hexStatusColor, hexNavigationColor);
          promise.resolve(result);
        }
      } catch (IllegalViewOperationException e) {
        e.printStackTrace();
        promise.reject("Error: ", e.getMessage());
      }
    });
  }

  /* Set NavigationBar Divider Color */
  @ReactMethod
  public void setNavigationBarDividerColor(Integer color, Promise promise) {
    try {
      int requiredVersion = Build.VERSION_CODES.P;
      if (Build.VERSION.SDK_INT < requiredVersion) {
        promise.reject("Error: ", errorMessage(requiredVersion));
        return;
      }
      final Activity currentActivity = getCurrentActivity();
      if (currentActivity == null) {
        promise.reject("Error: ", "current activity is null");
        return;
      }
      final Window view = currentActivity.getWindow();
      runOnUiThread(
        () -> {
          view.setNavigationBarDividerColor(color);
          view
            .getDecorView()
            .setSystemUiVisibility(
              WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS |
                WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION
            );
        }
      );
      promise.resolve("true");
    } catch (IllegalViewOperationException e) {
      e.printStackTrace();
      promise.reject("Error: ", e.getMessage());
    }
  }

  /* Set NavigationBar Contrast Enforced */
  @ReactMethod
  public void setNavigationBarContrastEnforced(
    Boolean enforceContrast,
    Promise promise
  ) {
    try {
      int requiredVersion = Build.VERSION_CODES.Q;
      if (Build.VERSION.SDK_INT < requiredVersion) {
        promise.reject("Error: ", errorMessage(requiredVersion));
        return;
      }
      final Activity currentActivity = getCurrentActivity();
      if (currentActivity == null) {
        promise.reject("Error: ", "current activity is null");
        return;
      }
      final Window view = currentActivity.getWindow();
      runOnUiThread(
        () -> view.setNavigationBarContrastEnforced(enforceContrast)
      );
      promise.resolve("true");
    } catch (IllegalViewOperationException e) {
      e.printStackTrace();
      promise.reject("Error: ", e.getMessage());
    }
  }

  /* Private Method */
  private void setSystemInsetsController(int visibility, Integer insetsType, Promise promise) {
    try {
      runOnUiThread(
        () -> {
          int requiredVersion = Build.VERSION_CODES.R;
          if (Build.VERSION.SDK_INT < requiredVersion) {
            promise.reject("Error: ", errorMessage(requiredVersion));
            return;
          }
          Activity currentActivity = getCurrentActivity();
          if (currentActivity == null) {
            promise.reject("Error: ", "current activity is null");
            return;
          }
          WindowInsetsController insetsController = currentActivity.getWindow().getInsetsController();

          if (insetsController != null) {
            if (insetsType.equals(INSETS_TYPE_HIDE)) {
              insetsController.hide(visibility);
            } else if (insetsType.equals(INSETS_TYPE_SHOW)) {
              insetsController.show(visibility);
            } else if (insetsType.equals(INSETS_TYPE_APPEARANCE)) {
              insetsController.setSystemBarsAppearance(visibility, visibility);
            } else if (insetsType.equals(INSETS_TYPE_APPEARANCE_CLEAR)) {
              insetsController.setSystemBarsAppearance(0, visibility);
            } else if (insetsType.equals(INSETS_TYPE_BEHAVIOR)) {
              insetsController.setSystemBarsBehavior(visibility);
            }
          }
          promise.resolve("true");
        }
      );
    } catch (IllegalViewOperationException e) {
      e.printStackTrace();
      promise.reject("Error: ", e.getMessage());
    }
  }

  /* Private Method */
  private void setSystemUIFlags(int visibility, Promise promise) {
    try {
      runOnUiThread(
        () -> {
          int requiredVersion = Build.VERSION_CODES.LOLLIPOP;
          if (Build.VERSION.SDK_INT < requiredVersion) {
            promise.reject("Error: ", errorMessage(requiredVersion));
            return;
          }
          Activity currentActivity = getCurrentActivity();
          if (currentActivity == null) {
            promise.reject("Error: ", "current activity is null");
            return;
          }
          View decorView = currentActivity.getWindow().getDecorView();
          decorView.setSystemUiVisibility(visibility);
          promise.resolve("true");
        }
      );
    } catch (IllegalViewOperationException e) {
      e.printStackTrace();
      promise.reject("Error: ", e.getMessage());
    }
  }

  private void setModeStyle(Boolean light, Integer bar) {
    if (getCurrentActivity() == null) {
      throw new IllegalViewOperationException("current activity is null");
    }
    int visibility = 0;

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      WindowInsetsController insetsController = getCurrentActivity().getWindow().getInsetsController();
      int navigationBarAppearance = WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
      int statusBarAppearance = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS;
      int bothBarAppearance = statusBarAppearance | navigationBarAppearance;

      if (insetsController != null) {
        if (bar.equals(NAVIGATION_BAR)) {
          visibility = navigationBarAppearance;
        } else if (bar.equals(STATUS_BAR)) {
          visibility = statusBarAppearance;
        } else if (bar.equals(NAVIGATION_BAR_STATUS_BAR)) {
          visibility = bothBarAppearance;
        }

        if (light) {
          insetsController.setSystemBarsAppearance(visibility, visibility);
        } else {
          insetsController.setSystemBarsAppearance(0, visibility);
        }
      }
    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      View decorView = getCurrentActivity().getWindow().getDecorView();
      int bit = decorView.getSystemUiVisibility();

      if (bar.equals(NAVIGATION_BAR)) {
        visibility = View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
      } else if (bar.equals(STATUS_BAR)) {
        visibility = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
      } else if (bar.equals(NAVIGATION_BAR_STATUS_BAR)) {
        visibility = View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
      }

      if (light) {
        bit |= visibility;
      } else {
        bit &= ~visibility;
      }

      decorView.setSystemUiVisibility(bit);
    }
  }

  private void setModeStyle(Boolean light, Integer bar, Promise promise) {
    try {
      runOnUiThread(
        () -> {
          setModeStyle(light, bar);
          promise.resolve("true");
        }
      );
    } catch (IllegalViewOperationException e) {
      promise.reject("Error: ", e.getMessage());
    }
  }

  private String errorMessage(int version) {
    return "Your device version: " + Build.VERSION.SDK_INT + ". Supported API Level: " + version;
  }

  private String convertColorToHexCode(int color) {
    return String.format("#%06X", (0xFFFFFF & color));
  }
}