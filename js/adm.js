// js/adm.js

// Carrega o balancete completo com somatório de caixa e público pagante real
async function carregarPainelADM() {
    const corpo = document.getElementById('tabela-adm-corpo');
    if (!corpo) return;
    
    corpo.innerHTML = "<tr><td colspan='4'>Carregando fluxo de caixa...</td></tr>";

    const { data, error } = await _supabase
        .from('cadastro_arraia')
        .select('id, nome, total_pix, status_pix, qtd_conjuge, qtd_amigos, categoria_prato')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erro Supabase ADM:", error);
        corpo.innerHTML = "<tr><td colspan='4'>Erro crítico ao ler banco financeiro.</td></tr>";
        return;
    }

    let caixaRealArrecadado = 0; 
    let faturamentoTotalPrevisto = 0; 
    let totalPagantesGeral = 0;
    corpo.innerHTML = '';
    
    data.forEach(aluno => {
        const valorPixNumerico = Number(aluno.total_pix) || 0;
        const status = aluno.status_pix || 'Pendente';

        // 1. CONTABILIDADE SEPARADA:
        faturamentoTotalPrevisto += valorPixNumerico; 

        if (status === 'Pago') {
            caixaRealArrecadado += valorPixNumerico; 
        }

        // 2. Lógica de Negócio para contagem de PAGANTES reais
        let pagantesDestaInscricao = 0;

        if (valorPixNumerico > 0) {
            const custoAcompanhantes = ((Number(aluno.qtd_conjuge) || 0) * 15) + ((Number(aluno.qtd_amigos) || 0) * 20);
            
            if (valorPixNumerico > custoAcompanhantes) {
                pagantesDestaInscricao += 1; 
            }
            
            pagantesDestaInscricao += (Number(aluno.qtd_conjuge) || 0);
            pagantesDestaInscricao += (Number(aluno.qtd_amigos) || 0);
        } else if (status && status.includes("Isenção Titular")) {
            pagantesDestaInscricao += (Number(aluno.qtd_conjuge) || 0);
            pagantesDestaInscricao += (Number(aluno.qtd_amigos) || 0);
        }

        totalPagantesGeral += pagantesDestaInscricao;

        // 3. Customização de estilo visual por Linha
        const totalPessoasGrupo = 1 + (Number(aluno.qtd_conjuge) || 0) + (Number(aluno.qtd_amigos) || 0);
        
        let estiloLinha = "";
        let acao = "";
        let statusBadge = "";

        if (status === 'Pago') {
            estiloLinha = 'style="background-color: rgba(76, 175, 80, 0.08);"'; 
            statusBadge = `<span class="badge-pago" style="background:#4CAF50; color:white; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:bold;">✅ Pago</span>`;
            acao = `<span style="color:#4CAF50; font-size:12px; font-weight:bold; display:block; margin-bottom:5px;">Concluído</span>`;
        } else if (status && status.includes("Box Friendly")) {
            estiloLinha = 'style="background-color: rgba(33, 150, 243, 0.08);"'; 
            statusBadge = `<span class="badge-parceiro" style="background:#2196F3; color:white; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:bold;">🤝 Parceiro</span>`;
            acao = `<button class="btn btn-secondary" style="padding:6px 12px; font-size:11px; width:auto; background:#2196F3; margin-bottom:5px;" onclick="confirmarBaixaPix(${aluno.id})">Validar</button>`;
        } else {
            estiloLinha = 'style="background-color: rgba(255, 152, 0, 0.05);"'; 
            statusBadge = `<span class="badge-pendente" style="background:#FF9800; color:white; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:bold;">⚠️ Pendente</span>`;
            acao = `<button class="btn btn-primary" style="padding:6px 12px; font-size:11px; width:auto; margin-bottom:5px;" onclick="confirmarBaixaPix(${aluno.id})">Baixa PIX</button>`;
        }

        // CORREÇÃO AQUI: Ajustado para "deletarInscricaoADM" combinando perfeitamente com a função lá de baixo
        acao += `<button class="btn" style="padding:4px 8px; font-size:11px; width:auto; background:#f44336; color:white; border-radius:4px; display:block; margin:0 auto;" onclick="deletarInscricaoADM(${aluno.id}, '${aluno.nome}')">🗑️ Remover</button>`;

        corpo.innerHTML += `
            <tr ${estiloLinha}>
                <td>
                    <strong>${aluno.nome}</strong><br>
                    <small style="color:#aaa;">Grupo: ${totalPessoasGrupo}p | Pagantes: ${pagantesDestaInscricao}p</small><br>
                    <small style="color:#ffc107;">${aluno.categoria_prato}</small>
                </td>
                <td>R$ ${valorPixNumerico},00</td>
                <td><small style="font-size:11px; display:block; line-height:1.2;">${statusBadge}<br><span style="color:#888;">${status}</span></small></td>
                <td><div style="text-align:center;">${acao}</div></td>
            </tr>
        `;
    });

    // 4. Atualiza os painéis informativos superiores
    const containerCaixa = document.getElementById('total-caixa');
    const containerPagantes = document.getElementById('total-pagantes');

    if (containerCaixa) {
        containerCaixa.innerHTML = `
            <div style="line-height: 1.6;">
                <span style="color: #4CAF50; font-weight: bold; font-size: 16px;">💰 Caixa Real Arrecadado: R$ ${caixaRealArrecadado},00</span><br>
                <span style="color: #bbb; font-size: 13px;">📋 Faturamento Total Previsto: R$ ${faturamentoTotalPrevisto},00</span>
            </div>
        `;
    }
    if (containerPagantes) {
        containerPagantes.innerText = `Total de Pagantes: ${totalPagantesGeral} pessoas`;
    }
}

// Executa o comando UPDATE diretamente na linha selecionada via chave primária (ID)
async function confirmarBaixaPix(idInscricao) {
    const { error } = await _supabase
        .from('cadastro_arraia')
        .update({ status_pix: 'Pago' })
        .eq('id', idInscricao);

    if (error) {
        alert("Falha ao atualizar registro de recebimento: " + error.message);
    } else {
        carregarPainelADM();
    }
}

// FUNÇÃO AJUSTADA: Nome unificado como deletarInscricaoADM para evitar erros de referência
async function deletarInscricaoADM(idInscricao, nomeAluno) {
    const confirmar = confirm(`⚠️ ATENÇÃO, FINANCEIRO!\n\nTem certeza absoluta que deseja REMOVER o cadastro de "${nomeAluno}"?\n\nEsta ação liberará imediatamente as vagas dos caldos e pratos, e atualizará a lista pública.`);
    
    if (!confirmar) return;

    const { error } = await _supabase
        .from('cadastro_arraia')
        .delete()
        .eq('id', idInscricao);

    if (error) {
        alert("Erro ao tentar excluir registro: " + error.message);
    } else {
        alert(`O cadastro de "${nomeAluno}" foi removido com sucesso.`);
        carregarPainelADM(); 
    }
}