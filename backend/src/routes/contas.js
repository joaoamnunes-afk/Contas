
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET: listar todas as contas
router.get('/', async (req, res) => {
    try {
        const resultado = await pool.query(
            'SELECT * FROM CONTA ORDER BY VENCIMENTO_CONTA'
        );

        res.json(resultado.rows);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar contas.' });
    }
});

// POST: cadastrar uma nova conta
router.post('/', async (req, res) => {
    const {
        desc_conta,
        valor_conta,
        vencimento_conta,
        status,
        quitacao_conta,
        ano,
        mes
    } = req.body;

    if (
        !desc_conta ||
        valor_conta === undefined ||
        !vencimento_conta ||
        !status ||
        !ano ||
        !mes
    ) {
        return res.status(400).json({
            erro: 'Preencha todos os campos obrigatórios.'
        });
    }

    if (!['PAGO', 'A PAGAR'].includes(status)) {
        return res.status(400).json({
            erro: 'Status inválido.'
        });
    }

    try {
        const resultado = await pool.query(
            `INSERT INTO CONTA
            (DESC_CONTA, VALOR_CONTA, VENCIMENTO_CONTA,
             STATUS, QUITACAO_CONTA, ANO, MES)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                desc_conta,
                valor_conta,
                vencimento_conta,
                status,
                status === 'PAGO' ? quitacao_conta || null : null,
                ano,
                mes
            ]
        );

        res.status(201).json(resultado.rows[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({
            erro: 'Erro ao cadastrar conta. Verifique os dados e o mês/ano cadastrados.'
        });
    }
});

// PUT: atualizar uma conta existente
router.put('/:id', async (req, res) => {
    const { id } = req.params;

    const {
        desc_conta,
        valor_conta,
        vencimento_conta,
        status,
        quitacao_conta,
        ano,
        mes
    } = req.body;

    if (
        !desc_conta ||
        valor_conta === undefined ||
        !vencimento_conta ||
        !status ||
        !ano ||
        !mes
    ) {
        return res.status(400).json({
            erro: 'Preencha todos os campos obrigatórios.'
        });
    }

    if (!['PAGO', 'A PAGAR'].includes(status)) {
        return res.status(400).json({
            erro: 'Status inválido.'
        });
    }

    try {
        const resultado = await pool.query(
            `UPDATE CONTA
             SET DESC_CONTA = $1,
                 VALOR_CONTA = $2,
                 VENCIMENTO_CONTA = $3,
                 STATUS = $4,
                 QUITACAO_CONTA = $5,
                 ANO = $6,
                 MES = $7
             WHERE ID_CONTA = $8
             RETURNING *`,
            [
                desc_conta,
                valor_conta,
                vencimento_conta,
                status,
                status === 'PAGO' ? quitacao_conta || null : null,
                ano,
                mes,
                id
            ]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: 'Conta não encontrada.'
            });
        }

        res.json(resultado.rows[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({
            erro: 'Erro ao atualizar conta. Verifique os dados e o mês/ano cadastrados.'
        });
    }
});

// DELETE: excluir somente uma conta pelo ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const resultado = await pool.query(
            `DELETE FROM CONTA
             WHERE ID_CONTA = $1
             RETURNING *`,
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: 'Conta não encontrada.'
            });
        }

        res.json({
            mensagem: 'Conta excluída com sucesso.',
            conta: resultado.rows[0]
        });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({
            erro: 'Erro ao excluir conta.'
        });
    }
});

module.exports = router;
