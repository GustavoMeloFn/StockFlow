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

const deleteImageFile = (imageUrl) => {
  if (imageUrl) {
    const filePath = path.join(uploadDir, path.basename(imageUrl));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

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

try {
  db.exec(`ALTER TABLE products ADD COLUMN image TEXT;`);
} catch (error) {
  if (!error.message.includes('duplicate column')) {
    console.warn('Migration warning:', error.message);
  }
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
  const { user_id, name, sku, category, description, unit = 'UN', cost_price, sell_price, quantity = 0, min_quantity = 0, image } = req.body;

  // Validação básica
  if (!name || !user_id) {
    return res.status(422).json({ error: 'Nome e ID do usuário são obrigatórios' });
  }

  const productId = uuidv4();
  const timestamp = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO products
      (id, user_id, name, sku, category, description, unit, cost_price, sell_price, quantity, min_quantity, image, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      productId, user_id, name, sku ?? null, category ?? null, description ?? null,
      unit, cost_price ?? null, sell_price ?? null, quantity, min_quantity, image ?? null, timestamp, timestamp
    );

    res.json({
      id: productId,
      user_id,
      name,
      sku,
      category,
      description,
      unit,
      cost_price,
      sell_price,
      quantity,
      min_quantity,
      image,
      created_at: timestamp,
      updated_at: timestamp
    });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Falha ao criar produto' });
  }
});

app.put('/api/products/:id', (req, res) => {
  const updates = req.body;
  const productId = req.params.id;

  // Campos permitidos para atualização
  const allowedFields = ['name', 'sku', 'category', 'description', 'unit', 'cost_price', 'sell_price', 'quantity', 'min_quantity', 'image'];
  const validUpdates = {};

  // Filtrar apenas campos válidos
  Object.keys(updates).forEach(field => {
    if (allowedFields.includes(field) && field !== 'id') {
      validUpdates[field] = updates[field];
    }
  });

  if (Object.keys(validUpdates).length === 0) {
    return res.json({ success: true });
  }

  try {
    // Verificar se produto existe e lidar com mudança de imagem
    const currentProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!currentProduct) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    if (validUpdates.image && currentProduct.image !== validUpdates.image) {
      deleteImageFile(currentProduct.image);
    }

    // Construir query de forma mais segura
    const updateFields = Object.keys(validUpdates);
    const setClause = updateFields.map(field => `${field} = ?`).join(', ');
    const values = updateFields.map(field => validUpdates[field] ?? null);

    db.prepare(`UPDATE products SET ${setClause}, updated_at = ? WHERE id = ?`)
      .run(...values, new Date().toISOString(), productId);

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Falha ao atualizar produto' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (product && product.image) {
    deleteImageFile(product.image);
  }
  res.json({ success: db.prepare('DELETE FROM products WHERE id = ?').run(productId).changes > 0 });
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

app.listen(3000, () => console.log('Backend rodando em http://localhost:3000'));