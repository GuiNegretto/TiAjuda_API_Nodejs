const express = require('express');
const router = express.Router(); // Cria um novo objeto Router
const db = require('../db'); // Note o '../' para voltar um diretório
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Importe a biblioteca no topo
const { sendEmail } = require('../services/emailService'); // Importa a função sendEmail do novo serviço!

// Rota para obter todos os usuários
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM usuarios');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro no servidor');
  }
});

// Rota para obter um usuário por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Usuário não encontrado');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro no servidor');
  }
});

// Rota para criar um novo usuário
router.post('/', async (req, res) => {
  const { nome, email, senha, tipo} = req.body;
  if (!nome || !email || !senha) {
    return res.status(400).send('Nome, email e senha são obrigatórios');
  }
  try {
    const senhaHash = await bcrypt.hash(req.body.senha, 10);
    const { rows } = await db.query(
      'INSERT INTO usuarios (nome, email, senha, tipo) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, email, senhaHash, tipo]
    );

    const newUser = rows[0]; // Pega o usuário recém-criado.

    // 3. Enviar e-mail de boas-vindas
    const subject = 'Bem-vindo(a) à nossa plataforma!';
    const htmlBody = `
        <p>Olá <b>${newUser.nome}</b>,</p>
        <p>Bem-vindo(a) à nossa plataforma! Seu cadastro foi realizado com sucesso.</p>
        <p>Aproveite!</p>
        <p>Atenciosamente,<br/>A Equipe</p>
    `;

    // Chama a função sendEmail (importada do app.js)
    const emailResult = await sendEmail(newUser.email, subject, htmlBody);

    // 4. Responder ao cliente
    if (emailResult.success) {
        res.status(201).json({ // Status 201 Created para sucesso no cadastro.
            message: 'Usuário cadastrado com sucesso! Um e-mail de boas-vindas foi enviado.',
            user: newUser, // Retorna os dados do novo usuário (sem a senha hash).
            emailSent: true,
            messageId: emailResult.messageId,
            previewUrl: emailResult.previewUrl
        });
    } else {
        // Se o e-mail falhar, ainda consideramos o cadastro como bem-sucedido no DB,
        // mas informamos sobre a falha no envio do e-mail na resposta.
        console.warn(`Usuário ${newUser.email} cadastrado, mas falha ao enviar e-mail: ${emailResult.error}`);
        res.status(201).json({
            message: 'Usuário cadastrado com sucesso, mas houve uma falha no envio do e-mail de boas-vindas.',
            user: newUser,
            emailSent: false,
            emailError: emailResult.error
        });
    }
    //res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro no servidor');
  }
});

// Rota para atualizar um usuário
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, email, senha, tipo } = req.body;
  if (!nome || !email || !senha || !tipo) {
    return res.status(400).send('Nome, email, senha e tipo são obrigatórios');
  }
  try {
    const senhaHash = await bcrypt.hash(req.body.senha, 10);
    const { rows } = await db.query(
      'UPDATE usuarios SET nome = $1, email = $2, senha = $3, tipo = $4 WHERE id = $5 RETURNING *',
      [nome, email, senhaHash, tipo, id]
    );
    if (rows.length === 0) {
      return res.status(404).send('Usuário não encontrado');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro no servidor');
  }
});

// Rota para deletar um usuário
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await db.query('DELETE FROM usuarios WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).send('Usuário não encontrado');
    }
    res.status(204).send(); // 204 No Content
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro no servidor');
  }
});


// Rota para login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
      return res.status(400).send('Email and senha são obrigatórios');
  }

  try {
      // 1. Buscar usuário pelo email
      const { rows } = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
      if (rows.length === 0) {
          // Se não encontrou o usuário, retorna erro 401 (Não Autorizado)
          return res.status(401).send('Credenciais inválidas');
      }

      const usuario = rows[0];

      // 2. Comparar a senha enviada com o hash salvo no banco
      const senhaValida = await bcrypt.compare(senha, usuario.senha);

      if (!senhaValida) {
          // Se as senhas não batem, retorna erro 401
          return res.status(401).send('Credenciais inválidas');
      }

      // Em um app real, essa chave secreta deve ser mais complexa e guardada em variáveis de ambiente.
      const token = jwt.sign({ id: usuario.id }, 'suaChaveSecretaSuperDificil', {
        expiresIn: 86400 // Token expira em 24 horas (em segundos)
    });

    // Remove a senha do objeto antes de enviar de volta
    delete usuario.senha;

      // 3. Login bem-sucedido
      // Em uma aplicação real, aqui você geraria um token (JWT)
      res.status(200).json({
          message: 'Login bem-sucedido!',
          usuario: usuario,
          token: token
      });

  } catch (err) {
      console.error(err);
      res.status(500).send('Erro no servidor');
  }
});

module.exports = router;