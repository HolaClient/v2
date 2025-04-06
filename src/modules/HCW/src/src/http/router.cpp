#include "router.hpp"
#include "request.hpp"
#include "response.hpp"
#include <sstream>
#include <regex>
#include <iostream>

namespace http {

void Router::add_route(Method method, const std::string& path, RequestHandler handler) {
    std::vector<std::string> param_names;
    Route route{
        .method = method,
        .path = path,
        .pattern = std::regex(path_to_pattern(path, param_names)),
        .paramNames = std::move(param_names),
        .handler = std::move(handler)
    };
    dynamic_routes_.push_back(std::move(route));
}

void Router::use(RequestHandler middleware) {
    middleware_.push_back(std::move(middleware));
}

bool Router::handle(Request& req, Response& res) {
    for (auto& mw : middleware_) {
        if (!mw(req, res)) return false;
    }
    return match_route(req, res);
}

bool Router::match_route(const Request& req, Response& res) {
    auto& method_routes = static_routes_[req.get_method()];
    std::string path_str{req.get_path()};
    auto it = method_routes.find(path_str);
    if (it != method_routes.end()) {
        Request mutable_req = req;
        return it->second(mutable_req, res);
    }

    for (const auto& route : dynamic_routes_) {
        if (route.method == req.get_method()) {
            Request temp_req = req;
            if (match_route(route, req.get_path(), temp_req)) {
                return route.handler(temp_req, res);
            }
        }
    }
    return false;
}

bool Router::match_route(const Route& route, std::string_view path, Request& req) {
    std::string path_str{path};
    std::smatch matches;
    if (std::regex_match(path_str, matches, route.pattern)) {
        for (size_t i = 1; i < matches.size(); ++i) {
            if (i-1 < route.paramNames.size()) {
                std::string param_value = matches[i].str();
                std::cout << "Setting param " << route.paramNames[i-1] 
                         << " = " << param_value << std::endl;
                req.set_param(route.paramNames[i-1], param_value);
            }
        }
        return true;
    }
    return false;
}

std::string Router::path_to_pattern(const std::string& path, std::vector<std::string>& param_names) {
    std::string pattern;
    std::string param_name;
    bool in_param = false;
    
    for (char c : path) {
        if (c == ':') {
            in_param = true;
            param_name.clear();
        } else if (in_param) {
            if (std::isalnum(c) || c == '_') {
                param_name += c;
            } else {
                in_param = false;
                param_names.push_back(param_name);
                pattern += "([^/]+)";
                pattern += c;
            }
        } else {
            if (c == '/' || c == '.' || c == '-') {
                pattern += '\\';
            }
            pattern += c;
        }
    }
    
    if (in_param) {
        param_names.push_back(param_name);
        pattern += "([^/]+)";
    }
    
    return "^" + pattern + "$";
}

}