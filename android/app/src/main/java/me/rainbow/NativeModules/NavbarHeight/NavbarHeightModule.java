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

    // Example method
    // See https://reactnative.dev/docs/native-modules-android
    @ReactMethod
    public double getNavigationBarHeightSync() {
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
        return getNavigationBarHeightSync();
    }
}