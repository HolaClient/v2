#include "socket.h"
#include "http/types.h"
#include "http/router.hpp"
#include "http/parser.h"
#include "http/request.hpp"
#include "http/response.hpp"
#include "http/methods.hpp"
#include "config/config.h"
#include <iostream>
#include <thread>
#include <vector>
#include <queue>
#include <mutex>
#include <condition_variable>
#include <functional>
#include <cstring>
#include <string>
#include <memory>
#include <atomic>
#include <optional>
#if defined(__APPLE__) || defined(__linux__)
#include <sys/sysinfo.h>
#include <unistd.h>
#endif

#if defined(_WIN32)
#include <windows.h>
#elif defined(__linux__)
#include <unistd.h>
#include <sys/epoll.h>
#endif

extern "C"
{
    size_t build_res_asm_asm(const http::Response *res, char *out);
}

template <typename T>
class SafeQueue
{
private:
    std::queue<T> queue;
    mutable std::mutex mutex;
    std::condition_variable cond;

public:
    bool push(T value)
    {
        std::lock_guard<std::mutex> lock(mutex);
        queue.push(std::move(value));
        cond.notify_one();
        return true;
    }

    bool try_pop(T &value)
    {
        std::lock_guard<std::mutex> lock(mutex);
        if (queue.empty())
            return false;
        value = std::move(queue.front());
        queue.pop();
        return true;
    }

    bool empty() const
    {
        std::lock_guard<std::mutex> lock(mutex);
        return queue.empty();
    }

    size_t size() const
    {
        std::lock_guard<std::mutex> lock(mutex);
        return queue.size();
    }
};

class ConnectionPool
{
private:
    static constexpr size_t POOL_SIZE = 50000;
    std::vector<std::unique_ptr<RawSocket>> pool;
    std::mutex mtx;
    std::condition_variable cv;
    size_t available;

public:
    ConnectionPool() : available(POOL_SIZE)
    {
        pool.reserve(POOL_SIZE);
    }

    std::unique_ptr<RawSocket> acquire()
    {
        std::unique_lock<std::mutex> lock(mtx);
        cv.wait(lock, [this]
                { return available > 0; });
        available--;
        auto socket = std::make_unique<RawSocket>();
        socket->create();
        socket->enable_zero_copy();
        return socket;
    }

    void release(std::unique_ptr<RawSocket> socket)
    {
        std::lock_guard<std::mutex> lock(mtx);
        socket->close();
        available++;
        cv.notify_one();
    }
};

class BufferPool
{
public:
    static constexpr size_t BUFFER_SIZE = 16384;

private:
    SafeQueue<char *> pool;
    std::atomic<size_t> allocated{0};

public:
    char *acquire()
    {
        char *buffer;
        if (!pool.try_pop(buffer))
        {
            allocated++;
            return new char[BUFFER_SIZE];
        }
        return buffer;
    }

    void release(char *buffer)
    {
        if (!pool.push(buffer))
        {
            delete[] buffer;
            allocated--;
        }
    }

    ~BufferPool()
    {
        char *buffer;
        while (pool.try_pop(buffer))
            delete[] buffer;
    }
};

class ThreadPool
{
private:
    std::vector<std::thread> workers;
    SafeQueue<std::function<void()>> tasks;
    std::atomic<bool> stop{false};
    std::atomic<size_t> active_threads{0};
    std::mutex cv_mutex;
    std::condition_variable cv;
    size_t num_threads;
    static constexpr auto IDLE_TIMEOUT = std::chrono::milliseconds(100);

    void bind_to_cpu(size_t thread_id)
    {
#ifdef __linux__
        cpu_set_t cpuset;
        CPU_ZERO(&cpuset);
        CPU_SET(thread_id % std::thread::hardware_concurrency(), &cpuset);
        pthread_setaffinity_np(pthread_self(), sizeof(cpu_set_t), &cpuset);
#elif defined(_WIN32)
        SetThreadAffinityMask(GetCurrentThread(), 1ULL << (thread_id % 64));
#endif
    }

