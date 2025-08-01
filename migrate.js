const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 5432,
});

async function ensureMigrationTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) UNIQUE NOT NULL,
            run_on TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `);
}

async function getAppliedMigrations() {
    const res = await pool.query('SELECT filename FROM migrations ORDER BY id');
    return res.rows.map(row => row.filename);
}

async function runMigrationFile(filename) {
    const filePath = path.join(__dirname, 'migrations', filename);
    const sql = fs.readFileSync(filePath).toString();
    await pool.query(sql);
    await pool.query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
    console.log(`Applied migration: ${filename}`);
}

async function runMigrations() {
    try {
        await ensureMigrationTable();
        const applied = await getAppliedMigrations();

        const files = fs.readdirSync(path.join(__dirname, 'migrations'))
            .filter(file => file.endsWith('.sql'))
            .sort();

        for (const file of files) {
            if (!applied.includes(file)) {
                await runMigrationFile(file);
            } else {
                console.log(`Skipping already applied migration: ${file}`);
            }
        }

        console.log('All migrations applied.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigrations();
