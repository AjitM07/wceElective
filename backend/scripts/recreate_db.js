const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  console.log('Connected to MySQL. Recreating database...');

  try {
    await connection.query('DROP DATABASE IF EXISTS wce_elective');
    console.log('Dropped database wce_elective');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Split statements, remove comments and empty lines
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      // Execute each statement
      await connection.query(statement);
    }
    console.log('Successfully recreated wce_elective database from schema.sql');

  } catch (err) {
    console.error('Error recreating database:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