    void set_thread_priority()
    {
#ifdef _WIN32
        SetThreadPriority(GetCurrentThread(), THREAD_PRIORITY_HIGHEST);
#else
        struct sched_param param;
        param.sched_priority = sched_get_priority_max(SCHED_FIFO);
        pthread_setschedparam(pthread_self(), SCHED_FIFO, &param);
#endif
    }

public:
    ThreadPool(size_t threads) : num_threads(threads)
    {
        for (size_t i = 0; i < threads; ++i)
        {
            workers.emplace_back([this, i]
                                 {
                bind_to_cpu(i);
                set_thread_priority();
                std::function<void()> task;
                while (!stop) {
                    {
                        std::unique_lock<std::mutex> lock(cv_mutex);
                        if (cv.wait_for(lock, IDLE_TIMEOUT, [this] { 
                            return !tasks.empty() || stop; 
                        })) {
                            if (!tasks.try_pop(task)) continue;
                        } else {
                            continue;
                        }
                    }
                    active_threads++;
                    task();
                    active_threads--;
                } });
        }
    }

    void enqueue(std::function<void()> &&f)
    {
        tasks.push(std::move(f));
        cv.notify_one();
    }

    size_t thread_count() const { return num_threads; }

    size_t active_count() const { return active_threads; }

    ~ThreadPool()
    {
        stop = true;
        cv.notify_all();
        for (auto &worker : workers)
        {
            worker.join();
        }
    }
};

std::string build_response(const http::Response &res)
{
    size_t total_size = 128;
    for (const auto &[key, value] : res.headers)
    {
        total_size += key.size() + value.size() + 4;
    }
    total_size += res.body.size();

    std::string response;
    response.reserve(total_size);

    static const std::string_view HTTP_OK = "HTTP/1.1 200 OK\r\n";
    static const std::string_view HTTP_404 = "HTTP/1.1 404 Not Found\r\n";
    static const std::string_view HTTP_500 = "HTTP/1.1 500 Internal Server Error\r\n";

    switch (static_cast<int>(res.status))
    {
    case static_cast<int>(http::Status::OK):
        response.append(HTTP_OK);
        break;
    case static_cast<int>(http::Status::NotFound):
        response.append(HTTP_404);
        break;
    case static_cast<int>(http::Status::InternalError):
        response.append(HTTP_500);
        break;
    default:
        response.append(HTTP_OK);
    }

    for (const auto &[key, value] : res.headers)
    {
        response += key + ": " + value + "\r\n";
    }
    response += "\r\n";

    response.insert(response.end(), res.body.begin(), res.body.end());
    return response;
}

class HTTPServer
{
private:
    static constexpr int DEFAULT_MAX_THREADS = 10240;
    static constexpr int DEFAULT_BACKLOG_SIZE = 65535;
    static constexpr int DEFAULT_MAX_CONNECTIONS = 9000000;
    static constexpr size_t DEFAULT_BATCH_SIZE = 64;
    static constexpr size_t BUFFER_POOL_SIZE = 100000;
    static constexpr size_t RESPONSE_POOL_SIZE = 100000;

    struct alignas(64) ConnectionContext
    {
        alignas(64) char buffer[4096];
        alignas(64) char response[4096];
        size_t bytes_received{0};
        http::Request request{};
        http::Response response_obj{};
        bool in_use{false};
    };

    const int MAX_THREADS;
    const int BACKLOG_SIZE;
    const std::string HOST;
    const size_t BATCH_SIZE;
    std::atomic<size_t> MAX_CONNECTIONS;
    std::unique_ptr<ConnectionContext[]> contexts_;
    std::atomic<size_t> next_context_{0};
    ConnectionPool conn_pool;
    BufferPool buffer_pool;
    RawSocket server_socket;
    std::string_view response;
    std::atomic<size_t> active_connections{0};
    std::atomic<uint64_t> request_count{0};
    std::atomic<uint64_t> error_count{0};
    std::atomic<bool> running{true};
    std::condition_variable accept_cv;
    std::mutex accept_mutex;
    http::Router router;
    ThreadPool thread_pool;

