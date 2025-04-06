#pragma once
#define NOMINMAX

#ifdef _WIN32
  #define EXPORT __declspec(dllexport)
#else
  #define EXPORT __attribute__((visibility("default")))
#endif

#include <napi.h>
#include <memory>
#include <functional>
#include <atomic>
#include <mutex>

namespace http {
    class HTTPServer;
}

class EXPORT ServerWrap : public Napi::ObjectWrap<ServerWrap> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    ServerWrap(const Napi::CallbackInfo& info);
    ~ServerWrap();

private:
    static Napi::FunctionReference constructor;
    
    Napi::Value Start(const Napi::CallbackInfo& info);
    Napi::Value Stop(const Napi::CallbackInfo& info);
    Napi::Value Get(const Napi::CallbackInfo& info);
    Napi::Value Post(const Napi::CallbackInfo& info);
    Napi::Value Use(const Napi::CallbackInfo& info);

    std::unique_ptr<http::HTTPServer> server;
    std::atomic<bool> running{false};
    Napi::ThreadSafeFunction tsfn;
    std::mutex callback_mutex;
};
