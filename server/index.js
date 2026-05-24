require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Importar rutas
const etlRoutes = require('./routes/etl');
const bookRoutes = require('./routes/books');
const userRoutes = require('./routes/users');
const recommendationRoutes = require('./routes/recommendations');
const interactionRoutes = require('./routes/interactions');
const analyticsRoutes = require('./routes/analytics');
const chatRoutes = require('./routes/chat');

app.use('/api/etl', etlRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'BiblioFlix API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
