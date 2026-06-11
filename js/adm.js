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

    let caixaRealArrecadado = 0; // Dinheiro REAL que já foi pago
    let faturamentoTotalPrevisto = 0; // Dinheiro PROMETIDO se todos pagarem
    let totalPagantesGeral = 0;
    corpo.innerHTML = '';
    
    // Processa os dados injetando linhas na tabela e acumulando os totais
    data.forEach(aluno => {
        const valorPixNumerico = Number(aluno.total_pix) || 0;
        const status = aluno.status_pix || 'Pendente';

        // 1. CONTABILIDADE SEPARADA:
        faturamentoTotalPrevisto += valorPixNumerico; // Acumula no Previsto geral

        if (status === 'Pago') {
            caixaRealArrecadado += valorPixNumerico; // Acumula APENAS o dinheiro real na conta
        }

        // 2. Lógica de Negócio para contagem de PAGANTES reais (Cabeças maiores de 13 anos):
        let pagantesDestaInscricao = 0;

        // Se o status for Pago ou Pendente (indica que é um fluxo de pagamento normal)
        if (valorPixNumerico > 0) {
            const custoAcompanhantes = ((Number(aluno.qtd_conjuge) || 0) * 15) + ((Number(aluno.qtd_amigos) || 0) * 20);
            
            if (valorPixNumerico > custoAcompanhantes) {
                pagantesDestaInscricao += 1; 
            }
            
            pagantesDestaInscricao += (Number(aluno.qtd_conjuge) || 0);
            pagantesDestaInscricao += (Number(aluno.qtd_amigos) || 0);
        } else if (status.includes("Isenção Titular")) {
            // Se for patrocinador nível 50, o titular não paga, mas os acompanhantes sim!
            pagantesDestaInscricao += (Number(aluno.qtd_conjuge) || 0);
            pagantesDestaInscricao += (Number(aluno.qtd_amigos) || 0);
        }

        // Acumula no contador geral do Box
        totalPagantesGeral += pagantesDestaInscricao;

        // 3. customização de estilo visual por Linha para evitar alarmes falsos e rádio corredor
        const totalPessoasGrupo = 1 + (Number(aluno.qtd_conjuge) || 0) + (Number(aluno.qtd_amigos) || 0);
        
        let estiloLinha = "";
        let acao = "";
        let statusBadge = "";

        if (status === 'Pago') {
            estiloLinha = 'style="background-color: rgba(76, 175, 80, 0.08);"'; // Fundo Verde sutil
            statusBadge = `<span class="badge-pago" style="background:#4CAF50; color:white; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:bold;">✅ Pago</span>`;
            acao = `<span style="color:#4CAF50; font-size:12px; font-weight:bold;">Concluído</span>`;
        } else if (status.includes("Box Friendly")) {
            estiloLinha = 'style="background-color: rgba(33, 150, 243, 0.08);"'; // Fundo Azul sutil para parceiros legítimos
            statusBadge = `<span class="badge-parceiro" style="background:#2196F3; color:white; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:bold;">🤝 Parceiro</span>`;
            acao = `<button class="btn btn-secondary" style="padding:6px 12px; font-size:11px; width:auto; background:#2196F3;" onclick="confirmarBaixaPix(${aluno.id})">Validar Parceiro</button>`;
        } else {
            // Se estiver Pendente: coloca o aviso (⚠️) e deixa a linha levemente avermelhada/amarelada
            estiloLinha = 'style="background-color: rgba(255, 152, 0, 0.05);"'; 
            statusBadge = `<span class="badge-pendente" style="background:#FF9800; color:white; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:bold;">⚠️ Pendente</span>`;
            acao = `<button class="btn btn-primary" style="padding:6px 12px; font-size:11px; width:auto;" onclick="confirmarBaixaPix(${aluno.id})">Baixa PIX</button>`;
        }

        corpo.innerHTML += `
            <tr ${estiloLinha}>
                <td>
                    <strong>${aluno.nome}</strong><br>
                    <small style="color:#aaa;">Grupo: ${totalPessoasGrupo}p | Pagantes: ${pagantesDestaInscricao}p</small><br>
                    <small style="color:#ffc107;">${aluno.categoria_prato}</small>
                </td>
                <td>R$ ${valorPixNumerico},00</td>
                <td><small style="font-size:11px; display:block; line-height:1.2;">${statusBadge}<br><span style="color:#888;">${status}</span></small></td>
                <td>${acao}</td>
            </tr>
        `;
    });

    // 4. Atualiza os painéis informativos superiores do ADM dividindo o caixa
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
        // Recarga automática para atualização reativa do faturamento na tela
        carregarPainelADM();
    }
}