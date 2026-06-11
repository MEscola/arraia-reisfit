// js/lista.js

// Carrega a lista pública de confirmados e atualiza o painel geral de pratos
async function carregarListaPublica() {
    const corpoTabela = document.getElementById('tabela-lista-corpo');
    if (!corpoTabela) return;

    corpoTabela.innerHTML = "<tr><td colspan='3'>Carregando a mesa coletiva...</td></tr>";

    // Busca os dados necessários no Supabase
    const { data, error } = await _supabase
        .from('cadastro_arraia')
        .select('nome, categoria_prato, sabor_prato, qtd_conjuge, qtd_amigos, status_pix')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erro ao carregar lista pública:", error);
        corpoTabela.innerHTML = "<tr><td colspan='3'>Erro ao carregar os dados da mesa coletiva.</td></tr>";
        return;
    }

    // Inicializa os contadores para o painel de resumo público
    let totalCaldos = 0;
    let totalDoces = 0;
    let totalSalgados = 0;
    let totalConfirmadosGeral = 0;

    corpoTabela.innerHTML = '';

    // Varre os registros do banco para montar a tabela
    data.forEach(aluno => {
        const categoria = aluno.categoria_prato || '';
        const sabor = aluno.sabor_prato || '';
        const status = aluno.status_pix || 'Pendente';

        // Lógica de contagem de público (Titular + Acompanhantes)
        const conjuge = Number(aluno.qtd_conjuge) || 0;
        const amigos = Number(aluno.qtd_amigos) || 0;
        const totalPessoasGrupo = 1 + conjuge + amigos;

        // Acumula no contador geral do evento
        totalConfirmadosGeral += totalPessoasGrupo;

        // Contabilidade visual dos pratos e caldos trazidos pelo grupo
        if (categoria.includes("Caldo")) {
            totalCaldos += totalPessoasGrupo;
        }
        if (categoria.includes("Doce")) {
            totalDoces += 1; // Conta o prato da família/solteiro
        }
        if (categoria.includes("Salgado")) {
            totalSalgados += 1;
        }

        // Cria a tag visual do status de pagamento de forma sutil para o público
        let statusTag = "";
        if (status === 'Pago') {
            statusTag = `<span style="color: #4CAF50; font-weight: bold;">✅ Confirmado</span>`;
        } else if (status.includes("Box Friendly")) {
            statusTag = `<span style="color: #2196F3; font-weight: bold;">🤝 Parceiro</span>`;
        } else {
            statusTag = `<span style="color: #FF9800; font-style: italic;">⚠️ Aguardando</span>`;
        }

        // Injeta a linha na tabela pública
        corpoTabela.innerHTML += `
            <tr>
                <td><strong>${aluno.nome}</strong><br><small style="color: #888;">Grupo de ${totalPessoasGrupo}p</small></td>
                <td>
                    <span style="color: #ffc107; font-weight: bold;">${categoria}</span><br>
                    <small style="color: #bbb; display: block; max-width: 180px; word-wrap: break-word;">${sabor}</small>
                </td>
                <td><small>${statusTag}</small></td>
            </tr>
        `;
    });

    // Atualiza os cards informativos da tela pública se eles existirem no HTML
    const containerCaldos = document.getElementById('resumo-caldos');
    const containerDoces = document.getElementById('resumo-doces');
    const containerSalgados = document.getElementById('resumo-salgados');
    const containerTotalGeral = document.getElementById('resumo-total-pessoas');

    if (containerCaldos) containerCaldos.innerText = `${totalCaldos}p nos Caldos 🥣`;
    if (containerDoces) containerDoces.innerText = `${totalDoces} Pratos Doces 🍫`;
    if (containerSalgados) containerSalgados.innerText = `${totalSalgados} Pratos Salgados 🥐`;
    if (containerTotalGeral) containerTotalGeral.innerText = `Total Confirmados: ${totalConfirmadosGeral} pessoas 🔥`;
}

// Inicializa a lista assim que a página terminar de carregar o HTML
window.addEventListener('DOMContentLoaded', () => {
    carregarListaPublica();
});