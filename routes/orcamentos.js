const express = require('express');
const router = express.Router();
const db = require('../db'); // ou o caminho do seu módulo de conexão com o banco
const { sendEmail } = require('../services/emailService'); // Importa a função sendEmail do novo serviço!


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

router.put('/:id/aprovado', async (req, res) => {
    const { id } = req.params;
    const { form_pag } = req.body;

    try {
        const result = await db.query(
            `UPDATE orcamentos SET status = 'A', form_pag = $1 WHERE id = $2 RETURNING *`,
            [form_pag, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Orçamento não encontrado.' });
        }
    
        const orcamento = result.rows[0];
    
        // Opcional: buscar informações do usuário associado
        const usuarioResult = await db.query(`SELECT u.* FROM usuarios u 
            inner join servicos s 
            on s.id_cliente = u.id 
            WHERE s.id = $1`, [orcamento.id_servico]);
        if (usuarioResult.rows.length === 0) {
          return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
    
        const usuario = usuarioResult.rows[0];
    
        // Montar link para confirmação
        const confirmLink = `https://tiajuda-api-nodejs.onrender.com/orcamentos/${id}/confirmar_pag`;
    
        // Montar e-mail
        const subject = 'Detalhes do pagamento do seu orçamento';
        const htmlBody = `
          <p>Olá <strong>${usuario.nome}</strong>,</p>
          <p>Segue abaixo os dados do seu orçamento:</p>
          <ul>
            <li><strong>Valor:</strong> R$ ${orcamento.valor}</li>
            <li><strong>Observação:</strong> ${orcamento.observacao || 'Nenhuma'}</li>
          </ul>
          <p>Para confirmar o pagamento, clique no botão abaixo:</p>
          <p><a href="${confirmLink}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Confirmar Pagamento</a></p>
          <p>Atenciosamente,<br/>Equipe TiaAjuda</p>
        `;
    
        const emailResult = await sendEmail(usuario.email, subject, htmlBody);
    
        if (emailResult.success) {
          res.json({
            message: 'E-mail enviado com sucesso!',
            email: usuario.email,
            previewUrl: emailResult.previewUrl
          });
        } else {
          res.status(500).json({ error: 'Erro ao enviar e-mail.', detail: emailResult.error });
        }
    
      } catch (err) {
        console.error('Erro ao enviar e-mail de pagamento:', err);
        res.status(500).json({ error: 'Erro no servidor.' });
      }
});

router.get('/:id/confirmar_pag', async (req, res) => {
    const { id } = req.params;
  
    try {
      const result = await db.query(
        'UPDATE orcamentos SET status = $1 WHERE id = $2 RETURNING *',
        ['F', id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).send('Orçamento não encontrado.');
      }
      const id_servico = result.id_servico;
      const id_tecnico = result.id_tecnico;

      result = await db.query(
        'UPDATE servicos SET status = $1 WHERE id = $2',
        ['A', id_servico]
      );

      processarPagamento(id_servico, id_tecnico);
  
      res.send(`<h2>Pagamento confirmado com sucesso!</h2><p>Obrigado por confirmar.</p>`);
    } catch (err) {
      console.error('Erro ao confirmar pagamento:', err);
      res.status(500).send('Erro ao confirmar pagamento.');
    }
  });

  async function processarPagamento(id_servico, id_tecnico) {
    try {
      await db.query(
        `INSERT INTO servicos_atendimento (id_servico, id_tecnico, descricao, status)
         VALUES ($1, $2, (select descricao from servicos where id = $1), $3)`,
        [id_servico, id_tecnico, 'A']
      );
    } catch (error) {
      console.error('Erro ao criar atendimento:', error);
    }
  }
  

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
