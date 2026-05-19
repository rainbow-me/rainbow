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
 * We compare the app's signing certificate against known Rainbow key fingerprints:
 * - Match (upload key or debug key) -> locally-built APK (QA/engineer) -> isStoreInstall = false
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

        // SHA-256 fingerprints (colon-separated hex) of Rainbow's known signing certs.
        // Any match -> internal build. No match -> store install (safe default).
        // Extracted with: keytool -list -v -keystore <keystore> -alias <alias>
        // Upload key (rainbow-key.keystore, alias rainbow-alias).
        private const val UPLOAD_CERT_SHA256 = "CD:34:1C:31:91:0F:63:D7:1A:3C:FA:6D:A4:95:81:11:E8:3A:BA:CA:64:14:79:3D:DB:86:A0:F9:0D:26:42:41"
        // Debug key (debug.keystore, alias androiddebugkey) — shared across all engineers.
        private const val DEBUG_CERT_SHA256 = "FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C"

        private val KNOWN_INTERNAL_FINGERPRINTS: List<ByteArray> = listOf(
            UPLOAD_CERT_SHA256,
            DEBUG_CERT_SHA256,
        ).map { sha -> sha.split(":").map { it.toInt(16).toByte() }.toByteArray() }
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
            KNOWN_INTERNAL_FINGERPRINTS.none { fingerprint.contentEquals(it) }
        } catch (_: Exception) {
            // Unknown signing state - default to store install (safe: no dev tools exposed)
            true
        }
    }
}