    struct alignas(64) CachedResponse
    {
        std::string data;
        std::chrono::steady_clock::time_point expiry;
    };
    std::map<std::string, CachedResponse> response_cache;
    std::mutex cache_mutex;

    class ResponseCache
    {
    private:
        std::unordered_map<std::string, std::pair<std::string, std::chrono::steady_clock::time_point>> cache_;
        std::mutex mutex_;
        static constexpr auto CACHE_TTL = std::chrono::seconds(60);

    public:
        std::string *get_cached(std::string_view key)
        {
            std::lock_guard<std::mutex> lock(mutex_);
            auto it = cache_.find(std::string(key));
            if (it != cache_.end())
            {
                auto &[response, expiry] = it->second;
                if (expiry > std::chrono::steady_clock::now())
                {
                    return &response;
                }
                cache_.erase(it);
            }
            return nullptr;
        }

        void cache_response(std::string_view key, std::string response)
        {
            std::lock_guard<std::mutex> lock(mutex_);
            cache_[std::string(key)] = {
                std::move(response),
                std::chrono::steady_clock::now() + CACHE_TTL};
        }
    };

    ResponseCache response_cache_;

    static size_t get_optimal_threads()
    {
        size_t cpu_cores = 1;

#if defined(_WIN32)
        SYSTEM_INFO sysInfo;
        GetSystemInfo(&sysInfo);
        cpu_cores = sysInfo.dwNumberOfProcessors;
#elif defined(__APPLE__)
        int nm[2];
        size_t len = 4;
        nm[0] = CTL_HW;
        nm[1] = HW_AVAILCPU;
        sysctl(nm, 2, &cpu_cores, &len, NULL, 0);
#elif defined(__linux__)
        cpu_cores = sysconf(_SC_NPROCESSORS_ONLN);
        if (cpu_cores < 1)
            cpu_cores = 1;
#endif

        size_t max_threads = Config::instance().get_int("max_threads", 10240);
        return std::min(max_threads, cpu_cores + (cpu_cores >> 1));
    }

    void set_thread_priority()
    {
#ifdef _WIN32
        SetThreadPriority(GetCurrentThread(), THREAD_PRIORITY_HIGHEST);
#else
        struct sched_param param;
        param.sched_priority = sched_get_priority_max(SCHED_FIFO);
        pthread_setschedparam(pthread_self(), SCHED_FIFO, &param);
#endif
    }

    static constexpr size_t EPOLL_MAX_EVENTS = 10000;
    static constexpr size_t REQUEST_BATCH_SIZE = 64;

    std::optional<std::string_view> try_fast_path(std::string_view path, http::Response &res)
    {
        if (path.substr(0, 7) == "/users/" && path.size() > 7)
        {
            auto id_part = path.substr(7);
            for (char c : id_part)
            {
                if (!std::isdigit(c))
                    return std::nullopt;
            }
            std::string id{id_part};
            res.status = http::Status::OK;
            res.headers["Content-Type"] = "application/json";
            res.body = "{\"id\":\"" + id + "\",\"found\":true}";
            return path;
        }
        return std::nullopt;
    }

    const char *DEFAULT_RESPONSE = "no response provided";

