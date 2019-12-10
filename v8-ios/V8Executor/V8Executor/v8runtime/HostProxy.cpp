#include "HostProxy.h"

#include "JSIV8ValueConverter.h"

namespace facebook {

HostObjectProxy::HostObjectProxy(
    V8Runtime &runtime,
    v8::Isolate *isolate,
    std::shared_ptr<jsi::HostObject> hostObject)
    : runtime_(runtime), isolate_(isolate), hostObject_(hostObject) {}

void HostObjectProxy::BindFinalizer(const v8::Local<v8::Object> &object) {
  v8::HandleScope scopedIsolate(isolate_);
  weakHandle_.Reset(isolate_, object);
  weakHandle_.SetWeak(this, Finalizer, v8::WeakCallbackType::kParameter);
}

std::shared_ptr<jsi::HostObject> HostObjectProxy::GetHostObject() {
  return hostObject_;
}

// static
void HostObjectProxy::Getter(
    v8::Local<v8::Name> property,
    const v8::PropertyCallbackInfo<v8::Value> &info) {
  v8::HandleScope scopedIsolate(info.GetIsolate());
  v8::Local<v8::External> data =
      v8::Local<v8::External>::Cast(info.This()->GetInternalField(0));
  HostObjectProxy *hostObjectProxy =
      reinterpret_cast<HostObjectProxy *>(data->Value());

  assert(hostObjectProxy);

  auto &runtime = hostObjectProxy->runtime_;
  jsi::PropNameID sym = JSIV8ValueConverter::ToJSIPropNameID(runtime, property);
  jsi::Value ret;
  try {
    ret = hostObjectProxy->hostObject_->get(runtime, sym);
  } catch (const jsi::JSError &error) {
    info.GetIsolate()->ThrowException(
        JSIV8ValueConverter::ToV8Value(runtime, error.value()));
    return;
  } catch (const std::exception &ex) {
    auto excValue =
        runtime.global()
            .getPropertyAsFunction(runtime, "Error")
            .call(
                runtime,
                std::string("Exception in HostObject::get(property:") +
                    JSIV8ValueConverter::ToSTLString(
                        info.GetIsolate(), property) +
                    std::string("): ") + ex.what());
    info.GetIsolate()->ThrowException(
        JSIV8ValueConverter::ToV8Value(runtime, excValue));
    return;
  } catch (...) {
    auto excValue =
        runtime.global()
            .getPropertyAsFunction(runtime, "Error")
            .call(
                runtime,
                std::string("Exception in HostObject::get(property:") +
                    JSIV8ValueConverter::ToSTLString(
                        info.GetIsolate(), property) +
                    std::string("): <unknown>"));
    info.GetIsolate()->ThrowException(
        JSIV8ValueConverter::ToV8Value(runtime, excValue));
    return;
  }
  info.GetReturnValue().Set(JSIV8ValueConverter::ToV8Value(runtime, ret));
}

// static
void HostObjectProxy::Setter(
    v8::Local<v8::Name> property,
    v8::Local<v8::Value> value,
    const v8::PropertyCallbackInfo<v8::Value> &info) {
  v8::HandleScope scopedIsolate(info.GetIsolate());
  v8::Local<v8::External> data =
      v8::Local<v8::External>::Cast(info.This()->GetInternalField(0));
  HostObjectProxy *hostObjectProxy =
      reinterpret_cast<HostObjectProxy *>(data->Value());

  assert(hostObjectProxy);
  auto &runtime = hostObjectProxy->runtime_;
  jsi::PropNameID sym = JSIV8ValueConverter::ToJSIPropNameID(runtime, property);
  try {
    hostObjectProxy->hostObject_->set(
        runtime,
        sym,
        JSIV8ValueConverter::ToJSIValue(info.GetIsolate(), value));
  } catch (const jsi::JSError &error) {
    info.GetIsolate()->ThrowException(
        JSIV8ValueConverter::ToV8Value(runtime, error.value()));
    return;
  } catch (const std::exception &ex) {
    auto excValue =
        runtime.global()
            .getPropertyAsFunction(runtime, "Error")
            .call(
                runtime,
                std::string("Exception in HostObject::set(property:") +
                    JSIV8ValueConverter::ToSTLString(
                        info.GetIsolate(), property) +
                    std::string("): ") + ex.what());
    info.GetIsolate()->ThrowException(
        JSIV8ValueConverter::ToV8Value(runtime, excValue));
    return;
  } catch (...) {
    auto excValue =
        runtime.global()
            .getPropertyAsFunction(runtime, "Error")
            .call(
                runtime,
                std::string("Exception in HostObject::set(property:") +
                    JSIV8ValueConverter::ToSTLString(
                        info.GetIsolate(), property) +
                    std::string("): <unknown>"));
    info.GetIsolate()->ThrowException(
        JSIV8ValueConverter::ToV8Value(runtime, excValue));
    return;
  }
  return;
}

// static
void HostObjectProxy::Enumerator(
    const v8::PropertyCallbackInfo<v8::Array> &info) {
  v8::HandleScope scopedIsolate(info.GetIsolate());
  v8::Local<v8::External> data =
      v8::Local<v8::External>::Cast(info.This()->GetInternalField(0));
  HostObjectProxy *hostObjectProxy =
      reinterpret_cast<HostObjectProxy *>(data->Value());

  assert(hostObjectProxy);

  auto &runtime = hostObjectProxy->runtime_;

  auto names = hostObjectProxy->hostObject_->getPropertyNames(runtime);

  v8::Local<v8::Array> result =
      v8::Array::New(info.GetIsolate(), static_cast<int>(names.size()));
  v8::Local<v8::Context> context = info.GetIsolate()->GetCurrentContext();

  for (uint32_t i = 0; i < result->Length(); ++i) {
    v8::Local<v8::Value> value =
        JSIV8ValueConverter::ToV8String(runtime, names[i]);
    if (!result->Set(context, i, value).FromJust()) {
      std::abort();
    };
  }

  info.GetReturnValue().Set(result);
}

// static
void HostObjectProxy::Finalizer(
    const v8::WeakCallbackInfo<HostObjectProxy> &data) {
  auto *pThis = data.GetParameter();
  assert(pThis->hostObject_.use_count() == 1);
  pThis->hostObject_.reset();
  pThis->weakHandle_.Reset();
  delete pThis;
}

HostFunctionProxy::HostFunctionProxy(
    V8Runtime &runtime,
    v8::Isolate *isolate,
    jsi::HostFunctionType &&hostFunction)
    : runtime_(runtime),
      isolate_(isolate),
      hostFunction_(std::move(hostFunction)) {}

void HostFunctionProxy::BindFinalizer(const v8::Local<v8::Object> &object) {
  v8::HandleScope scopedIsolate(isolate_);
  weakHandle_.Reset(isolate_, object);
  weakHandle_.SetWeak(this, Finalizer, v8::WeakCallbackType::kParameter);
}

jsi::HostFunctionType &HostFunctionProxy::GetHostFunction() {
  return hostFunction_;
}

// static
void HostFunctionProxy::Finalizer(
    const v8::WeakCallbackInfo<HostFunctionProxy> &data) {
  auto *pThis = data.GetParameter();
  pThis->weakHandle_.Reset();
  delete pThis;
}

// static
void HostFunctionProxy::FunctionCallback(
    const v8::FunctionCallbackInfo<v8::Value> &info) {
  v8::HandleScope scopedIsolate(info.GetIsolate());
  v8::Local<v8::External> data = v8::Local<v8::External>::Cast(info.Data());
  auto *hostFunctionProxy =
      reinterpret_cast<HostFunctionProxy *>(data->Value());

  auto &runtime = hostFunctionProxy->runtime_;

  int argumentCount = info.Length();
  const unsigned maxStackArgCount = 8;
  jsi::Value stackArgs[maxStackArgCount];
  std::unique_ptr<jsi::Value[]> heapArgs;
  jsi::Value *args;
  if (argumentCount > maxStackArgCount) {
    heapArgs = std::make_unique<jsi::Value[]>(argumentCount);
    for (size_t i = 0; i < argumentCount; i++) {
      heapArgs[i] = JSIV8ValueConverter::ToJSIValue(info.GetIsolate(), info[i]);
    }
    args = heapArgs.get();
  } else {
    for (size_t i = 0; i < argumentCount; i++) {
      stackArgs[i] =
          JSIV8ValueConverter::ToJSIValue(info.GetIsolate(), info[i]);
    }
    args = stackArgs;
  }

  v8::Local<v8::Value> result;
  jsi::Value thisVal(
      JSIV8ValueConverter::ToJSIValue(info.GetIsolate(), info.This()));
  try {
    result = JSIV8ValueConverter::ToV8Value(
        runtime,
        hostFunctionProxy->hostFunction_(
            runtime, thisVal, args, argumentCount));
  } catch (const jsi::JSError &error) {
    info.GetIsolate()->ThrowException(
        JSIV8ValueConverter::ToV8Value(runtime, error.value()));
    return;
  } catch (const std::exception &ex) {
    std::string exceptionString("Exception in HostFunction: ");
    exceptionString += ex.what();
    auto excValue = runtime.global()
                        .getPropertyAsFunction(runtime, "Error")
                        .call(runtime, exceptionString);

    info.GetIsolate()->ThrowException(
        JSIV8ValueConverter::ToV8Value(runtime, excValue));
    return;
  } catch (...) {
    std::string exceptionString("Exception in HostFunction: <unknown>");
    auto excValue = runtime.global()
                        .getPropertyAsFunction(runtime, "Error")
                        .call(runtime, exceptionString);

    info.GetIsolate()->ThrowException(
        JSIV8ValueConverter::ToV8Value(runtime, excValue));
    return;
  }
  info.GetReturnValue().Set(result);
}

} // namespace facebook
