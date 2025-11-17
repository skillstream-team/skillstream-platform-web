const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files from dist directory
app.use(express.static('dist'));

// Serve index.html for all routes (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Preview server running at http://localhost:${PORT}`);
});

