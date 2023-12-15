package me.rainbow.NativeModules.RNReview;

import android.app.Activity;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.google.android.play.core.review.ReviewInfo;
import com.google.android.play.core.review.ReviewManager;
import com.google.android.play.core.review.ReviewManagerFactory;
import com.google.android.play.core.tasks.Task;

public class RNReviewModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public RNReviewModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "RNReview";
    }

    @ReactMethod

    public void show(final Promise promise) {
        final Activity activity = reactContext.getCurrentActivity();
        if (activity == null) {
            promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "Activity doesn't exist");
            return;
        }

        ReviewManager manager = ReviewManagerFactory.create(reactContext);
        Task<ReviewInfo> request = manager.requestReviewFlow();
        request.addOnCompleteListener(task -> {
            if (task.isSuccessful()) {
                // We can get the ReviewInfo object
                ReviewInfo reviewInfo = task.getResult();
                Task<Void> flow = manager.launchReviewFlow(activity, reviewInfo);
                flow.addOnCompleteListener(task1 -> {
                    if (task1.isSuccessful()) {
                        promise.resolve(null);
                    } else {
                        promise.reject("E_REVIEW_FLOW_FAILED", "Review flow failed");
                    }
                });
            } else {
                promise.reject("E_REQUEST_REVIEW_FAILED", "Request review flow failed");
            }
        });
    }
}
