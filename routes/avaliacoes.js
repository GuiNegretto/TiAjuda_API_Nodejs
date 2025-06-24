const express = require('express');
const router = express.Router();
const db = require('../db'); // seu módulo de conexão com o banco

// Criar avaliação
router.post('/', async (req, res) => {
    const { id_servico, nota, comentario } = req.body;

    if (!id_servico || !nota) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    }

    try {
        const result = await db.query(
            'INSERT INTO avaliacoes (id_servico, nota, comentario) VALUES ($1, $2, $3) RETURNING *',
            [id_servico, nota, comentario]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao inserir avaliação:', err);
        res.status(500).json({ error: 'Erro interno ao cadastrar avaliação.' });
    }
});

// Listar avaliações de um serviço
router.get('/servico/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query(
            'SELECT * FROM avaliacoes WHERE id_servico = $1 ORDER BY data_avaliacao DESC',
            [id]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar avaliações:', err);
        res.status(500).json({ error: 'Erro ao buscar avaliações.' });
    }
});

module.exports = router;
