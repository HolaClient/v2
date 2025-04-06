#pragma once
#include "types.h"
#include <string>
#include <vector>
#include <regex>

namespace http {
    class Router {
    private:
        struct Route {
            Method method;
            std::string path;
            std::regex pattern;
            std::vector<std::string> paramNames;
            std::function<void(Request&, Response&)> handler;
        };
        
        std::vector<Route> routes;
        std::vector<std::function<void(Request&, Response&)>> middleware;
        
        bool match_route(const Route& route, const std::string& path, Request& req);

    public:
        void add_route(Method method, const std::string& path, std::function<void(Request&, Response&)> handler);
        bool handle(Request& req, Response& res);
        void use(std::function<void(Request&, Response&)> handler);
        
        void get(const std::string& path, std::function<void(Request&, Response&)> handler) {
            add_route(Method::GET, path, handler);
        }
        
        void post(const std::string& path, std::function<void(Request&, Response&)> handler) {
            add_route(Method::POST, path, handler);
        }
    };
}
