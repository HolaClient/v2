const { Server } = require('./hcw.node');

const server = new Server();

server.get('/', (req, res) => {
    res.headers = {
        'Content-Type': 'text/plain'
    };
    res.body = 'Hello World!';
    res.statusCode = 200;
});

server.get('/debug', (req, res) => {
    res.headers = {
        'Content-Type': 'application/json'
    };
    res.body = JSON.stringify({
        method: req.method,
        path: req.path,
        headers: req.headers
    });
    res.statusCode = 200;
});

server.start(3000);
console.log(`Server running on http://localhost:3000`);

process.on('uncaughtException', (err) => {
    console.error(err);
});
