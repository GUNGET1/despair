const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(cors());
app.use(express.json());

let keywords = {
  'example': ['https://jsonplaceholder.typicode.com/posts', 'https://jsonplaceholder.typicode.com/comments']
};

// Получение ключевых слов
app.get('/keywords', (req, res) => {
  res.json(Object.keys(keywords));
});

// Получение списка URL по ключевому слову
app.post('/urls', (req, res) => {
  const { keyword } = req.body;
  if (keywords[keyword]) {
    res.json(keywords[keyword]);
  } else {
    res.status(404).json({ error: 'Keyword not found' });
  }
});

// Скачивание данных
app.get('/download', async (req, res) => {
  const { url } = req.query;
  try {
    const response = await axios.get(url, { responseType: 'stream' });
    response.data.pipe(res);

    let downloaded = 0;
    response.data.on('data', (chunk) => {
      downloaded += chunk.length;
      io.emit('progress', { url, downloaded, total: parseInt(response.headers['content-length'], 10) });
    });

  } catch (error) {
    res.status(500).json({ error: 'Error downloading content' });
  }
});

// WebSocket для прогресса
io.on('connection', (socket) => {
  console.log('Client connected');
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
