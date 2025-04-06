#pragma once
#include "methods.hpp"
#include <string>
#include <unordered_map>
#include <string_view>

namespace http {

class Request {
private:
    Method method_;
    std::string path_; 
    std::string body_;
    std::unordered_map<std::string, std::string> headers_;
    std::unordered_map<std::string, std::string> params_;
    std::string raw_data_;

public:
    Request() : method_(Method::UNKNOWN) {}

    Method get_method() const { return method_; }
    const std::string& get_path() const { return path_; }
    const std::string& get_body() const { return body_; }
    
    void set_method(const std::string& method_str) { 
        method_ = string_to_method(method_str); 
    }
    void set_method(Method m) { method_ = m; }
    void set_path(std::string p) { path_ = std::move(p); }
    void set_body(std::string b) { body_ = std::move(b); }
    void set_header(const std::string& key, std::string value) {
        headers_[key] = std::move(value);
    }
    void set_param(const std::string& key, std::string value) {
        params_[key] = std::move(value);
    }

    const std::string& get_header(const std::string& key) const { 
        static const std::string empty;
        auto it = headers_.find(key);
        return it != headers_.end() ? it->second : empty;
    }
    
    const std::string& get_param(const std::string& key) const {
        static const std::string empty;
        auto it = params_.find(key);
        return it != params_.end() ? it->second : empty;
    }

    void set_raw_data(std::string data) {
        raw_data_ = std::move(data);
    }
};

}