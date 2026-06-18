const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();

const db = new sqlite3.Database(
  path.join(__dirname, '..', 'database', 'restaurant_service.db')
);

app.get('/', (req, res) => {
  res.send('Restaurant Service POS API funcionando');
});

app.get('/mesas', (req, res) => {
  db.all(
    'SELECT * FROM mesas ORDER BY numero',
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      res.json(rows);
    }
  );
});

app.listen(3000, () => {
  console.log('Servidor iniciado en http://localhost:3000');
});
