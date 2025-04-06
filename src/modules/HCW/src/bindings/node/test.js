const { Server } = require('./lib/index');

const app = new Server();

app.get('/', (req, res) => {
    res.json({ message: 'Hello World!' });
});

app.get('/users/:id', (req, res) => {
    res.json({ userId: req.params.id });
});

app.post('/api/data', (req, res) => {
    res.json(req.body);
});

app.start(3000)
    .then(() => console.log('Server running on port 3000'))
    .catch(err => console.error('Failed to start server:', err));
