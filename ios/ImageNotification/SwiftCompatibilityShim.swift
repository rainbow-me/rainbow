//
//  SwiftCompatibilityShim.swift
//  ImageNotification
//
//  This file exists solely to ensure Xcode treats the ImageNotification
//  extension as a Swift target, which forces the Swift runtime libraries
//  to be linked. Without this, Xcode 16.1.1+ fails to link Swift
//  compatibility libraries needed by Swift-based pods (e.g., Firebase Messaging).
//

import Foundation

// No-op shim - this file's presence is sufficient
private enum SwiftCompatibilityShim {}
