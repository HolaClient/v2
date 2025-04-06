#include "socket.h"
#include <cstring>
#include <iostream>

#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#pragma comment(lib, "ws2_32.lib")
#else
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <fcntl.h>
#include <netinet/tcp.h>
#endif

bool RawSocket::initialize() {
#ifdef _WIN32
    WSADATA wsa;
    return WSAStartup(MAKEWORD(2, 2), &wsa) == 0;
#else
    return true;
#endif
}

void RawSocket::cleanup() {
#ifdef _WIN32
    WSACleanup();
#endif
}

RawSocket::RawSocket() : socket_handle(INVALID_SOCKET) {}

RawSocket::~RawSocket() {
    close();
}

bool RawSocket::create() {
    socket_handle = socket(AF_INET, SOCK_STREAM, 0);
    if (socket_handle != INVALID_SOCKET) {
        int opt = 1;
        set_option(SOL_SOCKET, SO_REUSEADDR, (char*)&opt, sizeof(opt));
        set_option(IPPROTO_TCP, TCP_NODELAY, (char*)&opt, sizeof(opt));

        #ifdef _WIN32
        int bufsize = 65536;
        set_option(SOL_SOCKET, SO_SNDBUF, (char*)&bufsize, sizeof(bufsize));
        set_option(SOL_SOCKET, SO_RCVBUF, (char*)&bufsize, sizeof(bufsize));

        DWORD keepAlive = 1;
        tcp_keepalive ka = {1, 1000, 100};
        DWORD returned = 0;
        WSAIoctl(socket_handle, SIO_KEEPALIVE_VALS, &ka, sizeof(ka),
                 nullptr, 0, &returned, nullptr, nullptr);
        #else
        int bufsize = 65536;
        set_option(SOL_SOCKET, SO_SNDBUF, (char*)&bufsize, sizeof(bufsize));
        set_option(SOL_SOCKET, SO_RCVBUF, (char*)&bufsize, sizeof(bufsize));

        #ifdef TCP_QUICKACK
        set_option(IPPROTO_TCP, TCP_QUICKACK, (char*)&opt, sizeof(opt));
        #endif
        #ifdef SO_REUSEPORT
        set_option(SOL_SOCKET, SO_REUSEPORT, (char*)&opt, sizeof(opt));
        #endif

        int keepalive = 1;
        set_option(SOL_SOCKET, SO_KEEPALIVE, (char*)&keepalive, sizeof(keepalive));
        #ifdef TCP_KEEPIDLE
        int keepidle = 30;
        set_option(IPPROTO_TCP, TCP_KEEPIDLE, (char*)&keepidle, sizeof(keepidle));
        #endif
        #endif

        struct linger sl = {0, 0};
        set_option(SOL_SOCKET, SO_LINGER, (char*)&sl, sizeof(sl));
    }
    return socket_handle != INVALID_SOCKET;
}

bool RawSocket::bind(uint16_t port) {
    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_ANY);
    addr.sin_port = htons(port);
    
    if (::bind(socket_handle, (sockaddr*)&addr, sizeof(addr)) < 0) {
        #ifdef _WIN32
        int error = WSAGetLastError();
        if (error == WSAEADDRINUSE) {
            std::cerr << "Port " << port << " is already in use\n";
        }
        #else
        if (errno == EADDRINUSE) {
            std::cerr << "Port " << port << " is already in use\n";
        }
        #endif
        return false;
    }
    return true;
}

bool RawSocket::listen(int backlog) {
    return ::listen(socket_handle, backlog) == 0;
}

RawSocket RawSocket::accept() {
    RawSocket client;
    sockaddr_in addr{};
    #ifdef _WIN32
    int addr_len = sizeof(addr);
    #else
    socklen_t addr_len = sizeof(addr);
    #endif
    
    client.socket_handle = ::accept(socket_handle, (sockaddr*)&addr, &addr_len);
    
    if (client.is_valid()) {
        int opt = 1;
        client.set_option(IPPROTO_TCP, TCP_NODELAY, (char*)&opt, sizeof(opt));
        #ifdef TCP_QUICKACK
        client.set_option(IPPROTO_TCP, TCP_QUICKACK, (char*)&opt, sizeof(opt));
        #endif
        client.set_blocking(true);
    }
    
    return client;
}

