// js/adm.js

// Carrega o balancete completo com somatório de caixa e público pagante real
async function carregarPainelADM() {
    const corpo = document.getElementById('tabela-adm-corpo');
    if (!corpo) return;
    
    corpo.innerHTML = "<tr><td colspan='4'>Carregando fluxo de caixa...</td></tr>";

    // CORREÇÃO CRÍTICA: Alterado de 'inscricoes_arraia' para 'cadastro_arraia'
    // Adicionado o campo 'categoria_prato' para análise visual do ADM se necessário
    const { data, error } = await _supabase
        .from('cadastro_arraia')
        .select('id, nome, total_pix, status_pix, qtd_conjuge, qtd_amigos, categoria_prato')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erro Supabase ADM:", error);
        corpo.innerHTML = "<tr><td colspan='4'>Erro crítico ao ler banco financeiro.</td></tr>";
        return;
    }

    let faturamentoTotal = 0;
    let totalPagantesGeral = 0;
    corpo.innerHTML = '';
    
    // Processa os dados injetando linhas na tabela e acumulando os totais
    data.forEach(aluno => {
        // 1. Acumula o valor financeiro previsto em caixa
        faturamentoTotal += Number(aluno.total_pix) || 0;

        // 2. Lógica de Negócio para contagem de PAGANTES reais (Cabeças maiores de 13 anos):
        let pagantesDestaInscricao = 0;

        if (Number(aluno.total_pix) > 0) {
            // Descobre o custo total gerado puramente pelos acompanhantes cadastrados nesta linha
            const custoAcompanhantes = ((Number(aluno.qtd_conjuge) || 0) * 15) + ((Number(aluno.qtd_amigos) || 0) * 20);
            
            // Se o total_pix pago for maior que o custo dos acompanhantes, significa que o titular NÃO é patrocinador isento. Logo, ele conta como 1 pagante!
            if (Number(aluno.total_pix) > custoAcompanhantes) {
                pagantesDestaInscricao += 1; 
            }
            
            // Soma os cônjuges e amigos maiores de 13 anos (as crianças não alteram o total_pix, então não entram aqui)
            pagantesDestaInscricao += (Number(aluno.qtd_conjuge) || 0);
            pagantesDestaInscricao += (Number(aluno.qtd_amigos) || 0);
        }

        // Acumula no contador geral do Box
        totalPagantesGeral += pagantesDestaInscricao;

        // 3. Renderização reativa da linha administrativa com os contadores de apoio
        const totalPessoasGrupo = 1 + (Number(aluno.qtd_conjuge) || 0) + (Number(aluno.qtd_amigos) || 0);
        
        let acao = aluno.status_pix === 'Pendente' 
            ? `<button class="btn btn-primary" style="padding:6px 12px; font-size:12px; width:auto;" onclick="confirmarBaixaPix(${aluno.id})">Baixa PIX</button>` 
            : `<span class="badge-pago">✅ Pago</span>`;

        corpo.innerHTML += `
            <tr>
                <td>
                    <strong>${aluno.nome}</strong><br>
                    <small style="color:#aaa;">Grupo: ${totalPessoasGrupo}p | Pagantes: ${pagantesDestaInscricao}p</small>
                </td>
                <td>R$ ${aluno.total_pix},00</td>
                <td><small>${aluno.status_pix}</small></td>
                <td>${acao}</td>
            </tr>
        `;
    });

    // 4. Atualiza os painéis informativos superiores do ADM (Evita quebra se os IDs mudarem)
    const containerCaixa = document.getElementById('total-caixa');
    const containerPagantes = document.getElementById('total-pagantes');

    if (containerCaixa) {
        containerCaixa.innerText = `Total Previsto em Caixa: R$ ${faturamentoTotal},00`;
    }
    if (containerPagantes) {
        containerPagantes.innerText = `Total de Pagantes: ${totalPagantesGeral} pessoas`;
    }
}

// Executa o comando UPDATE diretamente na linha selecionada via chave primária (ID)
async function confirmarBaixaPix(idInscricao) {
    // CORREÇÃO CRÍTICA: Alterado de 'inscricoes_arraia' para 'cadastro_arraia'
    const { error } = await _supabase
        .from('cadastro_arraia')
        .update({ status_pix: 'Pago' })
        .eq('id', idInscricao);

    if (error) {
        alert("Falha ao atualizar registro de recebimento: " + error.message);
    } else {
        // Recarga automática para atualização reativa do faturamento na tela
        carregarPainelADM();
    }
}