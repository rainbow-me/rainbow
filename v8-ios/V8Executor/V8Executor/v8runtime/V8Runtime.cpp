#include "V8Runtime.h"

#include <sstream>
#include "HostProxy.h"
#include "JSIV8ValueConverter.h"
#include "V8PointerValue.h"
#include "jsi/jsilib.h"

namespace facebook {

// static
std::unique_ptr<v8::Platform> V8Runtime::s_platform = nullptr;

V8Runtime::V8Runtime() {
  if (!s_platform) {
    s_platform = v8::platform::NewDefaultPlatform();
    v8::V8::InitializeICU();
    v8::V8::InitializePlatform(s_platform.get());
    v8::V8::Initialize();
  }

  arrayBufferAllocator_.reset(
      v8::ArrayBuffer::Allocator::NewDefaultAllocator());
  v8::Isolate::CreateParams createParams;
  createParams.array_buffer_allocator = arrayBufferAllocator_.get();
  isolate_ = v8::Isolate::New(createParams);
  isolate_->Enter();
  v8::HandleScope scopedIsolate(isolate_);
  context_.Reset(isolate_, CreateGlobalContext(isolate_));
  context_.Get(isolate_)->Enter();
}

V8Runtime::~V8Runtime() {
  {
    v8::HandleScope scopedIsolate(isolate_);
    v8::Local<v8::Context> context = context_.Get(isolate_);
    context->Exit();
    context_.Reset();
  }
  isolate_->Exit();
  isolate_->Dispose();
  // v8::V8::Dispose();
  // v8::V8::ShutdownPlatform();
}

v8::Local<v8::Context> V8Runtime::CreateGlobalContext(v8::Isolate *isolate) {
  v8::HandleScope scopedIsolate(isolate);
  v8::Local<v8::ObjectTemplate> global = v8::ObjectTemplate::New(isolate_);
  global->Set(
      v8::String::NewFromUtf8(isolate, "_v8runtime", v8::NewStringType::kNormal)
          .ToLocalChecked(),
      v8::FunctionTemplate::New(isolate, V8Runtime::GetRuntimeInfo));
  return v8::Context::New(isolate_, nullptr, global);
}

jsi::Value V8Runtime::ExecuteScript(
    v8::Isolate *isolate,
    const v8::Local<v8::String> &script,
    const std::string &sourceURL) {
  v8::HandleScope scopedIsolate(isolate);
  v8::TryCatch tryCatch(isolate);

  v8::MaybeLocal<v8::String> sourceURLValue = v8::String::NewFromUtf8(
      isolate,
      sourceURL.c_str(),
      v8::NewStringType::kNormal,
      sourceURL.length());
  v8::ScriptOrigin origin(sourceURLValue.ToLocalChecked());

  v8::Local<v8::Script> compiledScript;
  v8::Local<v8::Context> context(isolate->GetCurrentContext());

  if (!v8::Script::Compile(context, script, &origin).ToLocal(&compiledScript)) {
    ReportException(isolate, &tryCatch);
    return {};
  }

  v8::Local<v8::Value> result;
  if (!compiledScript->Run(context).ToLocal(&result)) {
    assert(tryCatch.HasCaught());
    ReportException(isolate, &tryCatch);
    return {};
  }

  return JSIV8ValueConverter::ToJSIValue(isolate, result);
}

void V8Runtime::ReportException(v8::Isolate *isolate, v8::TryCatch *tryCatch)
    const {
  v8::HandleScope scopedIsolate(isolate);
  std::string exception =
      JSIV8ValueConverter::ToSTLString(isolate, tryCatch->Exception());
  v8::Local<v8::Message> message = tryCatch->Message();
  if (message.IsEmpty()) {
    // V8 didn't provide any extra information about this error; just
    // print the exception.
    throw jsi::JSError(const_cast<V8Runtime &>(*this), exception);
    return;
  } else {
    std::ostringstream ss;
    v8::Local<v8::Context> context(isolate->GetCurrentContext());

    // Print (filename):(line number): (message).
    ss << JSIV8ValueConverter::ToSTLString(
              isolate, message->GetScriptOrigin().ResourceName())
       << ":" << message->GetLineNumber(context).FromJust() << ": " << exception
       << std::endl;

    // Print line of source code.
    ss << JSIV8ValueConverter::ToSTLString(
              isolate, message->GetSourceLine(context).ToLocalChecked())
       << std::endl;

    // Print wavy underline (GetUnderline is deprecated).
    int start = message->GetStartColumn(context).FromJust();
    for (int i = 0; i < start; i++) {
      ss << " ";
    }
    int end = message->GetEndColumn(context).FromJust();
    for (int i = start; i < end; i++) {
      ss << "^";
    }
    ss << std::endl;

    v8::Local<v8::Value> stackTraceString;
    if (tryCatch->StackTrace(context).ToLocal(&stackTraceString) &&
        stackTraceString->IsString() &&
        v8::Local<v8::String>::Cast(stackTraceString)->Length() > 0) {
      v8::String::Utf8Value stackTrace(isolate, stackTraceString);
      ss << JSIV8ValueConverter::ToSTLString(stackTrace) << std::endl;
    }

    throw jsi::JSError(const_cast<V8Runtime &>(*this), ss.str());
    return;
  }
}

//
// jsi::Runtime implementations
//
jsi::Value V8Runtime::evaluateJavaScript(
    const std::shared_ptr<const jsi::Buffer> &buffer,
    const std::string &sourceURL) {
  v8::HandleScope scopedIsolate(isolate_);
  v8::Local<v8::String> string;
  if (JSIV8ValueConverter::ToV8String(*this, buffer).ToLocal(&string)) {
    return ExecuteScript(isolate_, string, sourceURL);
  }
  return {};
}

std::shared_ptr<const jsi::PreparedJavaScript> V8Runtime::prepareJavaScript(
    const std::shared_ptr<const jsi::Buffer> &buffer,
    std::string sourceURL) {
  return std::make_shared<jsi::SourceJavaScriptPreparation>(
      buffer, std::move(sourceURL));
}

jsi::Value V8Runtime::evaluatePreparedJavaScript(
    const std::shared_ptr<const jsi::PreparedJavaScript> &js) {
  assert(
      dynamic_cast<const jsi::SourceJavaScriptPreparation *>(js.get()) &&
      "preparedJavaScript must be a SourceJavaScriptPreparation");
  auto sourceJs =
      std::static_pointer_cast<const jsi::SourceJavaScriptPreparation>(js);
  return evaluateJavaScript(sourceJs, sourceJs->sourceURL());
}

jsi::Object V8Runtime::global() {
  v8::HandleScope scopedIsolate(isolate_);
  return make<jsi::Object>(
      new V8PointerValue(isolate_, context_.Get(isolate_)->Global()));
}

std::string V8Runtime::description() {
  std::ostringstream ss;
  ss << "<V8Runtime@" << this << ">";
  return ss.str();
}

bool V8Runtime::isInspectable() {
  return false;
}

// These clone methods are shallow clone
jsi::Runtime::PointerValue *V8Runtime::cloneSymbol(
    const Runtime::PointerValue *pv) {
  if (!pv) {
    return nullptr;
  }
  v8::HandleScope scopedIsolate(isolate_);
  const V8PointerValue *v8PointerValue =
      static_cast<const V8PointerValue *>(pv);
  assert(v8PointerValue->Get(isolate_)->IsSymbol());

  v8::Local<v8::Symbol> object =
      v8::Local<v8::Symbol>::Cast(v8PointerValue->Get(isolate_));
  v8::Local<v8::Symbol> newSymbol =
      v8::Local<v8::Symbol>::New(isolate_, object);
  return new V8PointerValue(isolate_, newSymbol);
}

jsi::Runtime::PointerValue *V8Runtime::cloneString(
    const Runtime::PointerValue *pv) {
  if (!pv) {
    return nullptr;
  }

  v8::HandleScope scopedIsolate(isolate_);
  const V8PointerValue *v8PointerValue =
      static_cast<const V8PointerValue *>(pv);
  assert(v8PointerValue->Get(isolate_)->IsString());

  v8::Local<v8::String> string =
      v8::Local<v8::String>::Cast(v8PointerValue->Get(isolate_));
  v8::Local<v8::String> newString =
      v8::Local<v8::String>::New(isolate_, string);
  return new V8PointerValue(isolate_, newString);
}

jsi::Runtime::PointerValue *V8Runtime::cloneObject(
    const Runtime::PointerValue *pv) {
  if (!pv) {
    return nullptr;
  }

  v8::HandleScope scopedIsolate(isolate_);
  const V8PointerValue *v8PointerValue =
      static_cast<const V8PointerValue *>(pv);
  assert(v8PointerValue->Get(isolate_)->IsObject());

  v8::Local<v8::Object> object =
      v8::Local<v8::Object>::Cast(v8PointerValue->Get(isolate_));
  v8::Local<v8::Object> newObject =
      v8::Local<v8::Object>::New(isolate_, object);
  return new V8PointerValue(isolate_, newObject);
}

jsi::Runtime::PointerValue *V8Runtime::clonePropNameID(
    const Runtime::PointerValue *pv) {
  return cloneString(pv);
}

jsi::PropNameID V8Runtime::createPropNameIDFromAscii(
    const char *str,
    size_t length) {
  v8::HandleScope scopedIsolate(isolate_);
  V8PointerValue *value =
      V8PointerValue::createFromOneByte(isolate_, str, length);
  if (!value) {
    throw jsi::JSError(*this, "createFromOneByte() - string creation failed.");
  }

  return make<jsi::PropNameID>(value);
}

jsi::PropNameID V8Runtime::createPropNameIDFromUtf8(
    const uint8_t *utf8,
    size_t length) {
  v8::HandleScope scopedIsolate(isolate_);
  V8PointerValue *value =
      V8PointerValue::createFromUtf8(isolate_, utf8, length);
  if (!value) {
    throw jsi::JSError(*this, "createFromUtf8() - string creation failed.");
  }

  return make<jsi::PropNameID>(value);
}

jsi::PropNameID V8Runtime::createPropNameIDFromString(const jsi::String &str) {
  v8::HandleScope scopedIsolate(isolate_);

  const V8PointerValue *v8PointerValue =
      static_cast<const V8PointerValue *>(getPointerValue(str));
  assert(v8PointerValue->Get(isolate_)->IsString());

  v8::String::Utf8Value utf8(isolate_, v8PointerValue->Get(isolate_));
  return createPropNameIDFromUtf8(
      reinterpret_cast<const uint8_t *>(*utf8), utf8.length());
}

std::string V8Runtime::utf8(const jsi::PropNameID &sym) {
  v8::HandleScope scopedIsolate(isolate_);

  const V8PointerValue *v8PointerValue =
      static_cast<const V8PointerValue *>(getPointerValue(sym));
  v8::String::Utf8Value utf8(isolate_, v8PointerValue->Get(isolate_));
  return JSIV8ValueConverter::ToSTLString(utf8);
}

bool V8Runtime::compare(const jsi::PropNameID &a, const jsi::PropNameID &b) {
  v8::HandleScope scopedIsolate(isolate_);

  const V8PointerValue *v8PointerValueA =
      static_cast<const V8PointerValue *>(getPointerValue(a));
  const V8PointerValue *v8PointerValueB =
      static_cast<const V8PointerValue *>(getPointerValue(b));

  v8::Local<v8::String> v8StringA =
      v8::Local<v8::String>::Cast(v8PointerValueA->Get(isolate_));
  v8::Local<v8::String> v8StringB =
      v8::Local<v8::String>::Cast(v8PointerValueB->Get(isolate_));
  return v8StringA->StringEquals(v8StringB);
}

std::string V8Runtime::symbolToString(const jsi::Symbol &symbol) {
  return jsi::Value(*this, symbol).toString(*this).utf8(*this);
}

jsi::String V8Runtime::createStringFromAscii(const char *str, size_t length) {
  v8::HandleScope scopedIsolate(isolate_);
  V8PointerValue *value =
      V8PointerValue::createFromOneByte(isolate_, str, length);
  if (!value) {
    throw jsi::JSError(*this, "createFromOneByte() - string creation failed.");
  }

  return make<jsi::String>(value);
}

jsi::String V8Runtime::createStringFromUtf8(const uint8_t *str, size_t length) {
  v8::HandleScope scopedIsolate(isolate_);
  V8PointerValue *value = V8PointerValue::createFromUtf8(isolate_, str, length);
  if (!value) {
    throw jsi::JSError(*this, "createFromUtf8() - string creation failed.");
  }

  return make<jsi::String>(value);
}

std::string V8Runtime::utf8(const jsi::String &str) {
  v8::HandleScope scopedIsolate(isolate_);
  const V8PointerValue *v8PointerValue =
      static_cast<const V8PointerValue *>(getPointerValue(str));
  assert(v8PointerValue->Get(isolate_)->IsString());

  v8::String::Utf8Value utf8(isolate_, v8PointerValue->Get(isolate_));
  return JSIV8ValueConverter::ToSTLString(utf8);
}

jsi::Object V8Runtime::createObject() {
  v8::HandleScope scopedIsolate(isolate_);
  v8::Local<v8::Object> object = v8::Object::New(isolate_);
  return make<jsi::Object>(new V8PointerValue(isolate_, object));
}

jsi::Object V8Runtime::createObject(
    std::shared_ptr<jsi::HostObject> hostObject) {
  v8::HandleScope scopedIsolate(isolate_);
  HostObjectProxy *hostObjectProxy =
      new HostObjectProxy(*this, isolate_, hostObject);
  v8::Local<v8::Object> v8Object;

  v8::Local<v8::ObjectTemplate> hostObjectTemplate =
      v8::ObjectTemplate::New(isolate_);
  hostObjectTemplate->SetHandler(v8::NamedPropertyHandlerConfiguration(
      HostObjectProxy::Getter,
      HostObjectProxy::Setter,
      nullptr,
      nullptr,
      HostObjectProxy::Enumerator));
  hostObjectTemplate->SetInternalFieldCount(1);

  if (!hostObjectTemplate->NewInstance(isolate_->GetCurrentContext())
           .ToLocal(&v8Object)) {
    delete hostObjectProxy;
    throw jsi::JSError(*this, "Unable to create HostObject");
  }

  v8::Local<v8::External> wrappedHostObjectProxy =
      v8::External::New(isolate_, hostObjectProxy);
  v8Object->SetInternalField(0, wrappedHostObjectProxy);
  hostObjectProxy->BindFinalizer(v8Object);

  return make<jsi::Object>(new V8PointerValue(isolate_, v8Object));
}

std::shared_ptr<jsi::HostObject> V8Runtime::getHostObject(
    const jsi::Object &object) {
  assert(isHostObject(object));

  // We are guarenteed at this point to have isHostObject(obj) == true
  // so the internal data should be HostObjectMetadata
  v8::HandleScope scopedIsolate(isolate_);
  v8::Local<v8::Object> v8Object =
      JSIV8ValueConverter::ToV8Object(*this, object);
  v8::Local<v8::External> internalField =
      v8::Local<v8::External>::Cast(v8Object->GetInternalField(0));
  HostObjectProxy *hostObjectProxy =
      reinterpret_cast<HostObjectProxy *>(internalField->Value());
  assert(hostObjectProxy);
  return hostObjectProxy->GetHostObject();
}

jsi::HostFunctionType &V8Runtime::getHostFunction(
    const jsi::Function &function) {
  assert(isHostFunction(function));

  // We know that isHostFunction(function) is true here, so its safe to proceed
  v8::HandleScope scopedIsolate(isolate_);
  const V8PointerValue *v8PointerValue =
      static_cast<const V8PointerValue *>(getPointerValue(function));
  assert(v8PointerValue->Get(isolate_)->IsFunction());
  v8::Local<v8::Object> v8Object =
      v8::Local<v8::Object>::Cast(v8PointerValue->Get(isolate_));

  v8::Local<v8::External> internalField =
      v8::Local<v8::External>::Cast(v8Object->GetInternalField(0));
  HostFunctionProxy *hostFunctionProxy =
      reinterpret_cast<HostFunctionProxy *>(internalField->Value());
  assert(hostFunctionProxy);
  return hostFunctionProxy->GetHostFunction();
}

jsi::Value V8Runtime::getProperty(
    const jsi::Object &object,
    const jsi::PropNameID &name) {
  v8::HandleScope scopedIsolate(isolate_);
  v8::TryCatch tryCatch(isolate_);
  v8::Local<v8::Object> v8Object =
      JSIV8ValueConverter::ToV8Object(*this, object);

  v8::MaybeLocal<v8::Value> result = v8Object->Get(
      isolate_->GetCurrentContext(),
      JSIV8ValueConverter::ToV8String(*this, name));
  if (tryCatch.HasCaught()) {
    ReportException(isolate_, &tryCatch);
  }

  if (result.IsEmpty()) {
    return jsi::Value::undefined();
  }
  return JSIV8ValueConverter::ToJSIValue(isolate_, result.ToLocalChecked());
}

jsi::Value V8Runtime::getProperty(
    const jsi::Object &object,
    const jsi::String &name) {
  v8::HandleScope scopedIsolate(isolate_);
  v8::TryCatch tryCatch(isolate_);
  v8::Local<v8::Object> v8Object =
      JSIV8ValueConverter::ToV8Object(*this, object);

  v8::MaybeLocal<v8::Value> result = v8Object->Get(
      isolate_->GetCurrentContext(),
      JSIV8ValueConverter::ToV8String(*this, name));
  if (tryCatch.HasCaught()) {
    ReportException(isolate_, &tryCatch);
  }
  if (result.IsEmpty()) {
    return jsi::Value::undefined();
  }
  return JSIV8ValueConverter::ToJSIValue(isolate_, result.ToLocalChecked());
}

bool V8Runtime::hasProperty(
    const jsi::Object &object,
    const jsi::PropNameID &name) {
  v8::HandleScope scopedIsolate(isolate_);
  v8::TryCatch tryCatch(isolate_);
  v8::Local<v8::Object> v8Object =
      JSIV8ValueConverter::ToV8Object(*this, object);

  v8::Maybe<bool> result = v8Object->Has(
      isolate_->GetCurrentContext(),
      JSIV8ValueConverter::ToV8String(*this, name));
  if (tryCatch.HasCaught()) {
    ReportException(isolate_, &tryCatch);
  }
  if (result.IsNothing()) {
    return false;
    // throw jsi::JSError(*this, "V8Runtime::hasProperty failed.");
  }
  return result.FromJust();
}

bool V8Runtime::hasProperty(
    const jsi::Object &object,
    const jsi::String &name) {
  v8::HandleScope scopedIsolate(isolate_);
  v8::TryCatch tryCatch(isolate_);
  v8::Local<v8::Object> v8Object =
      JSIV8ValueConverter::ToV8Object(*this, object);

  v8::Maybe<bool> result = v8Object->Has(
      isolate_->GetCurrentContext(),
      JSIV8ValueConverter::ToV8String(*this, name));
  if (tryCatch.HasCaught()) {
    ReportException(isolate_, &tryCatch);
  }
  if (result.IsNothing()) {
    return false;
    // throw jsi::JSError(*this, "V8Runtime::hasProperty failed.");
  }
  return result.FromJust();
}

void V8Runtime::setPropertyValue(
    jsi::Object &object,
    const jsi::PropNameID &name,
    const jsi::Value &value) {
  v8::HandleScope scopedIsolate(isolate_);
  v8::Local<v8::Object> v8Object =
      JSIV8ValueConverter::ToV8Object(*this, object);

  if (v8Object
          ->Set(
              isolate_->GetCurrentContext(),
              JSIV8ValueConverter::ToV8String(*this, name),
              JSIV8ValueConverter::ToV8Value(*this, value))
          .IsNothing()) {
    throw jsi::JSError(*this, "V8Runtime::setPropertyValue failed.");
  }
}

void V8Runtime::setPropertyValue(
    jsi::Object &object,
    const jsi::String &name,
    const jsi::Value &value) {
  v8::HandleScope scopedIsolate(isolate_);
  v8::Local<v8::Object> v8Object =
      JSIV8ValueConverter::ToV8Object(*this, object);

  if (v8Object
          ->Set(
              isolate_->GetCurrentContext(),
              JSIV8ValueConverter::ToV8String(*this, name),
              JSIV8ValueConverter::ToV8Value(*this, value))
          .IsNothing()) {
    throw jsi::JSError(*this, "V8Runtime::setPropertyValue failed.");
  }
}

bool V8Runtime::isArray(const jsi::Object &object) const {
  v8::HandleScope scopedIsolate(isolate_);
  v8::Local<v8::Object> v8Object =
      JSIV8ValueConverter::ToV8Object(*this, object);
  return v8Object->IsArray();
}

bool V8Runtime::isArrayBuffer(const jsi::Object &object) const {
  // Current OSS JSI seems not have call flow to allocate ArrayBuffer
  assert(false);

  v8::HandleScope scopedIsolate(isolate_);
  v8::Local<v8::Object> v8Object =
      JSIV8ValueConverter::ToV8Object(*this, object);
  return v8Object->IsArrayBuffer();
}

bool V8Runtime::isFunction(const jsi::Object &object) const {
  v8::HandleScope scopedIsolate(isolate_);
  v8::Local<v8::Object> v8Object =
      JSIV8ValueConverter::ToV8Object(*this, object);
  return v8Object->IsFunction();
}

bool V8Runtime::isHostObject(const jsi::Object &object) const {
  v8::HandleScope scopedIsolate(isolate_);
  v8::Local<v8::Object> v8Object =
      JSIV8ValueConverter::ToV8Object(*this, object);
  return v8Object->InternalFieldCount() == 1;
}

bool V8Runtime::isHostFunction(const jsi::Function &function) const {
  v8::HandleScope scopedIsolate(isolate_);
  v8::Local<v8::Object> v8Object =
      JSIV8ValueConverter::ToV8Object(*this, function);
  return v8Object->InternalFieldCount() == 1 && v8Object->IsCallable();
}

jsi::Array V8Runtime::getPropertyNames(const jsi::Object &object) {
  v8::HandleScope scopedIsolate(isolate_);
  v8::Local<v8::Object> v8Object =
      JSIV8ValueConverter::ToV8Object(*this, object);
  v8::Local<v8::Array> propertyNames;
  if (!v8Object
           ->GetPropertyNames(
               isolate_->GetCurrentContext(),
               v8::KeyCollectionMode::kIncludePrototypes,
               static_cast<v8::PropertyFilter>(
                   v8::ONLY_ENUMERABLE | v8::SKIP_SYMBOLS),
               v8::IndexFilter::kIncludeIndices,
               v8::KeyConversionMode::kConvertToString)
           .ToLocal(&propertyNames)) {
    std::abort();
  }
  return make<jsi::Object>(new V8PointerValue(isolate_, propertyNames))
      .getArray(*this);
}

jsi::WeakObject V8Runtime::createWeakObject(const jsi::Object &weakObject) {
  throw std::logic_error("Not implemented");
}

jsi::Value V8Runtime::lockWeakObject(const jsi::WeakObject &weakObject) {
  throw std::logic_error("Not implemented");
}

jsi::Array V8Runtime::createArray(size_t length) {
  v8::HandleScope scopedIsolate(isolate_);
  v8::Local<v8::Array> v8Array =
      v8::Array::New(isolate_, static_cast<int>(length));
  return make<jsi::Object>(new V8PointerValue(isolate_, v8Array))
      .getArray(*this);
}

size_t V8Runtime::size(const jsi::Array &array) {
  v8::HandleScope scopedIsolate(isolate_);
  v8::Local<v8::Array> v8Array = JSIV8ValueConverter::ToV8Array(*this, array);
  return v8Array->Length();
}

size_t V8Runtime::size(const jsi::ArrayBuffer &arrayBuffer) {
  throw std::logic_error("Not implemented");
}

uint8_t *V8Runtime::data(const jsi::ArrayBuffer &arrayBuffer) {
  throw std::logic_error("Not implemented");
}

jsi::Value V8Runtime::getValueAtIndex(const jsi::Array &array, size_t i) {
  v8::HandleScope scopedIsolate(isolate_);
  v8::Local<v8::Array> v8Array = JSIV8ValueConverter::ToV8Array(*this, array);
  v8::MaybeLocal<v8::Value> result =
      v8Array->Get(isolate_->GetCurrentContext(), static_cast<uint32_t>(i));
  if (result.IsEmpty()) {
    throw jsi::JSError(*this, "V8Runtime::getValueAtIndex failed.");
  }
  return JSIV8ValueConverter::ToJSIValue(isolate_, result.ToLocalChecked());
}

void V8Runtime::setValueAtIndexImpl(
    jsi::Array &array,
    size_t i,
    const jsi::Value &value) {
  v8::HandleScope scopedIsolate(isolate_);
  v8::Local<v8::Array> v8Array = JSIV8ValueConverter::ToV8Array(*this, array);
  v8::Maybe<bool> result = v8Array->Set(
      isolate_->GetCurrentContext(),
      static_cast<uint32_t>(i),
      JSIV8ValueConverter::ToV8Value(*this, value));
  if (result.IsNothing()) {
    throw jsi::JSError(*this, "V8Runtime::setValueAtIndexImpl failed.");
  }
}

jsi::Function V8Runtime::createFunctionFromHostFunction(
    const jsi::PropNameID &name,
    unsigned int paramCount,
    jsi::HostFunctionType func) {
  v8::HandleScope scopedIsolate(isolate_);
  HostFunctionProxy *hostFunctionProxy =
      new HostFunctionProxy(*this, isolate_, std::move(func));

  v8::Local<v8::External> wrappedHostFunctionProxy =
      v8::External::New(isolate_, hostFunctionProxy);

  v8::Local<v8::FunctionTemplate> functionTemplate =
      v8::FunctionTemplate::New(isolate_);
  v8::Local<v8::ObjectTemplate> instanceTemplate =
      functionTemplate->InstanceTemplate();
  instanceTemplate->SetCallAsFunctionHandler(
      HostFunctionProxy::FunctionCallback, wrappedHostFunctionProxy);
  instanceTemplate->SetInternalFieldCount(1);

  v8::Local<v8::Object> v8Object =
      instanceTemplate->NewInstance(isolate_->GetCurrentContext())
          .ToLocalChecked();

  v8Object->SetInternalField(0, wrappedHostFunctionProxy);
  hostFunctionProxy->BindFinalizer(v8Object);

  return make<jsi::Object>(new V8PointerValue(isolate_, v8Object))
      .getFunction(*this);
}

jsi::Value V8Runtime::call(
    const jsi::Function &function,
    const jsi::Value &jsThis,
    const jsi::Value *args,
    size_t count) {
  v8::HandleScope scopedIsolate(isolate_);
  v8::TryCatch tryCatch(isolate_);
  v8::Local<v8::Function> v8Function =
      JSIV8ValueConverter::ToV8Function(*this, function);

  v8::Local<v8::Value> v8Receiver;
  if (jsThis.isUndefined()) {
    v8Receiver = context_.Get(isolate_)->Global();
  } else {
    v8Receiver = JSIV8ValueConverter::ToV8Value(*this, jsThis);
  }

  std::vector<v8::Local<v8::Value>> argv;
  for (size_t i = 0; i < count; i++) {
    v8::Local<v8::Value> v8ArgValue =
        JSIV8ValueConverter::ToV8Value(*this, args[i]);
    argv.push_back(v8ArgValue);
  }

  v8::MaybeLocal<v8::Value> result = v8Function->Call(
      isolate_->GetCurrentContext(),
      v8Receiver,
      static_cast<int>(count),
      argv.data());

  if (tryCatch.HasCaught()) {
    ReportException(isolate_, &tryCatch);
  }

  if (result.IsEmpty()) {
    return JSIV8ValueConverter::ToJSIValue(isolate_, v8::Undefined(isolate_));
  } else {
    return JSIV8ValueConverter::ToJSIValue(isolate_, result.ToLocalChecked());
  }
}

jsi::Value V8Runtime::callAsConstructor(
    const jsi::Function &function,
    const jsi::Value *args,
    size_t count) {
  v8::HandleScope scopedIsolate(isolate_);
  v8::TryCatch tryCatch(isolate_);
  v8::Local<v8::Function> v8Function =
      JSIV8ValueConverter::ToV8Function(*this, function);
  std::vector<v8::Local<v8::Value>> argv;
  for (size_t i = 0; i < count; i++) {
    v8::Local<v8::Value> v8ArgValue =
        JSIV8ValueConverter::ToV8Value(*this, args[i]);
    argv.push_back(v8ArgValue);
  }

  v8::Local<v8::Object> v8Object;
  if (!v8Function
           ->NewInstance(
               isolate_->GetCurrentContext(),
               static_cast<int>(count),
               argv.data())
           .ToLocal(&v8Object)) {
    throw jsi::JSError(*this, "CallAsConstructor failed");
  }

  if (tryCatch.HasCaught()) {
    ReportException(isolate_, &tryCatch);
  }

  return JSIV8ValueConverter::ToJSIValue(isolate_, v8Object);
}

bool V8Runtime::strictEquals(const jsi::Symbol &a, const jsi::Symbol &b) const {
  v8::HandleScope scopedIsolate(isolate_);
  v8::TryCatch tryCatch(isolate_);
  v8::Local<v8::Symbol> v8SymbolA = JSIV8ValueConverter::ToV8Symbol(*this, a);
  v8::Local<v8::Symbol> v8SymbolB = JSIV8ValueConverter::ToV8Symbol(*this, b);
  bool result = v8SymbolA->StrictEquals(v8SymbolB);

  if (tryCatch.HasCaught()) {
    ReportException(isolate_, &tryCatch);
  }
  return result;
}

bool V8Runtime::strictEquals(const jsi::String &a, const jsi::String &b) const {
  v8::HandleScope scopedIsolate(isolate_);
  v8::TryCatch tryCatch(isolate_);
  v8::Local<v8::String> v8StringA = JSIV8ValueConverter::ToV8String(*this, a);
  v8::Local<v8::String> v8StringB = JSIV8ValueConverter::ToV8String(*this, b);
  bool result = v8StringA->StrictEquals(v8StringB);

  if (tryCatch.HasCaught()) {
    ReportException(isolate_, &tryCatch);
  }
  return result;
}

bool V8Runtime::strictEquals(const jsi::Object &a, const jsi::Object &b) const {
  v8::HandleScope scopedIsolate(isolate_);
  v8::TryCatch tryCatch(isolate_);
  v8::Local<v8::Object> v8ObjectA = JSIV8ValueConverter::ToV8Object(*this, a);
  v8::Local<v8::Object> v8ObjectB = JSIV8ValueConverter::ToV8Object(*this, b);
  bool result = v8ObjectA->StrictEquals(v8ObjectB);

  if (tryCatch.HasCaught()) {
    ReportException(isolate_, &tryCatch);
  }
  return result;
}

bool V8Runtime::instanceOf(const jsi::Object &o, const jsi::Function &f) {
  v8::HandleScope scopedIsolate(isolate_);
  v8::TryCatch tryCatch(isolate_);
  v8::Local<v8::Object> v8Object = JSIV8ValueConverter::ToV8Object(*this, o);
  v8::Local<v8::Object> v8Function = JSIV8ValueConverter::ToV8Object(*this, f);
  bool result = v8Object->InstanceOf(isolate_->GetCurrentContext(), v8Function)
                    .ToChecked();

  if (tryCatch.HasCaught()) {
    ReportException(isolate_, &tryCatch);
  }
  return result;
}

//
// JS function/object handler callbacks
//

// static
void V8Runtime::GetRuntimeInfo(
    const v8::FunctionCallbackInfo<v8::Value> &args) {
  v8::Isolate *isolate = args.GetIsolate();
  v8::HandleScope scopedIsolate(isolate);
  v8::Local<v8::Object> runtimeInfo = v8::Object::New(isolate);
  v8::Local<v8::Context> context(isolate->GetCurrentContext());

  v8::Local<v8::String> versionKey =
      v8::String::NewFromUtf8(isolate, "version", v8::NewStringType::kNormal)
          .ToLocalChecked();
  v8::Local<v8::String> versionValue =
      v8::String::NewFromUtf8(
          args.GetIsolate(), v8::V8::GetVersion(), v8::NewStringType::kNormal)
          .ToLocalChecked();
  runtimeInfo->Set(context, versionKey, versionValue).Check();

  v8::Local<v8::String> memoryKey =
      v8::String::NewFromUtf8(isolate, "memory", v8::NewStringType::kNormal)
          .ToLocalChecked();
  v8::Local<v8::Object> memoryInfo = v8::Object::New(isolate);
  v8::HeapStatistics heapStats;
  isolate->GetHeapStatistics(&heapStats);
  memoryInfo
      ->Set(
          context,
          v8::String::NewFromUtf8(
              isolate, "jsHeapSizeLimit", v8::NewStringType::kNormal)
              .ToLocalChecked(),
          v8::Number::New(isolate, heapStats.heap_size_limit()))
      .Check();
  memoryInfo
      ->Set(
          context,
          v8::String::NewFromUtf8(
              isolate, "totalJSHeapSize", v8::NewStringType::kNormal)
              .ToLocalChecked(),
          v8::Number::New(isolate, heapStats.total_heap_size()))
      .Check();
  memoryInfo
      ->Set(
          context,
          v8::String::NewFromUtf8(
              isolate, "usedJSHeapSize", v8::NewStringType::kNormal)
              .ToLocalChecked(),
          v8::Number::New(isolate, heapStats.used_heap_size()))
      .Check();
  runtimeInfo->Set(context, memoryKey, memoryInfo).Check();

  args.GetReturnValue().Set(runtimeInfo);
}

} // namespace facebook
