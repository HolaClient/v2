#include "server.hpp"
#include "router.hpp"
#include "request.hpp"
#include "response.hpp"
#include "parser.h"
#include "../socket.h"
#include <atomic>
#include <iostream>
#include <sstream>

namespace http {

class HTTPServer::Impl {
public:
    Impl() : router(std::make_unique<Router>()) {
        running.store(false);
    }
    
    std::unique_ptr<Router> router;
    std::atomic<bool> running{false};
    RawSocket server_socket;

    void get(const std::string& path, RequestHandler handler) {
        router->add_route(Method::GET, path, std::move(handler));
    }

    void post(const std::string& path, RequestHandler handler) {
        router->add_route(Method::POST, path, std::move(handler));
    }

    void use(Middleware middleware) {
        router->use(std::move(middleware));
    }
};

HTTPServer::HTTPServer() : pImpl(std::make_unique<Impl>()) {}
HTTPServer::~HTTPServer() = default;

bool HTTPServer::start(uint16_t port) {
    if (pImpl->running) return false;
    
    if (!pImpl->server_socket.create()) {
        std::cerr << "Failed to create socket\n";
        return false;
    }

    if (!pImpl->server_socket.bind(port)) {
        std::cerr << "Failed to bind to port " << port << "\n";
        return false;
    }

    if (!pImpl->server_socket.listen(128)) {
        std::cerr << "Failed to listen\n";
        return false;
    }

    pImpl->running = true;
    std::cout << "Server started on port " << port << std::endl;

    while (pImpl->running) {
        auto client = pImpl->server_socket.accept();
        if (client.is_valid()) {
            handle_client(std::move(client));
        }
    }

    return true;
}

void HTTPServer::stop() {
    if (pImpl) {
        pImpl->running = false;
        pImpl->server_socket.close();
    }
}

void HTTPServer::get(const std::string& path, RequestHandler handler) {
    pImpl->get(path, std::move(handler));
}

void HTTPServer::post(const std::string& path, RequestHandler handler) {
    pImpl->post(path, std::move(handler));
}

void HTTPServer::use(Middleware middleware) {
    pImpl->use(std::move(middleware));
}

void HTTPServer::handle_client(RawSocket client) {
    static const size_t BUFFER_SIZE = 8192;
    char buffer[BUFFER_SIZE];

    int bytes = client.recv(buffer, BUFFER_SIZE - 1);
    if (bytes <= 0) {
        client.close();
        return;
    }

    buffer[bytes] = '\0';
    
    Request req;
    auto parse_result = parse_request(buffer, bytes, req);
    
    if (!parse_result.success) {
        std::string error_response = 
            "HTTP/1.1 400 Bad Request\r\n"
            "Content-Type: text/plain\r\n"
            "Content-Length: 11\r\n"
            "Connection: close\r\n"
            "\r\n"
            "Bad Request";
        client.send(error_response.c_str(), error_response.size());
        client.close();
        return;
    }

    Response res;
    res.status = Status::OK;
    res.headers["Content-Type"] = "text/plain";
    res.headers["Connection"] = "close";

    if (!pImpl->router->handle(req, res)) {
        res.status = Status::NotFound;
        res.body = "Not Found";
    }

    res.headers["Content-Length"] = std::to_string(res.body.size());

    std::stringstream response_stream;
    response_stream << "HTTP/1.1 " << static_cast<int>(res.status) << " ";
    switch (res.status) {
        case Status::OK: response_stream << "OK"; break;
        case Status::NotFound: response_stream << "Not Found"; break;
        default: response_stream << "Internal Server Error";
    }
    response_stream << "\r\n";

    for (const auto& [key, value] : res.headers) {
        response_stream << key << ": " << value << "\r\n";
    }
    
    response_stream << "\r\n" << res.body;

    std::string response = response_stream.str();
    client.send(response.c_str(), response.size());
    client.close();
}

}