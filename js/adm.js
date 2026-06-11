// js/adm.js

window.addEventListener('DOMContentLoaded', () => {
    carregarDadosPainelAdmin();
});

function carregarPainelADM() {
    carregarDadosPainelAdmin();
}

async function carregarDadosPainelAdmin() {
    const tabelaCorpo = document.getElementById('tabela-adm-corpo');
    const containerGeral = document.getElementById('total-geral-caixa');
    const containerPublico = document.getElementById('total-publico-geral');
    const containerPatrocinios = document.getElementById('total-patrocinios');

    if (!tabelaCorpo) return;

    tabelaCorpo.innerHTML = '<tr><td colspan="4" style="padding:20px; text-align:center; color:#aaa;">Atualizando fluxos financeiros...</td></tr>';

    const { data: inscritos, error } = await _supabase
        .from('cadastro_arraia')
        .select('*')
        .order('nome', { ascending: true });

    if (error) {
        console.error("Erro Supabase ADM:", error);
        tabelaCorpo.innerHTML = '<tr><td colspan="4" style="padding:20px; text-align:center; color:#f44336;">Erro de conexão.</td></tr>';
        return;
    }

    let faturamentoPublicoGeral = 0;
    let faturamentoPatrocinios = 0;
    let totalPessoasGeral = 0;
    let totalPessoasPagas = 0;

    tabelaCorpo.innerHTML = '';

    if (inscritos && inscritos.length > 0) {
        inscritos.forEach(item => {
            const conjuge = Number(item.qtd_conjuge) || 0;
            const amigos = Number(item.qtd_amigos) || 0;
            const totalPessoasLinha = 1 + conjuge + amigos;
            
            // Controle físico absoluto de inscritos
            totalPessoasGeral += totalPessoasLinha;

            const ehParceiro = item.status_pix && (item.status_pix.includes("Box Friendly") || item.status_pix.includes("Parceria") || item.status_pix.includes("Parceiro"));
            const statusAtual = item.status_pix || "Pendente";

            // Se o cadastro estiver validado ou pago, entra na contagem de Pagos ativos
            if (statusAtual === "Confirmado" || statusAtual === "Pago" || statusAtual === "Parceria Confirmada" || statusAtual.includes("Pago")) {
                totalPessoasPagas += totalPessoasLinha;
            }
            
            // 1. CÁLCULO ESTRETO DE INSCRIÇÃO (Sempre vai para o caixa de Alunos/Geral)
            let valorInscricaoCalculada = 0;
            if (ehParceiro) {
                // Titular Parceiro é ISENTO (R$ 0). Só calcula se ele trouxe cônjuge (R$15) ou amigo (R$20)
                valorInscricaoCalculada = (conjuge * 15) + (amigos * 20);
            } else {
                // Aluno comum: R$ 15 do titular + acompanhantes
                valorInscricaoCalculada = 15 + (conjuge * 15) + (amigos * 20);
            }

            // 2. ISOLA A DOAÇÃO PURA DO PARCEIRO
            // O valor lançado no banco (total_pix) para parceiros passa a ser exclusivamente a DOAÇÃO DELE.
            // Se ainda não foi digitado nada, ele é rigorosamente R$ 0,00.
            const valorDoacaoPura = ehParceiro ? (Number(item.total_pix) || 0) : 0;

            // REGRA DO SEU CAIXA: 
            // Toda e qualquer inscrição vai para o Geral (Alunos).
            // Apenas a Doação Pura do parceiro entra no caixa de Patrocínios.
            faturamentoPublicoGeral += valorInscricaoCalculada;
            if (ehParceiro) {
                faturamentoPatrocinios += valorDoacaoPura;
            }

            // O valor total exibido na linha do parceiro é a Inscrição dos acompanhantes dele + a Doação Pura dele
            const valorExibicaoLinha = ehParceiro ? (valorInscricaoCalculada + valorDoacaoPura) : valorInscricaoCalculada;

            // GERENCIAMENTO DE STATUS UNIFICADO
            let statusTexto = "⏳ Pendente";
            let estiloBadge = "background: rgba(255, 152, 0, 0.1); color: #FF9800; border: 1px solid rgba(255, 152, 0, 0.2);";

            if (statusAtual === "Confirmado" || statusAtual === "Pago" || statusAtual === "Parceria Confirmada" || statusAtual === "Pago (Parceiro)") {
                statusTexto = "✅ Pago";
                estiloBadge = "background: rgba(76, 175, 80, 0.1); color: #4CAF50; border: 1px solid rgba(76, 175, 80, 0.2);";
            } else if (statusAtual === "Parcial" || statusAtual === "Pagamento Parcial") {
                statusTexto = "⚡ Parcial";
                estiloBadge = "background: rgba(255, 87, 34, 0.1); color: #FF5722; border: 1px solid rgba(255, 87, 34, 0.2);";
            } else if (ehParceiro && valorDoacaoPura === 0) {
                statusTexto = "⏳ Pendente";
                estiloBadge = "background: rgba(255, 152, 0, 0.1); color: #FF9800; border: 1px solid rgba(255, 152, 0, 0.2);";
            }

            // COLUNA VALOR: Passando estritamente 'valorDoacaoPura' para a função de clique para abrir limpo!
            const celulaValorHTML = ehParceiro ? 
                `<td style="padding: 12px; font-weight: bold; color: #00BCD4; cursor: pointer; white-space: nowrap;" id="celula-valor-${item.id}" onclick="abrirEdicaoDoacaoParceiro('${item.id}', ${valorDoacaoPura})" title="Clique no 🤝 para somar valor de patrocínio">R$ ${valorExibicaoLinha},00 🤝</td>` :
                `<td style="padding: 12px; font-weight: bold; color: #fff; white-space: nowrap;" id="celula-valor-${item.id}">R$ ${valorExibicaoLinha},00</td>`;

            const nomeExibicao = ehParceiro ? `<strong>${item.nome}</strong> <span style="color: #00BCD4; font-size: 11px;">(Parceiro)</span>` : `<strong>${item.nome}</strong>`;

            tabelaCorpo.innerHTML += `
                <tr id="linha-${item.id}" style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 12px;" id="celula-nome-${item.id}">
                        ${nomeExibicao}
                        <small style="color:#888; display:block; margin-top:2px;">${item.tipo_grupo} (${totalPessoasLinha} p.)</small>
                    </td>
                    ${celulaValorHTML}
                    <td style="padding: 12px; width: 70px; min-width: 70px; white-space: nowrap;">
                        <span class="badge-status" style="padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; display: inline-block; ${estiloBadge}">
                            ${statusTexto}
                        </span>
                    </td>
                    <td style="padding: 12px; text-align: center;">
                        <div style="display: flex; gap: 4px; justify-content: center; flex-wrap: wrap;" id="acoes-${item.id}">
                            <button onclick="alterarStatusRapido('${item.id}', '${ehParceiro ? 'Pago (Parceiro)' : 'Pago'}')" style="background:#4CAF50; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px;">Validar</button>
                            <button onclick="abrirEdicaoCadastroCompleta('${item.id}', '${item.nome}', '${item.tipo_grupo}', ${conjuge}, ${amigos})" style="background:#673AB7; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px;">Editar</button>
                            <button onclick="deletarInscricao('${item.id}')" style="background:#f44336; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px;">Excluir</button>
                        </div>
                    </td>
                </tr>
            `;
        });
    } else {
        tabelaCorpo.innerHTML = '<tr><td colspan="4" style="padding:30px; text-align:center; color:#aaa;">Nenhum registro.</td></tr>';
    }

    // ATUALIZA OS CONTADORES DO CARD CINZA NO TOPO
    if (containerPublico) containerPublico.innerText = `R$ ${faturamentoPublicoGeral},00`;
    if (containerPatrocinios) containerPatrocinios.innerText = `R$ ${faturamentoPatrocinios},00`;
    if (containerGeral) containerGeral.innerText = `R$ ${faturamentoPublicoGeral + faturamentoPatrocinios},00`;
    
    // ATUALIZA OS DOIS CONTADORES DE PÚBLICO LADO A LADO
    const elGeral = document.getElementById('total-pessoas-contagem');
    const elPagas = document.getElementById('total-pessoas-confirmadas');
    
    if (elGeral) elGeral.innerText = totalPessoasGeral;
    if (elPagas) elPagas.innerText = totalPessoasPagas;
}

