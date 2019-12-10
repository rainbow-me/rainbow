/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifndef FOLLY_NO_CONFIG
#define FOLLY_NO_CONFIG 1
#endif

#ifndef FOLLY_MOBILE
#define FOLLY_MOBILE 1
#endif

#ifndef FOLLY_USE_LIBCPP
#define FOLLY_USE_LIBCPP 1
#endif

#ifndef FOLLY_HAVE_PTHREAD
#define FOLLY_HAVE_PTHREAD 1
#endif

#include <jsireact/JSIExecutor.h>

namespace facebook {
namespace react {

class V8ExecutorFactory : public JSExecutorFactory {
public:
  explicit V8ExecutorFactory(
      JSIExecutor::RuntimeInstaller runtimeInstaller)
      : runtimeInstaller_(std::move(runtimeInstaller)) {}

  std::unique_ptr<JSExecutor> createJSExecutor(
      std::shared_ptr<ExecutorDelegate> delegate,
      std::shared_ptr<MessageQueueThread> jsQueue) override;

private:
  JSIExecutor::RuntimeInstaller runtimeInstaller_;
};

} // namespace react
} // namespace facebook
