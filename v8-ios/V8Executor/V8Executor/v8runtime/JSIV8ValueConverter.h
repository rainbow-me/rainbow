#pragma once

#include "V8Runtime.h"
#include "jsi/jsi.h"
#include "v8.h"

namespace facebook {

class JSIV8ValueConverter {
 private:
  JSIV8ValueConverter() = delete;
  ~JSIV8ValueConverter() = delete;
  JSIV8ValueConverter(JSIV8ValueConverter &&) = delete;

 public:
  static jsi::Value ToJSIValue(
      v8::Isolate *isolate,
      const v8::Local<v8::Value> &value);

  static v8::Local<v8::Value> ToV8Value(
      const V8Runtime &runtime,
      const jsi::Value &value);

  static v8::Local<v8::String> ToV8String(
      const V8Runtime &runtime,
      const jsi::String &string);

  static v8::Local<v8::String> ToV8String(
      const V8Runtime &runtime,
      const jsi::PropNameID &propName);

  static v8::MaybeLocal<v8::String> ToV8String(
      const V8Runtime &runtime,
      const std::shared_ptr<const jsi::Buffer> &buffer);

  static v8::Local<v8::Symbol> ToV8Symbol(
      const V8Runtime &runtime,
      const jsi::Symbol &symbol);

  static v8::Local<v8::Object> ToV8Object(
      const V8Runtime &runtime,
      const jsi::Object &object);

  static v8::Local<v8::Array> ToV8Array(
      const V8Runtime &runtime,
      const jsi::Array &array);

  static v8::Local<v8::Function> ToV8Function(
      const V8Runtime &runtime,
      const jsi::Function &function);

  static jsi::PropNameID ToJSIPropNameID(
      const V8Runtime &runtime,
      const v8::Local<v8::Name> &property);

  static std::string ToSTLString(const v8::String::Utf8Value &string);

  static std::string ToSTLString(
      v8::Isolate *isolate,
      const v8::Local<v8::Value> &string);
};

} // namespace facebook
