#pragma once
#include "socket.h"
#include "http/types.h"
#include <functional>
#include <unordered_map>
#include <mutex>
#include <vector>

class HTTPServer {
public:
    using RequestHandler = std::function<void(http::Request&, http::Response&)>;
    
    HTTPServer();
    ~HTTPServer();
    
    bool start(uint16_t port = 0);
    void stop();
    
    void get(const std::string& path, RequestHandler handler);
    void post(const std::string& path, RequestHandler handler);
    void use(RequestHandler middleware);

private:
    RawSocket server_socket;
    bool running = false;
    std::unordered_map<std::string, RequestHandler> get_handlers;
    std::unordered_map<std::string, RequestHandler> post_handlers;
    std::vector<RequestHandler> middleware;
};
