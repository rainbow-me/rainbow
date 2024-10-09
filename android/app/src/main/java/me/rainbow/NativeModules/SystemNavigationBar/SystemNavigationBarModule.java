//  Created by react-native-create-bridge

package me.rainbow.NativeModules.SystemNavigationBar;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import android.animation.ArgbEvaluator;
import android.animation.ValueAnimator;
import android.annotation.TargetApi;
import android.graphics.Color;
import android.os.Build;
import android.app.Activity;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import androidx.annotation.UiThread;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import java.util.HashMap;
import java.util.Map;
import com.facebook.react.uimanager.IllegalViewOperationException;
import static com.facebook.react.bridge.UiThreadUtil.runOnUiThread;

public class SystemNavigationBarModule extends ReactContextBaseJavaModule {
    public static final String REACT_CLASS = "NavigationBar";

    public SystemNavigationBarModule(ReactApplicationContext context) {
        // Pass in the context to the constructor and save it so you can emit events
        // https://facebook.github.io/react-native/docs/native-modules-android.html#the-toast-module
        super(context);
    }

    @Override
    public String getName() {
        // Tell React the name of the module
        // https://facebook.github.io/react-native/docs/native-modules-android.html#the-toast-module
        return REACT_CLASS;
    }

    @Override
    public Map<String, Object> getConstants() {
        // Export any constants to be used in your native module
        // https://facebook.github.io/react-native/docs/native-modules-android.html#the-toast-module
        final Map<String, Object> constants = new HashMap<>();
        constants.put("EXAMPLE_CONSTANT", "example");

        return constants;
    }

    @ReactMethod
    public void changeBarColors(final Boolean isDarkMode, final String translucentLightStr, final String translucentDarkStr) {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            final Window window = activity.getWindow();
            activity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    /**
                     * Handle the color setting
                     */
                    int translucentLightColor;
                    if (translucentLightStr.isEmpty()) {
                        translucentLightColor = Color.parseColor("#50000000");
                    } else if (translucentLightStr.equals("transparent")) {
                        translucentLightColor = Color.TRANSPARENT;
                    } else {
                        translucentLightColor = Color.parseColor(translucentLightStr);
                    }

                    int translucentDarkColor;
                    if (translucentDarkStr.isEmpty() || translucentDarkStr.equals("transparent")) {
                        translucentDarkColor = Color.TRANSPARENT;
                    } else {
                        translucentDarkColor = Color.parseColor(translucentDarkStr);
                    }

                    // Set the navbar to be drawn over
                    // Both flags were added in Level 16
                    int flags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION;

                    boolean isDarkModeTransparent = isDarkMode && translucentDarkStr.equals("transparent");
                    boolean isLightModeTransparent = !isDarkMode && translucentLightStr.equals("transparent");

                    // M was the first version that supported light mode status bar
                    boolean shouldUseTransparentStatusBar = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M;
                    // O was the first version that supported light mode nav bar
                    boolean shouldUseTransparentNavBar = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && (isDarkModeTransparent || isLightModeTransparent);

                    if (shouldUseTransparentStatusBar) {
                        window.setStatusBarColor(Color.TRANSPARENT);
                        if (!isDarkMode) {
                            flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                        }
                    } else {
                        int statusBarColor = isDarkMode ? translucentDarkColor : translucentLightColor;
                        window.setStatusBarColor(statusBarColor);
                        if (!isDarkMode) {
                            flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                        }
                    }

                    if (shouldUseTransparentNavBar) {
                        window.setNavigationBarColor(Color.TRANSPARENT);
                        if (!isDarkMode) {
                            flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                        }
                    } else {
                        int navBarColor = isDarkMode ? translucentDarkColor : translucentLightColor;
                        window.setNavigationBarColor(navBarColor);
                        if (!isDarkMode) {
                            flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                        }
                    }

                    window.getDecorView().setSystemUiVisibility(flags);
                    WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(window, window.getDecorView());
                    insetsController.setAppearanceLightNavigationBars(!isDarkMode);
                }
            });
        } else {
            android.util.Log.e("NavigationBar", "Activity is null, cannot change bar colors");
        }
    }
}