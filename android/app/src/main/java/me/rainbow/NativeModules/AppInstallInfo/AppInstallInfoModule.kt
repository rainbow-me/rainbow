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

        // SHA-256 fingerprint of Rainbow's upload key certificate (rainbow-key.keystore, alias rainbow-alias).
        // Extract with: keytool -list -v -keystore rainbow-key.keystore -alias rainbow-alias
        // CD:34:1C:31:91:0F:63:D7:1A:3C:FA:6D:A4:95:81:11:E8:3A:BA:CA:64:14:79:3D:DB:86:A0:F9:0D:26:42:41
        private val UPLOAD_KEY_FINGERPRINT = intArrayOf(
            0xCD, 0x34, 0x1C, 0x31, 0x91, 0x0F, 0x63, 0xD7,
            0x1A, 0x3C, 0xFA, 0x6D, 0xA4, 0x95, 0x81, 0x11,
            0xE8, 0x3A, 0xBA, 0xCA, 0x64, 0x14, 0x79, 0x3D,
            0xDB, 0x86, 0xA0, 0xF9, 0x0D, 0x26, 0x42, 0x41,
        ).map { it.toByte() }.toByteArray()
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