const express = require('express');
const router = express.Router();
const db = require('../db'); // Ajuste o caminho se necessário

// --- ROTA PARA CRIAR UM NOVO SERVIÇO (CREATE) ---
// POST /servicos
router.post('/', async (req, res) => {
    const { titulo, descricao, id_tecnico, id_cliente } = req.body;

    // Validação básica de entrada
    if (!titulo) {
        return res.status(400).json({ error: 'O campo "titulo" é obrigatório.' });
    }

    try {
        const result = await db.query(
            'INSERT INTO servicos (titulo, descricao, id_tecnico, id_cliente) VALUES ($1, $2, $3, $4) RETURNING *',
            [titulo, descricao, id_tecnico, id_cliente]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});


// --- ROTA PARA LER TODOS OS SERVIÇOS (READ) ---
// GET /servicos
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM servicos ORDER BY data_cadastro DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});


// --- ROTA PARA LER UM SERVIÇO ESPECÍFICO PELO ID (READ) ---
// GET /servicos/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('SELECT * FROM servicos WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Serviço não encontrado.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

router.post('/atendimento/', async (req, res) => {
    const { id_servico, id_tecnico, descricao, status } = req.body;
  
    try {
      const result = await db.query(
        `INSERT INTO servicos_atendimento (id_servico, id_tecnico, descricao, status)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [id_servico, id_tecnico, descricao, status || 'A']
      );
  
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao criar atendimento:', error);
      res.status(500).json({ erro: 'Erro ao criar atendimento' });
    }
  });
  
  router.get('/atendimento/:id_tecnico', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await db.query(
        `SELECT * FROM servicos_atendimento where status = 'A' ORDER BY data_atendimento DESC`//, [id]
      );
  
      res.json(result.rows);
    } catch (error) {
      console.error('Erro ao listar atendimentos:', error);
      res.status(500).json({ erro: 'Erro ao listar atendimentos' });
    }
  });

  router.put('/atendimento/:id', async (req, res) => {
    const { id } = req.params;
    const { descricao } = req.body;

    // Validação
    if (!descricao) {
        return res.status(400).json({ error: 'O campo "descricao" é obrigatório.' });
    }

    try {
        const result = await db.query(
            `UPDATE servicos_atendimento SET data_atendimento = now(), descricao_atendimento = $1, status = 'F' WHERE id_servico = $2 RETURNING *`,
            [ descricao, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Atendimento não encontrado para atualização.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

router.get('/id_cliente/:id', async (req, res) => {
  const { id } = req.params;

  try {
      const result = await db.query('SELECT * FROM servicos WHERE id_cliente = $1', [id]);

      if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Serviço não encontrado.' });
      }
      res.status(200).json(result.rows);
  } catch (err) {
      console.error(err.message);
      res.status(500).send('Erro no servidor');
  }
});


// --- ROTA PARA ATUALIZAR UM SERVIÇO (UPDATE) ---
// PUT /servicos/:id
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { titulo, descricao, id_tecnico, id_cliente } = req.body;

    // Validação
    if (!titulo) {
        return res.status(400).json({ error: 'O campo "titulo" é obrigatório.' });
    }

    try {
        const result = await db.query(
            'UPDATE servicos SET titulo = $1, descricao = $2 WHERE id = $3 RETURNING *',
            [titulo, descricao, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Serviço não encontrado para atualização.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});


// --- ROTA PARA DELETAR UM SERVIÇO (DELETE) ---
// DELETE /servicos/:id
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('DELETE FROM servicos WHERE id = $1', [id]);

        // .rowCount informa quantas linhas foram afetadas. Se 0, o ID não existia.
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Serviço não encontrado para exclusão.' });
        }
        // 204 No Content é uma resposta padrão para DELETE bem-sucedido
        res.status(204).send();
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});


// Exporta o router para ser usado no arquivo principal da aplicação
module.exports = router;