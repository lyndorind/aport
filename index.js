const express = require('express');
const app = express();
const port = 3000;

// Базовий endpoint
app.get('/', (req, res) => {
  res.send('Welcome to Lab 2 REST API!');
});

app.get('/ping', (req, res) => {
  res.send('pong');
});
app.get('/users', (req, res) => {
  res.send('Users API v1');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});
// ... маршрути (/, /health тощо) ...

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;