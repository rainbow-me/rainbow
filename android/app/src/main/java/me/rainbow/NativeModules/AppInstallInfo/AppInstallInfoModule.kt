package me.rainbow.NativeModules.AppInstallInfo

import android.content.pm.PackageManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule
import java.security.MessageDigest

/**
 * Determines whether the app was installed from a public store (Google Play, APKMirror, etc.)
 * or from an internal source (QA APK, local release build).
 *
 * Google Play uses Play App Signing with two keys:
 * - Upload key: held by Rainbow, used to sign APKs built locally (QA, engineer builds).
 * - App signing key: held by Google, used to re-sign APKs distributed through Play Store.
 *
 * We compare the app's signing certificate against Rainbow's upload key fingerprint:
 * - Match -> locally-built APK (QA/engineer) -> isStoreInstall = false
 * - No match -> went through Google's signing pipeline (or unknown) -> isStoreInstall = true
 *
 * This is intentionally the reverse of checking for Google's app signing key. The failure
 * modes are safer: if Google rotates the app signing key, nothing breaks. If Rainbow rotates
 * the upload key, QA builds temporarily lose internal features until the fingerprint is
 * updated (immediately visible, trivially fixed). Unknown/unexpected keys default to store
 * install (safe: no dev tools exposed).
 *
 * Sideloads from APKMirror/Aurora Store carry Google's app signing key (not Rainbow's upload
 * key), so they're correctly classified as store installs.
 */
@ReactModule(name = AppInstallInfoModule.NAME)
class AppInstallInfoModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "AppInstallInfo"

        // SHA-256 fingerprint of Rainbow's upload key certificate.
        // Extract with: keytool -list -v -keystore rainbow-key.keystore -alias rainbow-alias
        // Then convert the hex fingerprint to a byte array.
        // TODO: paste actual SHA-256 fingerprint bytes here
        private val UPLOAD_KEY_FINGERPRINT = byteArrayOf(
            // e.g. 0x2A, 0x3B, 0x4C, ...
        )
    }

    override fun getName(): String = NAME

    // GET_SIGNATURES is deprecated in favor of GET_SIGNING_CERTIFICATES (API 28+), but our
    // minSdkVersion is 26. The deprecation reason (signature spoofing by other apps) doesn't
    // apply here since we only read our own app's certificate.
    // TODO: migrate to GET_SIGNING_CERTIFICATES + signingInfo once minSdkVersion >= 28.
    @Suppress("DEPRECATION")
    @ReactMethod(isBlockingSynchronousMethod = true)
    fun isStoreInstall(): Boolean {
        return try {
            val packageInfo = reactApplicationContext
                .packageManager
                .getPackageInfo(
                    reactApplicationContext.packageName,
                    PackageManager.GET_SIGNATURES
                )
            val cert = packageInfo.signatures!![0].toByteArray()
            val fingerprint = MessageDigest.getInstance("SHA-256").digest(cert)
            !fingerprint.contentEquals(UPLOAD_KEY_FINGERPRINT)
        } catch (_: Exception) {
            // Unknown signing state - default to store install (safe: no dev tools exposed)
            true
        }
    }
}