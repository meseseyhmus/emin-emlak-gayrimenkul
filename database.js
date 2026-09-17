const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const isPostgres = !!(process.env.DATABASE_URL || process.env.POSTGRES_URL);

let pgPool;
let sqliteDb;

if (isPostgres) {
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false } // Required for most cloud providers
  });
  console.log('Veritabanı: PostgreSQL (Bulut)');
} else {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.resolve(__dirname, 'data', 'database.sqlite');
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('SQLite bağlantı hatası:', err.message);
    else console.log('Veritabanı: SQLite (Yerel)');
  });
}

function formatPgQuery(sql) {
  let idx = 1;
  return sql.replace(/\?/g, () => `$${idx++}`);
}

const db = {
  isPostgres,
  
  // SELECT sorguları için
  async query(sql, params = []) {
    if (isPostgres) {
      const res = await pgPool.query(formatPgQuery(sql), params);
      return res.rows;
    } else {
      return new Promise((resolve, reject) => {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }
  },
  
  // INSERT / UPDATE / DELETE sorguları için
  async execute(sql, params = []) {
    if (isPostgres) {
      const res = await pgPool.query(formatPgQuery(sql), params);
      return res.rowCount;
    } else {
      return new Promise((resolve, reject) => {
        sqliteDb.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        });
      });
    }
  }
};

// Veritabanı tablolarını oluştur (Senkron çalıştırılabilir)
async function initDB() {
  try {
    // Settings tablosu
    await db.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT
      )
    `);

    // Listings tablosu
    await db.execute(`
      CREATE TABLE IF NOT EXISTS listings (
        id VARCHAR(255) PRIMARY KEY,
        title TEXT,
        price INTEGER,
        type VARCHAR(50),
        status VARCHAR(50),
        bedrooms INTEGER,
        bathrooms INTEGER,
        squareMeters INTEGER,
        location TEXT,
        agentName VARCHAR(255),
        agentPhone VARCHAR(50),
        image TEXT,
        imageUrls TEXT,
        videoUrl TEXT,
        features TEXT,
        featured INTEGER DEFAULT 0
      )
    `);

    // Messages tablosu
    await db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        subject TEXT,
        message TEXT,
        date VARCHAR(255),
        read INTEGER DEFAULT 0
      )
    `);
    
    console.log('Tablolar kontrol edildi/oluşturuldu.');
  } catch (err) {
    console.error('Tablo oluşturma hatası:', err);
  }
}

initDB();

module.exports = db;
