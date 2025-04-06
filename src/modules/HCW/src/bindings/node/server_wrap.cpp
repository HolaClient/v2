#include "server_wrap.h"
#include "http/server.hpp"
#include "http/router.hpp"
#include "http/request.hpp"
#include "http/response.hpp"
#include "http/parser.h"
#include "../src/socket.h"
#include <thread>
#include <functional>
#include <memory>
#include <string>
#include <napi.h>

Napi::FunctionReference ServerWrap::constructor;

Napi::Object ServerWrap::Init(Napi::Env env, Napi::Object exports) {
    Napi::HandleScope scope(env);

    Napi::Function func = DefineClass(env, "Server", {
        InstanceMethod("start", &ServerWrap::Start),
        InstanceMethod("stop", &ServerWrap::Stop),
        InstanceMethod("get", &ServerWrap::Get),
        InstanceMethod("post", &ServerWrap::Post),
        InstanceMethod("use", &ServerWrap::Use)
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("Server", func);
    return exports;
}

ServerWrap::ServerWrap(const Napi::CallbackInfo& info) 
    : Napi::ObjectWrap<ServerWrap>(info) {
    server = std::make_unique<http::HTTPServer>();
}

ServerWrap::~ServerWrap() {
    if (running) {
        server->stop();
    }
    if (tsfn) {
        tsfn.Release();
    }
}

Napi::Value ServerWrap::Start(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        throw Napi::Error::New(env, "Port number expected");
    }

    uint16_t port = info[0].As<Napi::Number>().Uint32Value();
    
    tsfn = Napi::ThreadSafeFunction::New(
        env,
        Napi::Function::New(env, [](const Napi::CallbackInfo&){}),
        "ServerCallback",
        0,
         1,
        [this](Napi::Env) {
            if (running) {
                server->stop();
                running = false;
            }
        }
    );

    std::thread([this, port]() {
        try {
            running = server->start(port);
            if (!running) {
                tsfn.Release();
            }
        } catch (...) {
            running = false;
            tsfn.Release();
        }
    }).detach();

    return Napi::Boolean::New(env, true);
}

Napi::Value ServerWrap::Stop(const Napi::CallbackInfo& info) {
    running = false;
    return Napi::Boolean::New(info.Env(), true);
}

Napi::Value ServerWrap::Get(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsFunction()) {
        throw Napi::Error::New(env, "Expected path and callback");
    }

    std::string path = info[0].As<Napi::String>().Utf8Value();
    Napi::Function callback = info[1].As<Napi::Function>();

    auto cb = std::make_shared<Napi::FunctionReference>(Napi::Persistent(callback));

    server->get(path, [cb, this](http::Request& req, http::Response& res) -> bool {
        if (!running || !tsfn) return false;

        struct CallbackData {
            http::Request& req;
            http::Response& res;
            std::shared_ptr<Napi::FunctionReference> callback;
        };

        auto data = new CallbackData{req, res, cb};
        
        auto status = tsfn.BlockingCall(data, [](Napi::Env env, Napi::Function jsCallback, CallbackData* data) {
            try {
                auto req_obj = Napi::Object::New(env);
                auto res_obj = Napi::Object::New(env);
                
                req_obj.Set("method", "GET");
                req_obj.Set("path", data->req.get_path());
                req_obj.Set("body", data->req.get_body());
                
                data->callback->Call({req_obj, res_obj});

                data->res.status = res_obj.Has("statusCode") ? 
                    static_cast<http::Status>(res_obj.Get("statusCode").ToNumber().Int32Value()) :
                    http::Status::OK;

                if (res_obj.Has("headers")) {
                    auto headers = res_obj.Get("headers").As<Napi::Object>();
                    auto header_names = headers.GetPropertyNames();
                    for (uint32_t i = 0; i < header_names.Length(); i++) {
                        auto name = header_names.Get(i).As<Napi::String>();
                        data->res.headers[name.Utf8Value()] = 
                            headers.Get(name).As<Napi::String>().Utf8Value();
                    }
                }

                if (data->res.headers.find("Content-Type") == data->res.headers.end()) {
                    data->res.headers["Content-Type"] = "text/plain";
                }

                if (res_obj.Has("body")) {
                    data->res.body = res_obj.Get("body").ToString().Utf8Value();
                } else {
                    data->res.body = "OK";
                }

                data->res.headers["Content-Length"] = std::to_string(data->res.body.size());
                data->res.headers["Connection"] = "close";

            } catch (const std::exception& e) {
                data->res.status = http::Status::InternalError;
                data->res.headers["Content-Type"] = "text/plain";
                data->res.body = "Internal Server Error";
                data->res.headers["Content-Length"] = std::to_string(data->res.body.size());
                data->res.headers["Connection"] = "close";
            }

            delete data;
            return env.Undefined();
        });

        return status == napi_ok;
    });

    return env.Undefined();
}

