// MySQL/MariaDB connection pool + schema for the newsletter subscribers table.
// Mirrors the mail-vault-app website API (mysql2/promise). Degrades gracefully:
// if DB_* env vars are missing, getPool() returns null and the newsletter
// endpoints report "not configured yet" instead of crashing.

const mysql = require('mysql2/promise');

let pool = null;

function dbConfigured() {
    return !!(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME);
}

function getPool() {
    if (!dbConfigured()) return null;
    if (pool) return pool;
    pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 5,
        charset: 'utf8mb4',
    });
    return pool;
}

async function initDatabase() {
    const p = getPool();
    if (!p) {
        console.warn('Newsletter DB not configured (DB_HOST/DB_USER/DB_NAME missing) — /api/subscribe will report "not configured".');
        return;
    }
    await p.query(`
        CREATE TABLE IF NOT EXISTS subscribers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            status ENUM('pending','confirmed') NOT NULL DEFAULT 'pending',
            token VARCHAR(64),
            token_expires DATETIME,
            ip_hash VARCHAR(64),
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            confirmed_at DATETIME
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('Newsletter DB ready (subscribers table).');
}

module.exports = { getPool, initDatabase, dbConfigured };
