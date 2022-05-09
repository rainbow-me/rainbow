//
//  BackupDetector.swift
//  Rainbow
//
//  Created by Tomasz Czajęcki on 06/05/2022.
//  Copyright © 2022 Rainbow. All rights reserved.
//

@objc(BackupDetector)
class BackupDetector: NSObject {

  @objc
  func checkBackupMarker(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let manager = FileManager.default
    print("checkBackupMarker")

    do {
      if let bundleIdentifier = Bundle.main.bundleIdentifier {
        var url = try manager.url(for: .libraryDirectory, in: .userDomainMask, appropriateFor: nil, create: false)
        url.appendPathComponent("Application Support")
        url.appendPathComponent(bundleIdentifier, isDirectory: true)
        url.appendPathComponent("backup-detector")
        url.appendPathComponent("backup.txt")

        print("checking for file at path \(url.path)")
        resolve(manager.fileExists(atPath: url.path));
        return
      } else {
        reject("checkBackupMarker", "Couldn't get bundleIdentifier", nil)
        return
      }
    } catch {
      reject("checkBackupMarker", "Experienced error", error)
      return
    }
  }

  @objc
  func createBackupMarker(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let manager = FileManager.default
    print("createBackupMarker")

    if let bundleIdentifier = Bundle.main.bundleIdentifier {
      print("bundleIdentifier: \(bundleIdentifier)")
      do {
        var url = try manager.url(for: .libraryDirectory, in: .userDomainMask, appropriateFor: nil, create: false)
        url.appendPathComponent("Application Support")
        url.appendPathComponent(bundleIdentifier, isDirectory: true)
        url.appendPathComponent("backup-detector")
        
        var values = URLResourceValues()
        values.isExcludedFromBackup = true
        try url.setResourceValues(values)

        var fileUrl = try manager.url(for: .libraryDirectory, in: .userDomainMask, appropriateFor: nil, create: false)
        fileUrl.appendPathComponent("Application Support")
        fileUrl.appendPathComponent(bundleIdentifier, isDirectory: true)
        fileUrl.appendPathComponent("backup-detector")
        fileUrl.appendPathComponent("backup.txt")
        
        print("url: \(url.path)")

        // TODO: mark directory as excluded from backups
        if (!manager.fileExists(atPath: url.path) && !manager.fileExists(atPath: fileUrl.path)) {
          print("file doesnt exist")
          try manager.createDirectory(at: url, withIntermediateDirectories: true, attributes: nil)
          print("directory created")
          manager.createFile(atPath: fileUrl.path, contents: "hello".data(using: .utf8))
          print("file created")
        } else {
          print("file already exists")
        }
        resolve(nil)
      } catch {
        reject("createBackupMarker", "Experienced error", error)
        return
      }
    }
  }
}