Napi::Value ServerWrap::Post(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsFunction()) {
        throw Napi::Error::New(env, "Expected path and callback");
    }

    std::string path = info[0].As<Napi::String>().Utf8Value();
    Napi::Function callback = info[1].As<Napi::Function>();

    auto cb = std::make_shared<Napi::FunctionReference>(Napi::Persistent(callback));

    server->post(path, [cb, this](http::Request& req, http::Response& res) -> bool {
        if (!running || !tsfn) return false;

        struct CallbackData {
            http::Request& req;
            http::Response& res;
            std::shared_ptr<Napi::FunctionReference> callback;
        };

        auto data = new CallbackData{req, res, cb};
        
        auto status = tsfn.BlockingCall(data, [](Napi::Env env, Napi::Function jsCallback, CallbackData* data) {
            auto req_obj = Napi::Object::New(env);
            req_obj.Set("method", "POST");
            req_obj.Set("path", data->req.get_path());
            req_obj.Set("body", data->req.get_body());

            auto headers = Napi::Object::New(env);
            for (const auto& name : {"Content-Type", "Accept", "User-Agent", "Host"}) {
                std::string value = data->req.get_header(name);
                if (!value.empty()) {
                    headers.Set(name, value);
                }
            }
            req_obj.Set("headers", headers);

            auto res_obj = Napi::Object::New(env);
            
            jsCallback.Call({req_obj, res_obj});

            if (!res_obj.Has("body") || res_obj.Get("body").IsEmpty()) {
                res_obj.Set("body", "OK");
            }
            if (!res_obj.Has("statusCode")) {
                res_obj.Set("statusCode", 200);
            }
            if (!res_obj.Has("headers")) {
                auto defaultHeaders = Napi::Object::New(env);
                defaultHeaders.Set("Content-Type", "text/plain");
                res_obj.Set("headers", defaultHeaders);
            }

            data->res.status = static_cast<http::Status>(
                res_obj.Get("statusCode").ToNumber().Int32Value()
            );
            
            if (res_obj.Has("headers")) {
                auto headers = res_obj.Get("headers").As<Napi::Object>();
                auto header_names = headers.GetPropertyNames();
                for (uint32_t i = 0; i < header_names.Length(); i++) {
                    auto name = header_names.Get(i).As<Napi::String>();
                    data->res.headers[name.Utf8Value()] = 
                        headers.Get(name).As<Napi::String>().Utf8Value();
                }
            }

            data->res.body = res_obj.Get("body").ToString().Utf8Value();
            
            delete data;
            return env.Undefined();
        });

        return status == napi_ok;
    });

    return env.Undefined();
}

Napi::Value ServerWrap::Use(const Napi::CallbackInfo& info) {
    return info.Env().Undefined();
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    return ServerWrap::Init(env, exports);
}

namespace {

class RouterWrap : public Napi::ObjectWrap<RouterWrap> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports) {
        Napi::Function func = DefineClass(env, "Router", {
            InstanceMethod("handle", &RouterWrap::Handle),
            InstanceMethod("use", &RouterWrap::Use),
            InstanceMethod("addRoute", &RouterWrap::AddRoute)
        });