async function alterarStatusRapido(id, novoStatus) {
    const { error } = await _supabase
        .from('cadastro_arraia')
        .update({ status_pix: novoStatus })
        .eq('id', id);

    if (error) {
        alert("Erro ao salvar: " + error.message);
    } else {
        carregarDadosPainelAdmin();
    }
}

// TRAVA ATIVADA: Agora passa unicamente a doação isolada. Se for 0, o input abre limpo e zerado!
function abrirEdicaoDoacaoParceiro(id, doacaoAtual) {
    const celula = document.getElementById(`celula-valor-${id}`);
    if (!celula) return;

    celula.removeAttribute('onclick'); 
    celula.innerHTML = `
        <div style="display: flex; align-items: center; gap: 2px;">
            <input type="number" id="input-doacao-${id}" value="${doacaoAtual === 0 ? '' : doacaoAtual}" placeholder="R$ 0" style="width:55px; background:#333; color:#fff; border:1px solid #555; padding:4px; border-radius:4px; font-size:12px;">
            <button onclick="salvarDoacaoParceiro('${id}')" style="background:#4CAF50; color:#fff; border:none; padding:4px 6px; border-radius:4px; cursor:pointer; font-size:11px; font-weight:bold;">OK</button>
        </div>
    `;
    
    // Coloca o foco direto no campo para facilitar no celular
    setTimeout(() => {
        const input = document.getElementById(`input-doacao-${id}`);
        if (input) input.focus();
    }, 50);
}

