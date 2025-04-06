#pragma once
#include "types.h"
#include "request.hpp"
#include "response.hpp"
#include <functional>
#include <string>
#include <vector>
#include <map>
#include <regex>
#include <unordered_map>
#include <string_view>
#include <span>
#include <array>
#include <atomic>

#if defined _WIN32 || defined __CYGWIN__
  #define HC_EXPORT __declspec(dllexport)
#else
  #define HC_EXPORT __attribute__((visibility("default")))
#endif

namespace http {
    class HC_EXPORT Router {
    public:
        Router() = default;
        virtual ~Router() = default;

        void get(const std::string& path, RequestHandler handler) {
            if (path.find(':') == std::string::npos) {
                static_routes_[Method::GET][path] = std::move(handler);
            } else {
                add_route(Method::GET, path, std::move(handler));
            }
        }

        void post(const std::string& path, RequestHandler handler) {
            add_route(Method::POST, path, std::move(handler));
        }

        HC_EXPORT void use(RequestHandler middleware);
        HC_EXPORT void add_route(Method method, const std::string& path, RequestHandler handler);
        HC_EXPORT bool handle(Request& req, Response& res);
        bool handle_batch(const std::vector<Request>& requests, std::vector<Response>& responses);

    private:
        struct alignas(64) Route {
            Method method;
            std::string path;
            std::regex pattern;
            std::vector<std::string> paramNames;
            RequestHandler handler;
        };

        struct StringViewHash {
            size_t operator()(std::string_view sv) const {
                size_t hash = 14695981039346656037ULL;
                for (char c : sv) {
                    hash ^= c;
                    hash *= 1099511628211ULL;
                }
                return hash;
            }
        };
        
        using StaticRouteMap = std::unordered_map<std::string, RequestHandler>;
        std::unordered_map<Method, StaticRouteMap> static_routes_;
        
        std::vector<Route> dynamic_routes_;
        std::vector<RequestHandler> middleware_;
        
        static constexpr size_t BATCH_SIZE = 64;
        std::atomic<size_t> pool_index_{0};

        bool match_route(const Route& route, std::string_view path, Request& req);
        bool match_route(const Request& req, Response& res);
        std::string path_to_pattern(const std::string& path, std::vector<std::string>& param_names);
    };
}
