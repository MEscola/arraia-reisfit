// js/adm.js

// Carrega o balancete completo com somatório de caixa e público pagante real e visual limpo
async function carregarPainelADM() {
    const corpo = document.getElementById('tabela-adm-corpo');
    if (!corpo) return;
    
    corpo.innerHTML = "<tr><td colspan='4' style='padding: 20px; text-align: center; color: #aaa;'>Carregando fluxo de caixa...</td></tr>";

    const { data, error } = await _supabase
        .from('cadastro_arraia')
        .select('id, nome, total_pix, status_pix, qtd_conjuge, qtd_amigos, categoria_prato')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erro Supabase ADM:", error);
        corpo.innerHTML = "<tr><td colspan='4' style='padding: 20px; text-align: center; color: #f44336;'>Erro crítico ao ler banco financeiro.</td></tr>";
        return;
    }

    let caixaRealArrecadado = 0; 
    let faturamentoTotalPrevisto = 0; 
    let totalPagantesGeral = 0;
    corpo.innerHTML = '';
    
    data.forEach(aluno => {
        const valorPixNumerico = Number(aluno.total_pix) || 0;
        const status = aluno.status_pix || 'Pendente';

        // 1. Contabilidade Separada
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

        // 3. Estilização Avançada e Desembolada por Linha
        const totalPessoasGrupo = 1 + (Number(aluno.qtd_conjuge) || 0) + (Number(aluno.qtd_amigos) || 0);
        
        let estiloLinha = 'style="border-bottom: 1px solid rgba(255,255,255,0.08);"';
        let acao = "";
        let statusBadge = "";

        // Cores de fundo sutis para identificação rápida do Financeiro
        if (status === 'Pago') {
            estiloLinha = 'style="background-color: rgba(76, 175, 80, 0.04); border-bottom: 1px solid rgba(255,255,255,0.08);"'; 
            statusBadge = `<span style="background:#4CAF50; color:white; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:bold; display:inline-block; margin-bottom:4px;">✅ Pago</span>`;
            acao = `<span style="color:#4CAF50; font-size:12px; font-weight:bold; display:block; margin: 8px 0;">Concluído</span>`;
        } else if (status && status.includes("Box Friendly")) {
            estiloLinha = 'style="background-color: rgba(33, 150, 243, 0.04); border-bottom: 1px solid rgba(255,255,255,0.08);"'; 
            statusBadge = `<span style="background:#2196F3; color:white; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:bold; display:inline-block; margin-bottom:4px;">🤝 Parceiro</span>`;
            acao = `<button class="btn btn-secondary" style="padding:6px 10px; font-size:11px; width:100%; background:#2196F3; border:none; color:white; border-radius:4px; margin-bottom:6px; cursor:pointer;" onclick="confirmarBaixaPix(${aluno.id})">Validar</button>`;
        } else {
            estiloLinha = 'style="background-color: rgba(255, 152, 0, 0.02); border-bottom: 1px solid rgba(255,255,255,0.08);"'; 
            statusBadge = `<span style="background:#FF9800; color:white; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:bold; display:inline-block; margin-bottom:4px;">⚠️ Pendente</span>`;
            acao = `<button class="btn btn-primary" style="padding:6px 10px; font-size:11px; width:100%; background:#FF9800; border:none; color:white; border-radius:4px; margin-bottom:6px; font-weight:bold; cursor:pointer;" onclick="confirmarBaixaPix(${aluno.id})">Baixa PIX</button>`;
        }

        // Botão de remover menor e mais elegante
        acao += `<button style="padding:4px 8px; font-size:10px; width:100%; background:transparent; color:#f44336; border:1px solid #f44336; border-radius:4px; display:block; cursor:pointer; opacity:0.7;" onclick="deletarInscricaoADM(${aluno.id}, '${aluno.nome}')">🗑️ Remover</button>`;

        // Renderização com espaçamentos calculados (paddings) para não embolar
        corpo.innerHTML += `
            <tr ${estiloLinha}>
                <td style="padding: 12px 8px; text-align: left; vertical-align: top; line-height: 1.4;">
                    <strong style="font-size: 14px; color:#fff; display:block; margin-bottom:3px;">${aluno.nome}</strong>
                    <div style="margin-bottom: 4px;">
                        <span style="background: rgba(255,255,255,0.1); color: #ccc; padding: 1px 5px; border-radius:3px; font-size:10px; margin-right:4px;">Grupo: ${totalPessoasGrupo}p</span>
                        <span style="background: rgba(255,193,7,0.15); color: #ffb300; padding: 1px 5px; border-radius:3px; font-size:10px;">Pagantes: ${pagantesDestaInscricao}p</span>
                    </div>
                    <small style="color: #673AB7; background: rgba(103, 58, 183, 0.15); padding: 1px 5px; border-radius:3px; font-size: 11px; display: inline-block; font-weight:bold; margin-top:2px;">${aluno.categoria_prato}</small>
                </td>
                <td style="padding: 12px 8px; text-align: center; vertical-align: middle; font-weight: bold; color: #fff; font-size: 13px;">
                    R$ ${valorPixNumerico},00
                </td>
                <td style="padding: 12px 8px; text-align: center; vertical-align: middle;">
                    ${statusBadge}
                    <small style="color: #777; display: block; font-size: 9px; margin-top:2px; max-width:70px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${status}</small>
                </td>
                <td style="padding: 12px 8px; text-align: center; vertical-align: middle; min-width: 85px;">
                    <div style="display: flex; flex-direction: column; align-items: center;">
                        ${acao}
                    </div>
                </td>
            </tr>
        `;
    });

    // 4. Painéis Superiores com espaçamento e destaque de cores
    const containerCaixa = document.getElementById('total-caixa');
    const containerPagantes = document.getElementById('total-pagantes');

    if (containerCaixa) {
        containerCaixa.innerHTML = `
            <div style="line-height: 1.6; padding: 5px;">
                <div style="color: #4CAF50; font-weight: bold; font-size: 16px; display: flex; align-items: center; margin-bottom: 4px;">
                    <span style="margin-right:6px;">💰</span> Caixa Real Arrecadado: R$ ${caixaRealArrecadado},00
                </div>
                <div style="color: #aaa; font-size: 12px; display: flex; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top:4px;">
                    <span style="margin-right:6px;">📋</span> Faturamento Previsto: R$ ${faturamentoTotalPrevisto},00
                </div>
            </div>
        `;
    }
    if (containerPagantes) {
        containerPagantes.innerHTML = `
            <div style="font-size: 15px; font-weight: bold; color: #FFC107; padding: 5px; line-height: 1.6;">
                🏃‍♂️ Total de Pagantes: <span style="font-size: 18px;">${totalPagantesGeral}</span> pessoas
            </div>
        `;
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

// Remove completamente o aluno do banco caso ele desista de ir
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