async function salvarDoacaoParceiro(id) {
    const valorDoado = Number(document.getElementById(`input-doacao-${id}`).value) || 0;

    // Grava a doação isolada e define o status como Pago
    const { error } = await _supabase
        .from('cadastro_arraia')
        .update({ total_pix: valorDoado, status_pix: 'Pago (Parceiro)' })
        .eq('id', id);

    if (error) {
        alert("Erro ao lançar patrocínio: " + error.message);
    } else {
        carregarDadosPainelAdmin();
    }
}

function abrirEdicaoCadastroCompleta(id, nome, tipoGrupo, conjuge, amigos) {
    document.getElementById(`celula-nome-${id}`).innerHTML = `
        <input type="text" id="edit-nome-${id}" value="${nome}" style="width:100%; background:#333; color:#fff; border:1px solid #555; padding:4px; border-radius:4px; font-size:12px; margin-bottom:4px;">
        <select id="edit-grupo-${id}" style="background:#333; color:#fff; border:1px solid #555; padding:4px; border-radius:4px; font-size:12px; margin-bottom:3px; width:100%;">
            <option value="Solteiro" ${tipoGrupo === 'Solteiro' ? 'selected' : ''}>Solteiro</option>
            <option value="Casal/Família" ${tipoGrupo !== 'Solteiro' ? 'selected' : ''}>Família</option>
        </select>
        <div style="font-size:11px; color:#aaa;">
            Cônj: <input type="number" id="edit-conjuge-${id}" value="${conjuge}" style="width:30px; background:#333; color:#fff; border:1px solid #555; padding:2px;">
            Amig: <input type="number" id="edit-amigos-${id}" value="${amigos}" style="width:30px; background:#333; color:#fff; border:1px solid #555; padding:2px;">
        </div>
    `;

    document.getElementById(`acoes-${id}`).innerHTML = `
        <button onclick="salvarEdicaoCadastroCompleta('${id}')" style="background:#4CAF50; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold;">Salvar</button>
        <button onclick="carregarDadosPainelAdmin()" style="background:#666; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:12px;">Sair</button>
    `;
}

async function salvarEdicaoCadastroCompleta(id) {
    const nomeAlt = document.getElementById('edit-nome-' + id).value.trim();
    const grupoAlt = document.getElementById('edit-grupo-' + id).value;
    const conjugeAlt = Number(document.getElementById('edit-conjuge-' + id).value) || 0;
    const amigosAlt = Number(document.getElementById('edit-amigos-' + id).value) || 0;

    if (!nomeAlt) {
        alert("O nome é obrigatório.");
        return;
    }

    const { error } = await _supabase
        .from('cadastro_arraia')
        .update({
            nome: nomeAlt,
            tipo_grupo: grupoAlt,
            qtd_conjuge: conjugeAlt,
            qtd_amigos: amigosAlt
        })
        .eq('id', id);

    if (error) {
        alert("Erro ao salvar alterações: " + error.message);
    } else {
        carregarDadosPainelAdmin();
    }
}

async function deletarInscricao(id) {
    if (!confirm("Deseja excluir este cadastro?")) return;

    const { error } = await _supabase
        .from('cadastro_arraia')
        .delete()
        .eq('id', id);

    if (error) {
        alert("Erro ao excluir: " + error.message);
    } else {
        carregarDadosPainelAdmin();
    }
}