    void handle_client(std::shared_ptr<RawSocket> client)
    {
        if (!client || !client->is_valid())
            return;
        size_t ctx_index = next_context_.fetch_add(1, std::memory_order_relaxed) % BUFFER_POOL_SIZE;
        auto &ctx = contexts_[ctx_index];

        client->set_timeouts(100, 100);
        client->enable_zero_copy();
        client->set_blocking(true);

        while (client->is_valid() && running)
        {
            int bytes = client->recv(ctx.buffer, sizeof(ctx.buffer) - 1);
            if (bytes <= 0)
                break;

            ctx.buffer[bytes] = '\0';
            auto parse_result = http::parse_request(ctx.buffer, bytes, ctx.request);
            if (!parse_result.success)
            {
                error_count++;
                break;
            }

            ctx.response_obj = http::Response{};

            if (auto fast = try_fast_path(ctx.request.get_path(), ctx.response_obj))
            {
                size_t response_size = build_res_asm(ctx.response_obj, ctx.response);
                if (client->send_zero_copy(ctx.response, response_size) <= 0)
                {
                    error_count++;
                    break;
                }
                request_count++;
                continue;
            }

            if (!router.handle(ctx.request, ctx.response_obj))
            {
                ctx.response_obj.status = http::Status::NotFound;
                ctx.response_obj.json("{\"error\":\"Not Found\"}");
            }

            if (ctx.response_obj.body.empty())
            {
                ctx.response_obj.status = http::Status::OK;
                ctx.response_obj.headers["Content-Type"] = "text/plain";
                ctx.response_obj.body = DEFAULT_RESPONSE;
            }

            size_t response_size = build_res_asm(ctx.response_obj, ctx.response);
            if (client->send_zero_copy(ctx.response, response_size) <= 0)
            {
                error_count++;
                break;
            }
            request_count++;
        }
        client->close();
        active_connections--;
    }

    void build_res_asm(const http::Response &res, std::string &out)
    {
        out.clear();

        switch (res.status)
        {
        case http::Status::OK:
            out.append("HTTP/1.1 200 OK\r\n");
            break;
        case http::Status::NotFound:
            out.append("HTTP/1.1 404 Not Found\r\n");
            break;
        default:
            out.append("HTTP/1.1 500 Internal Server Error\r\n");
        }

        for (const auto &[key, value] : res.headers)
        {
            out.append(key);
            out.append(": ");
            out.append(value);
            out.append("\r\n");
        }

        out.append("\r\n");

        out.append(res.body);
    }

    size_t build_res_asm(const http::Response &res, char *out)
    {
        return build_res_asm_asm(const_cast<http::Response *>(&res), out);
    }

public:
    HTTPServer() : MAX_THREADS(Config::instance().get_int("max_threads", DEFAULT_MAX_THREADS)),
                   BACKLOG_SIZE(Config::instance().get_int("backlog_size", DEFAULT_BACKLOG_SIZE)),
                   HOST(Config::instance().get_string("host", "0.0.0.0")),
                   BATCH_SIZE(DEFAULT_BATCH_SIZE),
                   MAX_CONNECTIONS(Config::instance().get_int("max_connections", DEFAULT_MAX_CONNECTIONS)),
                   contexts_(std::make_unique<ConnectionContext[]>(BUFFER_POOL_SIZE)),
                   thread_pool(get_optimal_threads())
    {
        RawSocket::configure_system_limits();

        static const std::string default_response =
            "HTTP/1.1 200 OK\r\n"
            "Content-Length: 2\r\n"
            "Connection: keep-alive\r\n"
            "\r\n"
            "OK";
        response = std::string_view(default_response);

        router.get("/", [](http::Request &req, http::Response &res) -> bool
                   {
            res.text("GG");
            return true; });

        std::cout << "Server initialized with " << thread_pool.thread_count()
                  << " threads (CPU cores: " << std::thread::hardware_concurrency() << ")\n";
    }

