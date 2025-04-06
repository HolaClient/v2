const server = (() => {
    try {
        return require('../hcw.node');
    } catch (e) {
        console.error('Failed to load native module:', e);
        process.exit(1);
    }
})();

class http {
  constructor(options = {}) {
    this.server = new server.Server();
    this.options = {
      port: options.port || 8080,
      host: options.host || '0.0.0.0',
      ...options
    };
  }

  start() {
    return this.server.start(this.options.port);
  }

  get(path, handler) {
    this.server.get(path, handler);
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

module.exports = http;
