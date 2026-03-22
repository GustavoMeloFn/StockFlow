import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const db = new Database('banco_estoque.sqlite');

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    store_name TEXT
  );
  
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT,
    sku TEXT,
    category TEXT,
    description TEXT,
    unit TEXT,
    cost_price REAL,
    sell_price REAL,
    quantity INTEGER,
    min_quantity INTEGER,
    image TEXT,
    created_at TEXT,
    updated_at TEXT
  );
`);

// Add image column if it doesn't exist
try {
  db.exec(`ALTER TABLE products ADD COLUMN image TEXT;`);
} catch (error) {
  // Column might already exist, ignore
}

app.post('/api/auth/register', (req, res) => {
  const { email, password, storeName } = req.body;
  try {
    const id = uuidv4();
    const stmt = db.prepare('INSERT INTO users (id, email, password, store_name) VALUES (?, ?, ?, ?)');
    stmt.run(id, email, password, storeName);
    res.json({ user: { id, email, storeName } });
  } catch (error) {
    res.status(400).json({ error: 'Email já cadastrado ou dados inválidos.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
  if (user) return res.json({ user: { id: user.id, email: user.email, storeName: user.store_name } });
  res.status(401).json({ error: 'Credenciais inválidas.' });
});

app.get('/api/products', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(401).json({ error: 'Não autorizado' });
  res.json(db.prepare('SELECT * FROM products WHERE user_id = ?').all(userId));
});

app.post('/api/products', (req, res) => {
  const p = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO products (id, user_id, name, sku, category, description, unit, cost_price, sell_price, quantity, min_quantity, image, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, p.user_id, p.name, p.sku || null, p.category || null, p.description || null, p.unit || 'UN', p.cost_price || null, p.sell_price || null, p.quantity || 0, p.min_quantity || 0, p.image || null, now, now);
  res.json({ id, ...p, created_at: now, updated_at: now });
});

app.put('/api/products/:id', (req, res) => {
  const updates = req.body;
  const keys = Object.keys(updates).filter(k => k !== 'id');
  if (keys.length > 0) db.prepare(`UPDATE products SET ${keys.map(k => `${k} = ?`).join(', ')}, updated_at = ? WHERE id = ?`).run(...keys.map(k => updates[k]), new Date().toISOString(), req.params.id);
  res.json({ success: true });
});

app.delete('/api/products/:id', (req, res) => { res.json({ success: db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id).changes > 0 }); });

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

app.listen(3000, () => console.log('Backend rodando em http://localhost:3000'));