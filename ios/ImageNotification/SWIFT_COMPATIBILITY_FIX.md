# ImageNotification Swift Compatibility Fix

## Problem

Starting with Xcode 16.1.1, Apple stopped auto-linking Swift compatibility libraries for targets that don't compile any Swift sources. The ImageNotification extension links Firebase Messaging (a Swift-based static pod) but only contained Objective-C code, causing linker failures:

```
ld: Could not find or use auto-linked library 'swiftCompatibility56'
ld: Could not find or use auto-linked library 'swiftCompatibilityConcurrency'
ld: Could not find or use auto-linked library 'swiftCompatibilityPacks'
ld: symbol(s) not found for architecture arm64
```

## Solution

### 1. Swift Shim File

Added `SwiftCompatibilityShim.swift` - a no-op Swift file that forces Xcode to treat the ImageNotification extension as a Swift target, ensuring Swift runtime libraries get linked.

```swift
// SwiftCompatibilityShim.swift
import Foundation

// No-op shim - this file's presence is sufficient
private enum SwiftCompatibilityShim {}
```

### 2. Xcode Project Configuration

Updated `Rainbow.xcodeproj/project.pbxproj`:

**File references added:**
- PBXBuildFile entry for compiling `SwiftCompatibilityShim.swift`
- PBXFileReference entry for the Swift file
- Added file to ImageNotification group
- Added file to the Sources build phase

**Build settings updated for all 4 ImageNotification configurations (Debug, Release, LocalRelease, Staging):**

| Setting | Value | Purpose |
|---------|-------|---------|
| `ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES` | `YES` | Forces embedding Swift standard libraries |
| `CLANG_ENABLE_MODULES` | `YES` | Enables Clang modules for better Swift interop |
| `CLANG_CXX_LANGUAGE_STANDARD` | `$(inherited)` | Inherits from CocoaPods config (fixes override warning) |
| `SWIFT_VERSION` | `5.0` | Specifies Swift version for the target |

## Why This Works

By adding a Swift file and the proper build settings, Xcode now:
1. Invokes `swiftc` for the target
2. Recognizes the target as Swift-aware
3. Bundles the necessary Swift runtime libraries

This consistently fixes the undefined symbol failures seen during `yarn ios` / Xcode builds.

## Date

December 2024
