const express = require('express');
const cors = require('cors');
const pool = require('./config/database');
const contasRoutes = require('./routes/contas');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/contas', contasRoutes);
// Rota inicial
app.get('/', (req, res) => {
    res.send('Servidor do Gerenciador Financeiro funcionando!');
});

// Testar conexão com PostgreSQL
app.get('/api/health', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT NOW()');

        res.json({
            status: 'Conectado',
            banco: 'PostgreSQL',
            horario: resultado.rows[0].now
        });

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            status: 'Erro na conexão',
            mensagem: erro.message
        });
    }
});

// Inicializar servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});