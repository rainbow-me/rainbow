package me.rainbow.NativeModules.NavbarHeight;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;
import android.graphics.Point;
import android.view.WindowManager;
import android.view.Display;
import java.lang.IllegalAccessException;
import java.lang.reflect.InvocationTargetException;
import java.lang.NoSuchMethodException;
import android.view.WindowInsets;
import android.os.Build;
import android.content.Context;
import android.provider.Settings;

@ReactModule(name = NavbarHeightModule.NAME)
public class NavbarHeightModule extends ReactContextBaseJavaModule {
    public static final String NAME = "NavbarHeight";

    public NavbarHeightModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    @NonNull
    public String getName() {
        return NAME;
    }

    public Point getAppUsableScreenSize(Context context) {
        WindowManager windowManager = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
        Display display = windowManager.getDefaultDisplay();
        Point size = new Point();
        display.getSize(size);
        return size;
    }
    public Point getRealScreenSize(Context context) {
        WindowManager windowManager = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
        Display display = windowManager.getDefaultDisplay();
        Point size = new Point();

        if (Build.VERSION.SDK_INT >= 17) {
            display.getRealSize(size);
        } else if (Build.VERSION.SDK_INT >= 14) {
            try {
                size.x = (Integer) Display.class.getMethod("getRawWidth").invoke(display);
                size.y = (Integer) Display.class.getMethod("getRawHeight").invoke(display);
            } catch (IllegalAccessException e) {} catch (InvocationTargetException e) {} catch (NoSuchMethodException e) {}
        }

        return size;
    }
    @ReactMethod(isBlockingSynchronousMethod = true)
    public double getNavigationBarHeight() {
        Context context = getReactApplicationContext();
        WindowManager windowManager = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
        if (Build.VERSION.SDK_INT >= 30) {
            return windowManager
                    .getCurrentWindowMetrics()
                    .getWindowInsets()
                    .getInsets(WindowInsets.Type.navigationBars())
                    .bottom;
        } else {
            Point appUsableSize = getAppUsableScreenSize(context);
            Point realScreenSize = getRealScreenSize(context);

            // navigation bar on the side
            if (appUsableSize.x < realScreenSize.x) {
                return appUsableSize.y;
            }

            // navigation bar at the bottom
            if (appUsableSize.y < realScreenSize.y) {
                return realScreenSize.y - appUsableSize.y;
            }

            // navigation bar is not present
            return 0;
        }
    }

    /**
     * Returns the device's system navigation mode, either the on-screen
     * navigation bar (3- or 2-button), gesture navigation, or -1 if undetermined.
     */
    @ReactMethod(isBlockingSynchronousMethod = true)
    public int getNavigationMode() {
        try {
            Context context = getReactApplicationContext();
            // The internal resource that is authoritative of the "currently rendered"
            // state of the navigation bar style, and is available before user settings.
            // Since it's not public API, some OEM ROMs drop it (value 0)
            int resourceId = context.getResources().getIdentifier("config_navBarInteractionMode", "integer", "android");
            if (resourceId > 0) {
                return context.getResources().getInteger(resourceId);
            }
            // As a fallback, read the Secure "navigation_mode" setting the system
            // writes on mode change (API 29+) instead; throws if it was never set
            return Settings.Secure.getInt(context.getContentResolver(), "navigation_mode");
        } catch (Exception e) {
            return -1;
        }
    }
}
