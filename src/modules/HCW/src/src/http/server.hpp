#pragma once
#include "types.h"
#include "../socket.h"
#include <memory>
#include <iostream>

namespace http {

class HTTPServer {
public:
    HTTPServer();
    ~HTTPServer();

    HTTPServer(const HTTPServer&) = delete;
    HTTPServer& operator=(const HTTPServer&) = delete;

    bool start(uint16_t port = 8080);
    void stop();
    
    void get(const std::string& path, RequestHandler handler);
    void post(const std::string& path, RequestHandler handler);
    void use(Middleware middleware);

private:
    class Impl;
    std::unique_ptr<Impl> pImpl;

    void handle_client(::RawSocket client);
};

}