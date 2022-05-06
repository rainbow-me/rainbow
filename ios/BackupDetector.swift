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

        url.appendPathComponent(bundleIdentifier, isDirectory: true)
        url.appendPathComponent("backup-detector")
        
        print("url: \(url.path)")

        // TODO: mark directory as excluded from backups
        if (!manager.fileExists(atPath: url.path)) {
          print("file doesnt exist")
          try manager.createDirectory(at: url, withIntermediateDirectories: true, attributes: nil)
          print("directory created")
          manager.createFile(atPath: url.path + "/backup.txt", contents: "hello".data(using: .utf8))
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