    bool start(uint16_t port = 0)
    {
        if (port == 0)
        {
            port = static_cast<uint16_t>(Config::instance().get_int("port", 8080));
        }

        if (!server_socket.create())
        {
            std::cerr << "Failed to create socket\n";
            return false;
        }

        int opt = 1;
        server_socket.set_option(SOL_SOCKET, SO_REUSEADDR, (char *)&opt, sizeof(opt));
        server_socket.set_option(SOL_SOCKET, SO_REUSEPORT, (char *)&opt, sizeof(opt));
        server_socket.set_option(IPPROTO_TCP, TCP_NODELAY, (char *)&opt, sizeof(opt));

#ifdef _WIN32
        int bufsize = 65536;
        server_socket.set_option(SOL_SOCKET, SO_SNDBUF, (char *)&bufsize, sizeof(bufsize));
        server_socket.set_option(SOL_SOCKET, SO_RCVBUF, (char *)&bufsize, sizeof(bufsize));
#endif

        if (!server_socket.bind(port))
        {
            std::cerr << "Failed to bind to port " << port << "\n";
            return false;
        }

        if (!server_socket.listen(BACKLOG_SIZE))
        {
            std::cerr << "Failed to listen on port " << port << "\n";
            return false;
        }

        std::cout << "Server running with " << thread_pool.thread_count()
                  << " threads, max " << MAX_CONNECTIONS << " connections\n";

        std::thread stats_thread([this]()
                                 {
            uint64_t last_count = 0;
            while (running) {
                std::this_thread::sleep_for(std::chrono::seconds(1));
                uint64_t current = request_count.load();
                uint64_t rps = current - last_count;
                std::cout << "RPS: " << rps << ", Active: " << active_connections 
                         << ", Errors: " << error_count << "\n";
                last_count = current;
            } });
        stats_thread.detach();

        if (Config::instance().get_bool("cors_enabled", true))
        {
            const std::string cors_origin = Config::instance().get_string("cors_allow_origin", "*");
            const std::string cors_methods = Config::instance().get_string("cors_methods", "GET, POST, OPTIONS");

            router.use([cors_origin, cors_methods](http::Request &req, http::Response &res)
                       {
                std::string origin{req.get_header("Origin")};
                if (!origin.empty()) {
                    res.headers["Access-Control-Allow-Origin"] = cors_origin;
                    res.headers["Access-Control-Allow-Methods"] = cors_methods;
                }
                return true; });
        }

        std::vector<std::thread> accept_threads;
        const size_t NUM_ACCEPT_THREADS = thread_pool.thread_count();

        for (size_t i = 0; i < NUM_ACCEPT_THREADS; ++i)
        {
            accept_threads.emplace_back([this]
                                        {
                                            server_socket.set_blocking(false);
#ifdef __linux__
                                            int epoll_fd = epoll_create1(0);
                                            if (epoll_fd < 0)
                                            {
                                                perror("epoll_create1");
                                                return;
                                            }
                                            struct epoll_event event;
                                            event.events = EPOLLIN;
                                            event.data.fd = server_socket.get_fd();
                                            if (epoll_ctl(epoll_fd, EPOLL_CTL_ADD, server_socket.get_fd(), &event) < 0)
                                            {
                                                perror("epoll_ctl");
                                                close(epoll_fd);
                                                return;
                                            }
                                            while (running)
                                            {
                                                struct epoll_event events[10];
                                                int n = epoll_wait(epoll_fd, events, 10, 1000);
                                                if (n < 0)
                                                {
                                                    perror("epoll_wait");
                                                    break;
                                                }
                                                for (int i = 0; i < n; ++i)
                                                {
                                                    if (events[i].data.fd == server_socket.get_fd())
                                                    {
                                                        auto client_tmp = server_socket.accept();
                                                        if (client_tmp.is_valid())
                                                        {
                                                            auto client = std::make_shared<RawSocket>(std::move(client_tmp));
                                                            active_connections++;
                                                            thread_pool.enqueue([this, client]
                                                                                { handle_client(client); });
                                                        }
                                                    }
                                                }
                                            }
                                            close(epoll_fd);
#else

#endif
                                        });
        }

        for (auto &thread : accept_threads)
        {
            thread.join();
        }

        return true;
    }

    void get(const std::string &path, std::function<bool(http::Request &, http::Response &)> handler)
    {
        router.get(path, handler);
    }

    void post(const std::string &path, http::RequestHandler handler)
    {
        router.post(path, handler);
    }

    void use(http::Middleware middleware)
    {
        router.use(middleware);
    }

    ~HTTPServer()
    {
        running = false;
        accept_cv.notify_all();
    }
};