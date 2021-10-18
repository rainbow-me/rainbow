require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "rainbow-me-ultimate-list"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "10.0" }
  s.source       = { :git => "https://github.com/osdnk/rainbow-me-ultimate-list.git", :tag => "#{s.version}" }
  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES",
    "USE_HEADERMAP" => "YES",
    "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_TARGET_SRCROOT)\" \"$(PODS_ROOT)/Headers/Private/React-Core\" "
  }

  s.source_files = "ios/**/*.{h,m,mm}", "cpp/**/*.{h,cpp}"

  s.dependency "React-callinvoker"
  s.dependency "React"
  s.dependency "React-Core"
end
