const express = require('express');
//const https = require('https');
//const fs = require('fs'); // 2. Importa o File System para ler os arquivos
const db = require('./db');

const app = express();

// 1. Importar os arquivos de rotas
const usuariosRoutes = require('./routes/usuarios');
const servicosRoutes = require('./routes/servicos');
const orcamentosRoutes = require('./routes/orcamentos');  
const avaliacoesRoutes = require('./routes/avaliacoes');  


app.use(express.json());

const formatDatesMiddleware = require('./middleware/formatDates');
app.use(formatDatesMiddleware);

app.use('/usuarios', usuariosRoutes);
app.use('/servicos', servicosRoutes);
app.use('/orcamentos', orcamentosRoutes);
app.use('/avaliacoes', avaliacoesRoutes);

// Para o login, você pode ter uma rota base


// 3. Lê os arquivos de chave e certificado
// const options = {
//   key: fs.readFileSync('key.pem'),
//   cert: fs.readFileSync('cert.pem')
// };


// 4. Cria o servidor HTTPS em vez do servidor HTTP
// https.createServer(options, app).listen(port, () => {
//   console.log(`API rodando em https://localhost:${port}`);
// });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});

app.get('/', (req, res) => {
  res.send('API TiAjuda funcionando!');
});