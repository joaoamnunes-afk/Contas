
import { useEffect, useState } from 'react';
import './App.css';

const API_URL = 'http://localhost:3000/api/contas';

const formularioInicial = {
    desc_conta: '',
    valor_conta: '',
    vencimento_conta: '',
    status: 'A PAGAR',
    quitacao_conta: ''
};

const meses = [
    'Janeiro', 'Fevereiro', 'Março',
    'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro',
    'Outubro', 'Novembro', 'Dezembro'
];

function App() {
    const [contas, setContas] = useState([]);
    const [formulario, setFormulario] = useState(formularioInicial);
    const [editandoId, setEditandoId] = useState(null);

    const [mensagem, setMensagem] = useState('');
    const [carregando, setCarregando] = useState(false);

    // Filtros
    const [tipoFiltro, setTipoFiltro] = useState('TODAS');

    const [mesFiltro, setMesFiltro] = useState(
        String(new Date().getMonth() + 1).padStart(2, '0')
    );

    const [anoFiltro, setAnoFiltro] = useState(
        String(new Date().getFullYear())
    );

    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');

    // Buscar contas
    async function carregarContas() {
        try {
            setCarregando(true);

            const resposta = await fetch(API_URL);

            if (!resposta.ok) {
                throw new Error('Erro ao buscar contas.');
            }

            const dados = await resposta.json();
            setContas(dados);

        } catch (erro) {
            setMensagem(erro.message);
            console.error(erro);
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregarContas();
    }, []);

    // Atualizar campos do formulário
    function atualizarFormulario(e) {
        const { name, value } = e.target;

        setFormulario((anterior) => ({
            ...anterior,
            [name]: value
        }));
    }

    // Limpar formulário e cancelar edição
    function cancelarEdicao() {
        setFormulario(formularioInicial);
        setEditandoId(null);
        setMensagem('');
    }

    // Cadastrar ou atualizar
    async function salvarConta(e) {
        e.preventDefault();

        if (
            !formulario.desc_conta.trim() ||
            !formulario.valor_conta ||
            !formulario.vencimento_conta
        ) {
            setMensagem('Preencha os campos obrigatórios.');
            return;
        }

        if (Number(formulario.valor_conta) <= 0) {
            setMensagem('O valor deve ser maior que zero.');
            return;
        }

        if (
            formulario.status === 'PAGO' &&
            !formulario.quitacao_conta
        ) {
            setMensagem('Informe a data de quitação.');
            return;
        }

        const dados = {
            ...formulario,
            valor_conta: Number(formulario.valor_conta),
            ano: Number(formulario.vencimento_conta.slice(0, 4)),
            mes: Number(formulario.vencimento_conta.slice(5, 7)),
            quitacao_conta: formulario.status === 'PAGO'
                ? formulario.quitacao_conta || null
                : null
        };

        try {
            const metodo = editandoId ? 'PUT' : 'POST';

            const url = editandoId
                ? `${API_URL}/${editandoId}`
                : API_URL;

            const resposta = await fetch(url, {
                method: metodo,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dados)
            });

            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(resultado.erro || 'Erro ao salvar conta.');
            }

            setMensagem(
                editandoId
                    ? 'Conta atualizada com sucesso!'
                    : 'Conta cadastrada com sucesso!'
            );

            setFormulario(formularioInicial);
            setEditandoId(null);

            await carregarContas();

        } catch (erro) {
            setMensagem(erro.message);
            console.error(erro);
        }
    }

    // Carregar dados de uma conta para edição
    function editarConta(conta) {
        setEditandoId(conta.id_conta);

        setFormulario({
            desc_conta: conta.desc_conta,
            valor_conta: conta.valor_conta,
            vencimento_conta: String(conta.vencimento_conta).slice(0, 10),
            status: conta.status,
            quitacao_conta: conta.quitacao_conta
                ? String(conta.quitacao_conta).slice(0, 10)
                : ''
        });

        setMensagem('');

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // Excluir conta
    async function excluirConta(id) {
        const confirmar = window.confirm(
            `Tem certeza que deseja excluir a conta de ID ${id}? Esta ação não pode ser desfeita.`
        );

        if (!confirmar) return;

        try {
            const resposta = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });

            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(resultado.erro || 'Erro ao excluir conta.');
            }

            if (editandoId === id) {
                cancelarEdicao();
            }

            setMensagem('Conta excluída com sucesso!');
            await carregarContas();

        } catch (erro) {
            setMensagem(erro.message);
            console.error(erro);
        }
    }

    // Formatação
    function formatarValor(valor) {
        return Number(valor).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    function formatarData(data) {
        if (!data) return 'Não informado';

        const [ano, mes, dia] = String(data).slice(0, 10).split('-');

        return `${dia}/${mes}/${ano}`;
    }

    // Aplicar filtros
    const contasFiltradas = contas.filter((conta) => {
        const vencimento = String(conta.vencimento_conta).slice(0, 10);

        if (tipoFiltro === 'TODAS') {
            return true;
        }

        if (tipoFiltro === 'MES') {
            return vencimento.startsWith(`${anoFiltro}-${mesFiltro}`);
        }

        if (tipoFiltro === 'PERIODO') {
            if (dataInicio && vencimento < dataInicio) return false;
            if (dataFim && vencimento > dataFim) return false;

            return true;
        }

        return true;
    });

    // Resumo financeiro
    const totalContas = contasFiltradas.reduce(
        (total, conta) => total + Number(conta.valor_conta),
        0
    );

    const totalPago = contasFiltradas
        .filter((conta) => conta.status === 'PAGO')
        .reduce(
            (total, conta) => total + Number(conta.valor_conta),
            0
        );

    const totalAPagar = contasFiltradas
        .filter((conta) => conta.status === 'A PAGAR')
        .reduce(
            (total, conta) => total + Number(conta.valor_conta),
            0
        );

    return (
        <main className="container">

            <header className="cabecalho">
                <div>
                    <h1>Gerenciador de Contas</h1>
                    <p>Controle seus pagamentos e despesas.</p>
                </div>

                <div className="total-cabecalho">
                    <span>Contas cadastradas</span>
                    <strong>{contas.length}</strong>
                </div>
            </header>

            {/* Formulário */}
            <section className="painel">
                <div className="titulo-secao">
                    <h2>
                        {editandoId ? 'Editar conta' : 'Nova conta'}
                    </h2>

                    {editandoId && (
                        <button
                            type="button"
                            className="botao-cancelar"
                            onClick={cancelarEdicao}
                        >
                            Cancelar edição
                        </button>
                    )}
                </div>

                <form onSubmit={salvarConta} className="formulario">

                    <label>
                        Descrição
                        <input
                            type="text"
                            name="desc_conta"
                            value={formulario.desc_conta}
                            onChange={atualizarFormulario}
                            placeholder="Ex: Conta de luz"
                            required
                        />
                    </label>

                    <label>
                        Valor (R$)
                        <input
                            type="number"
                            name="valor_conta"
                            value={formulario.valor_conta}
                            onChange={atualizarFormulario}
                            placeholder="150.00"
                            min="0.01"
                            step="0.01"
                            required
                        />
                    </label>

                    <label>
                        Vencimento
                        <input
                            type="date"
                            name="vencimento_conta"
                            value={formulario.vencimento_conta}
                            onChange={atualizarFormulario}
                            required
                        />
                    </label>

                    <label>
                        Status
                        <select
                            name="status"
                            value={formulario.status}
                            onChange={atualizarFormulario}
                        >
                            <option value="A PAGAR">A pagar</option>
                            <option value="PAGO">Pago</option>
                        </select>
                    </label>

                    {formulario.status === 'PAGO' && (
                        <label>
                            Data de quitação
                            <input
                                type="date"
                                name="quitacao_conta"
                                value={formulario.quitacao_conta}
                                onChange={atualizarFormulario}
                                required
                            />
                        </label>
                    )}

                    <div className="acoes-formulario">
                        <button type="submit">
                            {editandoId ? 'Salvar alterações' : 'Cadastrar conta'}
                        </button>
                    </div>

                </form>

                {mensagem && (
                    <p className="mensagem">{mensagem}</p>
                )}
            </section>

            {/* Resumo */}
            <section className="resumo">

                <div className="resumo-item">
                    <span>Total de contas</span>
                    <strong>{formatarValor(totalContas)}</strong>
                </div>

                <div className="resumo-item">
                    <span>Total pago</span>
                    <strong className="texto-pago">
                        {formatarValor(totalPago)}
                    </strong>
                </div>

                <div className="resumo-item">
                    <span>Total a pagar</span>
                    <strong className="texto-a-pagar">
                        {formatarValor(totalAPagar)}
                    </strong>
                </div>

            </section>

            {/* Filtros */}
            <section className="painel">
                <div className="titulo-secao">
                    <h2>Contas</h2>

                    <button
                        type="button"
                        className="botao-atualizar"
                        onClick={carregarContas}
                    >
                        Atualizar lista
                    </button>
                </div>

                <div className="filtros">

                    <label>
                        Filtrar por
                        <select
                            value={tipoFiltro}
                            onChange={(e) => setTipoFiltro(e.target.value)}
                        >
                            <option value="TODAS">Todas as contas</option>
                            <option value="MES">Mês específico</option>
                            <option value="PERIODO">Período personalizado</option>
                        </select>
                    </label>

                    {tipoFiltro === 'MES' && (
                        <>
                            <label>
                                Mês
                                <select
                                    value={mesFiltro}
                                    onChange={(e) => setMesFiltro(e.target.value)}
                                >
                                    {meses.map((mes, indice) => (
                                        <option
                                            key={indice}
                                            value={String(indice + 1).padStart(2, '0')}
                                        >
                                            {mes}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Ano
                                <input
                                    type="number"
                                    value={anoFiltro}
                                    onChange={(e) => setAnoFiltro(e.target.value)}
                                />
                            </label>
                        </>
                    )}

                    {tipoFiltro === 'PERIODO' && (
                        <>
                            <label>
                                Data inicial
                                <input
                                    type="date"
                                    value={dataInicio}
                                    onChange={(e) => {
                                        setDataInicio(e.target.value);

                                        if (dataFim && e.target.value > dataFim) {
                                            setDataFim('');
                                        }
                                    }}
                                />
                            </label>

                            <label>
                                Data final
                                <input
                                    type="date"
                                    value={dataFim}
                                    min={dataInicio || undefined}
                                    onChange={(e) => setDataFim(e.target.value)}
                                />
                            </label>
                        </>
                    )}

                </div>

                <p className="resultado-filtro">
                    {contasFiltradas.length} conta(s) encontrada(s).
                </p>

                {/* Tabela de contas */}
                <div className="tabela-container">
                    <table className="tabela-contas">
                        <thead>
                            <tr>
                                <th>Descrição</th>
                                <th>Vencimento</th>
                                <th>Valor</th>
                                <th>Status</th>
                                <th>Quitação</th>
                                <th>Ações</th>
                            </tr>
                        </thead>

                        <tbody>
                            {contasFiltradas.map((conta) => (
                                <tr key={conta.id_conta}>
                                    <td className="descricao-conta">
                                        {conta.desc_conta}
                                    </td>

                                    <td>
                                        {formatarData(conta.vencimento_conta)}
                                    </td>

                                    <td className="valor-conta">
                                        {formatarValor(conta.valor_conta)}
                                    </td>

                                    <td>
                                        <span className={`status ${
                                            conta.status === 'PAGO'
                                                ? 'pago'
                                                : 'a-pagar'
                                        }`}>
                                            {conta.status}
                                        </span>
                                    </td>

                                    <td>
                                        {conta.quitacao_conta
                                            ? formatarData(conta.quitacao_conta)
                                            : '—'}
                                    </td>

                                    <td>
                                        <div className="acoes-conta">
                                            <button
                                                type="button"
                                                className="botao-editar"
                                                onClick={() => editarConta(conta)}
                                            >
                                                Editar
                                            </button>

                                            <button
                                                type="button"
                                                className="botao-excluir"
                                                onClick={() => excluirConta(conta.id_conta)}
                                            >
                                                Excluir
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {contasFiltradas.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="sem-contas">
                                        {carregando
                                            ? 'Carregando...'
                                            : 'Nenhuma conta encontrada.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </section>

        </main>
    );
}

export default App;
