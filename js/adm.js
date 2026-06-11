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
    let totalPessoasConfirmadas = 0;

    tabelaCorpo.innerHTML = '';

    if (inscritos && inscritos.length > 0) {
        inscritos.forEach(item => {
            const conjuge = Number(item.qtd_conjuge) || 0;
            const amigos = Number(item.qtd_amigos) || 0;
            const totalPessoasLinha = 1 + conjuge + amigos;
            
            // Soma total absoluto de pessoas
            totalPessoasGeral += totalPessoasLinha;

            const ehParceiro = item.status_pix && item.status_pix.includes("Box Friendly");
            const statusAtual = item.status_pix || "Pendente";

            // Se estiver validado/pago, entra no contador de confirmados
            if (statusAtual === "Confirmado" || statusAtual === "Pago" || statusAtual === "Parceria Confirmada") {
                totalPessoasConfirmadas += totalPessoasLinha;
            }
            
            // CÁLCULO FINANCEIRO DINÂMICO
            let valorCalculadoInscricao = 0;
            if (ehParceiro) {
                valorCalculadoInscricao = (conjuge * 15) + (amigos * 20); // Titular parceiro é R$ 0
            } else {
                valorCalculadoInscricao = 15 + (conjuge * 15) + (amigos * 20); // Aluno comum
            }

            const valorFinalLinha = (Number(item.total_pix) > 0 || statusAtual === 'Parceria Confirmada') ? Number(item.total_pix) : valorCalculadoInscricao;

            // SEGREGAÇÃO DO DINHEIRO NOS CAIXAS DO TOPO
            if (ehParceiro) {
                faturamentoPatrocinios += valorFinalLinha;
            } else {
                faturamentoPublicoGeral += valorFinalLinha;
            }

            // Estilos visuais limpos dos Status
            let statusTexto = "⏳ Pendente";
            let estiloBadge = "background: rgba(255, 152, 0, 0.1); color: #FF9800; border: 1px solid rgba(255, 152, 0, 0.2);";

            if (statusAtual === "Confirmado" || statusAtual === "Pago" || statusAtual === "Parceria Confirmada") {
                statusTexto = "✅ Confirmado";
                estiloBadge = "background: rgba(76, 175, 80, 0.1); color: #4CAF50; border: 1px solid rgba(76, 175, 80, 0.2);";
            } else if (statusAtual === "Parcial" || statusAtual === "Pagamento Parcial") {
                statusTexto = "⚡ Parcial";
                estiloBadge = "background: rgba(255, 87, 34, 0.1); color: #FF5722; border: 1px solid rgba(255, 87, 34, 0.2);";
            } else if (ehParceiro) {
                statusTexto = "🤝 Parceiro";
                estiloBadge = "background: rgba(33, 150, 243, 0.1); color: #2196F3; border: 1px solid rgba(33, 150, 243, 0.2);";
            }

            // Se for parceiro, o valor ganha um aviso visual clicável para você saber que pode editar a doação ali
            const celulaValorHTML = ehParceiro ? 
                `<td style="padding: 12px; font-weight: bold; color: #00BCD4; cursor: pointer; text-decoration: underline;" id="celula-valor-${item.id}" onclick="abrirEdicaoValorManual('${item.id}', ${valorFinalLinha})" title="Clique para definir o valor da doação">R$ ${valorFinalLinha},00 ✏️</td>` :
                `<td style="padding: 12px; font-weight: bold; color: #fff;" id="celula-valor-${item.id}">R$ ${valorFinalLinha},00</td>`;

            const nomeExibicao = ehParceiro ? `<strong>${item.nome}</strong> <span style="color: #00BCD4; font-size: 11px;">(🤝 Parceiro)</span>` : `<strong>${item.nome}</strong>`;

            // Montagem da tabela alinhada exatamente igual ao seu desenho
            tabelaCorpo.innerHTML += `
                <tr id="linha-${item.id}" style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 12px;" id="celula-nome-${item.id}">
                        ${nomeExibicao}
                        <small style="color:#888; display:block; margin-top:2px;">${item.tipo_grupo} (${totalPessoasLinha} p.)</small>
                    </td>
                    ${celulaValorHTML}
                    <td style="padding: 12px;"><span class="badge-status" style="padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; ${estiloBadge}">${statusTexto}</span></td>
                    <td style="padding: 12px; text-align: center;">
                        <div style="display: flex; gap: 4px; justify-content: center; flex-wrap: wrap;" id="acoes-${item.id}">
                            <button onclick="alterarStatusRapido('${item.id}', '${ehParceiro ? 'Parceria Confirmada' : 'Confirmado'}')" style="background:#4CAF50; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px;">Validar</button>
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

    // ATUALIZA OS INDICADORES FINANCEIROS GERAIS DO TOPO
    if (containerPublico) containerPublico.innerText = `R$ ${faturamentoPublicoGeral},00`;
    if (containerPatrocinios) containerPatrocinios.innerText = `R$ ${faturamentoPatrocinios},00`;
    if (containerGeral) containerGeral.innerText = `R$ ${faturamentoPublicoGeral + faturamentoPatrocinios},00`;
    
    // ATUALIZA OS CONTADORES LADO A LADO
    const elGeral = document.getElementById('total-pessoas-contagem');
    const elConfirmados = document.getElementById('total-pessoas-confirmadas');
    
    if (elGeral) elGeral.innerText = totalPessoasGeral;
    if (elConfirmados) elConfirmados.innerText = totalPessoasConfirmadas;
}

async function alterarStatusRapido(id, novoStatus) {
    const { error } = await _supabase
        .from('cadastro_arraia')
        .update({ status_pix: novoStatus })
        .eq('id', id);

    if (error) {
        alert("Erro ao validar: " + error.message);
    } else {
        carregarDadosPainelAdmin();
    }
}

// ATIVADO AO CLICAR DIRETO NO VALOR DO PARCEIRO
function abrirEdicaoValorManual(id, valorAtual) {
    const celula = document.getElementById(`celula-valor-${id}`);
    if (!celula) return;

    celula.removeAttribute('onclick'); // Desativa o clique temporariamente para não dar loop
    celula.innerHTML = `
        <div style="display: flex; align-items: center; gap: 2px;">
            <input type="number" id="input-valor-${id}" value="${valorAtual}" style="width:55px; background:#333; color:#fff; border:1px solid #555; padding:4px; border-radius:4px; font-size:12px;">
            <button onclick="salvarValorManual('${id}')" style="background:#4CAF50; color:#fff; border:none; padding:4px 6px; border-radius:4px; cursor:pointer; font-size:11px;">OK</button>
        </div>
    `;
}

async function salvarValorManual(id) {
    const valorDigitado = Number(document.getElementById(`input-valor-${id}`).value) || 0;

    const { error } = await _supabase
        .from('cadastro_arraia')
        .update({ total_pix: valorDigitado, status_pix: 'Parceria Confirmada' })
        .eq('id', id);

    if (error) {
        alert("Erro ao salvar: " + error.message);
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
            qtd_amigos: amigosAlt,
            total_pix: 0 
        })
        .eq('id', id);

    if (error) {
        alert("Erro ao salvar: " + error.message);
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