const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// Создаём HTTP-сервер
const server = http.createServer((req, res) => {
    // Определяем, какой файл запрашивает браузер
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath);

    // Определяем тип файла (MIME)
    const ext = path.extname(filePath);
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml'
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // Читаем файл и отправляем
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Файл не найден');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
});

// Создаём WebSocket-сервер поверх HTTP
const wss = new WebSocket.Server({ server });

const clients = new Set();

wss.on('connection', (ws) => {
    console.log('Новый клиент подключился');
    clients.add(ws);

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            console.log('Получено:', message);

            clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        user: message.user || 'Аноним',
                        text: message.text,
                        timestamp: new Date().toISOString()
                    }));
                }
            });
        } catch (e) {
            console.error('Ошибка:', e);
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
    });
});

// Запускаем сервер на порту 3000
server.listen(3000, () => {
    console.log('Сервер запущен на http://localhost:3000');
});