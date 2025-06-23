const { Pool } = require('pg');

// const pool = new Pool({
//   user: 'postgres',
//   host: 'localhost',

//   database: 'postgres',
//   password: 'pgadmin',
//   port: 5432,
// });

const pool = new Pool({
  connectionString: process.env.DB_URL, // <- essa variável estará configurada no Render
  ssl: {
    rejectUnauthorized: false // necessário para conexão segura no Render
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};