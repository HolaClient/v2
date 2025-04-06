#pragma once

#if defined(_WIN32)
#include <winsock2.h>
#include <ws2tcpip.h>
#include <MSWSock.h>
#pragma comment(lib, "ws2_32.lib")
#pragma comment(lib, "Mswsock.lib")
typedef SOCKET socket_t;
#else
#include <sys/socket.h>
#include <netinet/in.h>
#include <netinet/tcp.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <errno.h>
typedef int socket_t;
#define SOCKET_ERROR (-1)
#define INVALID_SOCKET (-1)
#define SD_BOTH SHUT_RDWR
#define closesocket close
#endif

#include <cstdint>

extern "C" {
    #ifdef _WIN32
    __int64 fast_parse_request(socket_t socket, const char* buffer, int length);
    __int64 fast_send_response(socket_t socket);
    #else
    int64_t fast_parse_request(socket_t socket, const char* buffer, int length);
    int64_t fast_send_response(socket_t socket);
    #endif
}

#ifdef _WIN32
#define MAX_CONCURRENT_CONNECTIONS 50000
#else
#include <sys/resource.h>
#endif

#ifdef _WIN32
  #define EXPORT __declspec(dllexport)
#else
  #define EXPORT __attribute__((visibility("default")))
#endif

class EXPORT RawSocket {
public:
    socket_t get_fd() const { 
        return socket_handle; 
    }
public:
    static bool initialize();
    static void cleanup();
    
    RawSocket();
    ~RawSocket();
    
    bool create();
    bool bind(uint16_t port);
    bool listen(int backlog);
    RawSocket accept();
    bool connect(const char* ip, uint16_t port);
    bool connect(const char* ip, uint16_t port, int timeout_sec = 5);
    int send(const char* data, int length);
    int recv(char* buffer, int length);
    bool is_valid() const { return socket_handle != INVALID_SOCKET; }
    int get_error() const;
    void set_blocking(bool blocking);
    socket_t get_handle() const { return socket_handle; }
    bool set_timeouts(int send_timeout_ms, int recv_timeout_ms);
    bool shutdown(int how) {
        return ::shutdown(socket_handle, how) == 0;
    }
    bool set_option(int level, int optname, const char* optval, int optlen) {
        return setsockopt(socket_handle, level, optname, optval, optlen) == 0;
    }

    RawSocket(RawSocket&& other) noexcept : socket_handle(other.socket_handle) {
        other.socket_handle = INVALID_SOCKET;
    }
    
    RawSocket& operator=(RawSocket&& other) noexcept {
        if (this != &other) {
            close();
            socket_handle = other.socket_handle;
            other.socket_handle = INVALID_SOCKET;
        }
        return *this;
    }
    
    RawSocket(const RawSocket&) = delete;
    RawSocket& operator=(const RawSocket&) = delete;

    static void configure_system_limits() {
        #ifdef _WIN32
        int max_conn = MAX_CONCURRENT_CONNECTIONS;
        #else
        struct rlimit rl;
        rl.rlim_cur = rl.rlim_max = 1048576;
        setrlimit(RLIMIT_NOFILE, &rl);
        #endif
    }

    bool enable_zero_copy() {
        #ifdef _WIN32
        DWORD bytes = 0;
        return WSAIoctl(socket_handle, SIO_ENABLE_CIRCULAR_QUEUEING, NULL, 0, NULL, 0, &bytes, NULL, NULL) == 0;
        #else
        int opt = 1;
        return setsockopt(socket_handle, SOL_SOCKET, SO_ZEROCOPY, &opt, sizeof(opt)) == 0;
        #endif
    }

    bool enable_kernel_bypass() {
        return true;
    }

    class TimeoutGuard {
    public:
        TimeoutGuard(RawSocket& socket, int timeout_ms) : socket_(socket) {
            socket_.set_timeouts(timeout_ms, timeout_ms);
        }
        ~TimeoutGuard() {
            socket_.set_timeouts(0, 0);
        }
    private:
        RawSocket& socket_;
    };

    bool send_zero_copy(const char* data, size_t length) {
        #ifdef _WIN32
        WSABUF buf;
        buf.buf = (CHAR*)data;
        buf.len = static_cast<ULONG>(length);
        DWORD bytes_sent = 0;
        
        if (!pfnTransmitFile) {
            pfnTransmitFile = get_transmit_file();
        }
        
        if (pfnTransmitFile && length > 65536) {
            HANDLE hFile = CreateFileMappingA(INVALID_HANDLE_VALUE, NULL, PAGE_READWRITE, 
                                            0, length, NULL);
            if (hFile != NULL) {
                void* pView = MapViewOfFile(hFile, FILE_MAP_WRITE, 0, 0, length);
                if (pView != NULL) {
                    memcpy(pView, data, length);
                    UnmapViewOfFile(pView);
                    BOOL result = pfnTransmitFile(socket_handle, hFile, length, 65536, 
                                                NULL, NULL, TF_USE_KERNEL_APC);
                    CloseHandle(hFile);
                    return result != FALSE;
                }
                CloseHandle(hFile);
            }
        }
        
        return WSASend(socket_handle, &buf, 1, &bytes_sent, 0, NULL, NULL) == 0;
        #else
        const int opt = MSG_NOSIGNAL;
        ssize_t result = ::send(socket_handle, data, length, opt);
        return result >= 0 && static_cast<size_t>(result) == length;
        #endif
    }

    void close() {
        if (socket_handle != INVALID_SOCKET) {
            shutdown(SD_BOTH);
            ::closesocket(socket_handle);
            socket_handle = INVALID_SOCKET;
        }
    }

private:
    socket_t socket_handle;
    bool set_socket_timeout(int seconds);
    bool set_platform_optimizations() {
        #if defined(__arm__) || defined(__aarch64__)
        int opt = 1;
        set_option(IPPROTO_TCP, TCP_QUICKACK, (char*)&opt, sizeof(opt));
        
        int bufsize = 32768;
        set_option(SOL_SOCKET, SO_SNDBUF, (char*)&bufsize, sizeof(bufsize));
        set_option(SOL_SOCKET, SO_RCVBUF, (char*)&bufsize, sizeof(bufsize));
        #endif
        return true;
    }

    #ifdef _WIN32
    typedef BOOL (PASCAL FAR* TRANSMITFILE)(SOCKET, HANDLE, DWORD, DWORD, LPOVERLAPPED, LPTRANSMIT_FILE_BUFFERS, DWORD);
    static TRANSMITFILE pfnTransmitFile;
    
    static TRANSMITFILE get_transmit_file();
    #endif
};