#pragma once

#include "http_common.h"
#include <string>
#include <memory>
#include <functional>

class HTTPServer {
public:
    HTTPServer();
    ~HTTPServer();
    
    bool start(uint16_t port);
    void stop();
    
    void get(const std::string& path, std::function<void(http::Request&, http::Response&)> handler);
    void post(const std::string& path, std::function<void(http::Request&, http::Response&)> handler);
    void use(std::function<void(http::Request&, http::Response&, std::function<void()>)> middleware);

private:
    class Impl;
    std::unique_ptr<Impl> pImpl;
};
