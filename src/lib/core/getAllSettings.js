module.exports = () => {
    let dir = './app/schema/config';
    let files = fs.readdirSync(dir);
    let config = {};
    files.forEach(file => {
        if (file.endsWith('.json')) {
            let filePath = path.join(dir, file);
            let data = fs.readFileSync(filePath, 'utf8');
            config[file.replace('.json', '')] = JSON.parse(data);
        }
    });
    return config;
}