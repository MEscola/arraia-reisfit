// js/adm.js

// Validador de barreira de entrada simples para proteger os dados de caixa no GitHub Pages
function verificarAcessoAdm(botao) {
    const senha = prompt("Digite a senha do Financeiro ADM:");
    if (senha === "ReisFit2026") {
        navegarPara('tela-adm', botao);
        carregarPainelADM();
    } else if (senha !== null) {
        alert("Senha incorreta, acesso restrito!");
    }
}

// Carrega o balancete completo com privilégios de alteração de estados
async function carregarPainelADM() {
    const corpo = document.getElementById('tabela-adm-corpo');
    corpo.innerHTML = "<tr><td colspan='4'>Carregando fluxo de caixa...</td></tr>";

    const { data, error } = await _supabase
        .from('inscricoes_arraia')
        .select('id, nome, total_pix, status_pix, qtd_conjuges, qtd_amigos')
        .order('created_at', { ascending: false });

    if (error) {
        corpo.innerHTML = "<tr><td colspan='4'>Erro crítico ao ler banco financeiro.</td></tr>";
        return;
    }

    let faturamentoTotal = 0;
    corpo.innerHTML = '';
    
    // Processa os dados injetando linhas na tabela e acumulando o faturamento
    data.forEach(aluno => {
        faturamentoTotal += Number(aluno.total_pix) || 0;
        const totalGrupo = 1 + (aluno.qtd_conjuges || 0) + (aluno.qtd_amigos || 0);
        
        let acao = aluno.status_pix === 'Pendente' 
            ? `<button class="btn btn-primary" style="padding:6px 12px; font-size:12px; width:auto;" onclick="confirmarBaixaPix(${aluno.id})">Baixa PIX</button>` 
            : `<span class="badge-pago">✅ Pago</span>`;

        corpo.innerHTML += `
            <tr>
                <td><strong>${aluno.nome}</strong><br><small style="color:#aaa;">Grupo: ${totalGrupo}p</small></td>
                <td>R$ ${aluno.total_pix},00</td>
                <td><small>${aluno.status_pix}</small></td>
                <td>${acao}</td>
            </tr>
        `;
    });

    // Atualiza o somatório do caixa visível para os organizadores
    document.getElementById('total-caixa').innerText = `Total Previsto em Caixa: R$ ${faturamentoTotal},00`;
}

// Executa o comando UPDATE diretamente na linha selecionada via chave primária (ID)
async function confirmarBaixaPix(idInscricao) {
    const { error } = await _supabase
        .from('inscricoes_arraia')
        .update({ status_pix: 'Pago' })
        .eq('id', idInscricao);

    if (error) {
        alert("Falha ao atualizar registro de recebimento: " + error.message);
    } else {
        // Recarga automática para atualização reativa do faturamento na tela
        carregarPainelADM();
    }
}