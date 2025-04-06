const path = require('path');
const { platform, arch } = process;

const binaryPath = path.join(__dirname, '..', '..', '..', `hcw_${platform}_${arch}.node`);
const { Server: NativeServer } = require(binaryPath);

class Server {
    constructor(options = {}) {
        if (!NativeServer) {
            throw new Error('Failed to load native server module');
        }
        this.server = new NativeServer();
        this.options = {
            port: options.port || 8080,
            ...options
        };
    }

    start(port = this.options.port) {
        return this.server.start(port);
    }

    stop() {
        return this.server.stop();
    }

    get(path, handler) {
        this.server.get(path, (req, res) => {
            req.params = {};
            req.query = {};
            req.body = {};

            res.send = (data) => {
                if (typeof data === 'object') {
                    res.json(data);
                } else {
                    res.end(String(data));
                }
            };

            handler(req, res);
        });
        return this;
    }

    post(path, handler) {
        this.server.post(path, handler);
        return this;
    }

    use(middleware) {
        this.server.use(middleware);
        return this;
    }
}

module.exports = { Server };