        constructor = Napi::Persistent(func);
        constructor.SuppressDestruct();
        exports.Set("Router", func);
        return exports;
    }

    RouterWrap(const Napi::CallbackInfo& info) : 
        Napi::ObjectWrap<RouterWrap>(info),
        router_(std::make_unique<http::Router>()) {}

private:
    static Napi::FunctionReference constructor;

    Napi::Value Handle(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        
        if (info.Length() < 2) {
            throw Napi::Error::New(env, "Expected request and response objects");
        }

        auto req_obj = info[0].As<Napi::Object>();
        auto res_obj = info[1].As<Napi::Object>();

        http::Request req;
        req.set_method(http::string_to_method(
            req_obj.Get("method").As<Napi::String>().Utf8Value()
        ));
        req.set_path(req_obj.Get("path").As<Napi::String>().Utf8Value());
        
        if (req_obj.Has("body")) {
            req.set_body(req_obj.Get("body").As<Napi::String>().Utf8Value());
        }

        auto headers = req_obj.Get("headers").As<Napi::Object>();
        auto header_names = headers.GetPropertyNames();
        for (uint32_t i = 0; i < header_names.Length(); i++) {
            auto name = header_names.Get(i).As<Napi::String>();
            req.set_header(name.Utf8Value(), 
                         headers.Get(name).As<Napi::String>().Utf8Value());
        }

        http::Response res;

        bool result = router_->handle(req, res);

        if (result) {
            res_obj.Set("statusCode", static_cast<int>(res.status));
            
            auto res_headers = Napi::Object::New(env);
            for (const auto& [key, value] : res.headers) {
                res_headers.Set(key, value);
            }
            res_obj.Set("headers", res_headers);
            
            res_obj.Set("body", res.body);
        }

        return Napi::Boolean::New(env, result);
    }

    Napi::Value Use(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        
        if (info.Length() < 1 || !info[0].IsFunction()) {
            throw Napi::Error::New(env, "Expected middleware function");
        }

        auto callback = std::make_shared<Napi::FunctionReference>(
            Napi::Persistent(info[0].As<Napi::Function>())
        );

        router_->use([callback](http::Request& req, http::Response& res) -> bool {
            auto env = callback->Env();
            Napi::HandleScope scope(env);

            auto req_obj = Napi::Object::New(env);
            req_obj.Set("method", http::method_to_string(req.get_method()));
            req_obj.Set("path", req.get_path());
            req_obj.Set("body", req.get_body());

            auto res_obj = Napi::Object::New(env);

            auto result = callback->Call({req_obj, res_obj});
            return result.IsBoolean() ? result.As<Napi::Boolean>().Value() : true;
        });

        return env.Undefined();
    }

    Napi::Value AddRoute(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        
        if (info.Length() < 3 || !info[0].IsNumber() || !info[1].IsString() || !info[2].IsFunction()) {
            throw Napi::Error::New(env, "Expected method, path and handler function");
        }

        auto method = static_cast<http::Method>(info[0].As<Napi::Number>().Int32Value());
        std::string path = info[1].As<Napi::String>().Utf8Value();
        
        auto callback = std::make_shared<Napi::FunctionReference>(
            Napi::Persistent(info[2].As<Napi::Function>())
        );

        router_->add_route(method, path, [callback](http::Request& req, http::Response& res) -> bool {
            auto env = callback->Env();
            Napi::HandleScope scope(env);

            auto req_obj = Napi::Object::New(env);
            req_obj.Set("method", http::method_to_string(req.get_method()));
            req_obj.Set("path", req.get_path());
            req_obj.Set("body", req.get_body());

            auto res_obj = Napi::Object::New(env);

            auto result = callback->Call({req_obj, res_obj});
            return result.IsBoolean() ? result.As<Napi::Boolean>().Value() : true;
        });

        return env.Undefined();
    }

    std::unique_ptr<http::Router> router_;
};

Napi::FunctionReference RouterWrap::constructor;

}

Napi::Object InitModule(Napi::Env env, Napi::Object exports) {
    exports = ServerWrap::Init(env, exports);
    exports = RouterWrap::Init(env, exports);
    return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, InitModule)
