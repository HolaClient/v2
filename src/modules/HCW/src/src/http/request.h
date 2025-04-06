#pragma once
#include "methods.hpp"
#include <string>
#include <map>

namespace http
{

    class Request
    {

    public:
        void set_method(const std::string &method) { method_ = method; }

        void set_path(const std::string &path) { path_ = path; }

        void set_header(const std::string &key, const std::string &value) { headers_[key] = value; }

        void set_body(const std::string &body) { body_ = body; }

        Method get_method() const { return string_to_method(method_); }

        const std::string &get_path() const { return path_; }
        const std::string &get_body() const { return body_; }
        const std::string &get_header(const std::string &key) const
        {
            static const std::string empty;
            auto it = headers_.find(key);
            return it != headers_.end() ? it->second : empty;
        }

        const std::string &get_param(const std::string &key) const
        {
            static const std::string empty;
            auto it = params_.find(key);
            return it != params_.end() ? it->second : empty;
        }

    private:
        std::string method_;
        std::string path_;
        std::map<std::string, std::string> headers_;
        std::string body_;
        std::map<std::string, std::string> params_;
    };
}