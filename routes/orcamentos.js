const express = require('express');
const router = express.Router();
const db = require('../db'); // ou o caminho do seu módulo de conexão com o banco

// GET: Lista todos os orçamentos
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM orcamentos');
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar orçamentos:', err);
        res.status(500).json({ error: 'Erro ao buscar orçamentos.' });
    }
});

// GET: Busca um orçamento por ID
router.get('/id_tecnico/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`SELECT o.*, coalesce(o.status, 'C') as status, s.id as id_servico, s.titulo as titulo_servico, u.nome as nome_cliente
            FROM servicos s 
            left join orcamentos o 
            on s.id =  o.id_servico 
            and o.id_tecnico = $1 
            inner join usuarios u
            on s.id_cliente = u.id
            where coalesce (s.status, 'C' ) != 'L'`, [id]);

        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar orçamento:', err);
        res.status(500).json({ error: 'Erro ao buscar orçamento.' });
    }
});

// GET: Busca um orçamento por ID
router.get('/id_cliente/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`SELECT o.status, s.id as id_servico, s.titulo as titulo_servico, u.nome as nome_cliente FROM servicos s 
left join orcamentos o 
on s.id =  o.id_servico
inner join usuarios u
on s.id_cliente = u.id
where coalesce (o.status, 'C' ) != 'C'
and s.id_cliente = $1`, [id]);

        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar orçamento:', err);
        res.status(500).json({ error: 'Erro ao buscar orçamento.' });
    }
});

// POST: Cria um novo orçamento
router.post('/', async (req, res) => {
    const { valor, observacao, id_servico, id_tecnico } = req.body;

    try {
        const result = await db.query(
            'INSERT INTO orcamentos (valor, observacao, id_servico, id_tecnico) VALUES ($1, $2, $3, $4) RETURNING *',
            [valor, observacao, id_servico, id_tecnico]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao criar orçamento:', err);
        res.status(500).json({ error: 'Erro ao criar orçamento.' });
    }
});

// PUT: Atualiza um orçamento existente
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { valor, observacao } = req.body;

    try {
        const result = await db.query(
            'UPDATE orcamentos SET valor = $1, observacao = $2 WHERE id = $3 RETURNING *',
            [valor, observacao, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Orçamento não encontrado.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao atualizar orçamento:', err);
        res.status(500).json({ error: 'Erro ao atualizar orçamento.' });
    }
});

// DELETE: Remove um orçamento
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('DELETE FROM orcamentos WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Orçamento não encontrado.' });
        }

        res.json({ message: 'Orçamento removido com sucesso.', orcamento: result.rows[0] });
    } catch (err) {
        console.error('Erro ao deletar orçamento:', err);
        res.status(500).json({ error: 'Erro ao deletar orçamento.' });
    }
});

module.exports = router;