int RawSocket::send(const char* data, int length) {
    if (!data || length <= 0) return SOCKET_ERROR;
    
    int total_sent = 0;
    while (total_sent < length) {
        int sent = ::send(socket_handle, 
                         data + total_sent, 
                         length - total_sent, 
                         #ifdef _WIN32
                         0
                         #else
                         MSG_NOSIGNAL
                         #endif
        );
        
        if (sent <= 0) {
            return sent;
        }
        total_sent += sent;
    }
    return total_sent;
}

int RawSocket::recv(char* buffer, int length) {
    return ::recv(socket_handle, buffer, length, 0);
}


bool RawSocket::connect(const char* ip, uint16_t port, int timeout_sec) {
    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_port = htons(port);
    if (inet_pton(AF_INET, ip, &addr.sin_addr) <= 0) return false;

    set_blocking(false);
    
    int result = ::connect(socket_handle, (sockaddr*)&addr, sizeof(addr));
    if (result == -1) {
        #ifdef _WIN32
        if (WSAGetLastError() != WSAEWOULDBLOCK) return false;
        #else
        if (errno != EINPROGRESS) return false;
        #endif

        fd_set write_set;
        FD_ZERO(&write_set);
        FD_SET(socket_handle, &write_set);

        timeval timeout = {timeout_sec, 0};
        result = select(socket_handle + 1, nullptr, &write_set, nullptr, &timeout);
        
        if (result <= 0) return false;
    }

    set_blocking(true);
    return true;
}

void RawSocket::set_blocking(bool blocking) {
    #ifdef _WIN32
    u_long mode = blocking ? 0 : 1;
    ioctlsocket(socket_handle, FIONBIO, &mode);
    #else
    int flags = fcntl(socket_handle, F_GETFL, 0);
    fcntl(socket_handle, F_SETFL, blocking ? (flags & ~O_NONBLOCK) : (flags | O_NONBLOCK));
    #endif
}

int RawSocket::get_error() const {
    #ifdef _WIN32
    return WSAGetLastError();
    #else
    return errno;
    #endif
}

bool RawSocket::set_timeouts(int send_timeout_ms, int recv_timeout_ms) {
    #ifdef _WIN32
    DWORD timeout = send_timeout_ms;
    if (setsockopt(socket_handle, SOL_SOCKET, SO_SNDTIMEO, (char*)&timeout, sizeof(timeout)) != 0) {
        return false;
    }
    timeout = recv_timeout_ms;
    if (setsockopt(socket_handle, SOL_SOCKET, SO_RCVTIMEO, (char*)&timeout, sizeof(timeout)) != 0) {
        return false;
    }
    #else
    struct timeval tv;
    tv.tv_sec = send_timeout_ms / 1000;
    tv.tv_usec = (send_timeout_ms % 1000) * 1000;
    if (setsockopt(socket_handle, SOL_SOCKET, SO_SNDTIMEO, &tv, sizeof(tv)) != 0) {
        return false;
    }
    tv.tv_sec = recv_timeout_ms / 1000;
    tv.tv_usec = (recv_timeout_ms % 1000) * 1000;
    if (setsockopt(socket_handle, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv)) != 0) {
        return false;
    }
    #endif
    return true;
}

#ifdef _WIN32
RawSocket::TRANSMITFILE RawSocket::pfnTransmitFile = nullptr;

RawSocket::TRANSMITFILE RawSocket::get_transmit_file() {
    static HMODULE hMSWSock = LoadLibraryA("MSWSOCK.DLL");
    if (hMSWSock == NULL) return NULL;
    return (TRANSMITFILE)GetProcAddress(hMSWSock, "TransmitFile");
}
#endif