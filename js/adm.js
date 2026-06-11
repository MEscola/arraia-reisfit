// js/adm.js

window.addEventListener('DOMContentLoaded', () => {
    carregarDadosPainelAdmin();
});

async function carregarDadosPainelAdmin() {
    const tabelaCorpo = document.getElementById('tabela-adm-corpo');
    const containerGeral = document.getElementById('total-geral-caixa');
    const containerPublico = document.getElementById('total-publico-geral');
    const containerPatrocinios = document.getElementById('total-patrocinios');

    if (!tabelaCorpo) return;

    tabelaCorpo.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; color:#aaa;">Atualizando informações...</td></tr>';

    const { data: inscritos, error } = await _supabase
        .from('cadastro_arraia')
        .select('*')
        .order('nome', { ascending: true });

    if (error) {
        console.error("Erro Supabase ADM:", error);
        tabelaCorpo.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; color:#f44336;">Erro ao acessar banco de dados.</td></tr>';
        return;
    }

    let faturamentoPublicoGeral = 0;
    let faturamentoPatrocinios = 0;

    tabelaCorpo.innerHTML = '';

    if (inscritos && inscritos.length > 0) {
        inscritos.forEach(item => {
            const conjuge = Number(item.qtd_conjuge) || 0;
            const amigos = Number(item.qtd_amigos) || 0;
            const totalPessoas = 1 + conjuge + amigos;

            const valorPagoReal = Number(item.total_pix) || 0;
            
            // Identifica se veio do cadastro com a marcação de parceria (Box Friendly)
            const ehPatrocinador = item.status_pix && item.status_pix.includes("Box Friendly");

            // Separação limpa e direta dos caixas no topo da tela
            if (ehPatrocinador) {
                faturamentoPatrocinios += valorPagoReal;
            } else {
                faturamentoPublicoGeral += valorPagoReal;
            }

            // Definição visual dos Status e Badges para o Administrador
            let statusTexto = item.status_pix || "Pendente";
            let estiloBadge = "background: rgba(255, 152, 0, 0.1); color: #FF9800; border: 1px solid rgba(255, 152, 0, 0.2);";

            if (statusTexto === "Confirmado" || statusTexto === "Pago" || statusTexto === "Parceria Confirmada") {
                statusTexto = "Confirmado";
                estiloBadge = "background: rgba(76, 175, 80, 0.1); color: #4CAF50; border: 1px solid rgba(76, 175, 80, 0.2);";
            } else if (statusTexto === "Parcial" || statusTexto === "Pagamento Parcial") {
                statusTexto = "Pagamento Parcial";
                estiloBadge = "background: rgba(255, 87, 34, 0.1); color: #FF5722; border: 1px solid rgba(255, 87, 34, 0.2);";
            } else if (ehPatrocinador) {
                statusTexto = "Parceiro";
                estiloBadge = "background: rgba(33, 150, 243, 0.1); color: #2196F3; border: 1px solid rgba(33, 150, 243, 0.2);";
            }

            const indicadorNome = ehPatrocinador ? `<span style="color: #2196F3; font-size: 11px; display: block; font-weight: normal;">[Box Friendly]</span>` : '';

            tabelaCorpo.innerHTML += `
                <tr id="linha-${item.id}" style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 12px;" id="celula-nome-${item.id}"><strong>${item.nome}</strong> ${indicadorNome}</td>
                    <td style="padding: 12px;" id="celula-grupo-${item.id}">${item.tipo_grupo} (${totalPessoas} p.)</td>
                    <td style="padding: 12px;" id="celula-prato-${item.id}"><small style="color:#bbb;">${item.categoria_prato}<br><span style="color:#888;">${item.sabor_prato}</span></small></td>
                    <td style="padding: 12px; font-weight: bold;" id="celula-valor-${item.id}">R$ ${valorPagoReal},00</td>
                    <td style="padding: 12px;"><span class="badge-status" style="padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; ${estiloBadge}">${statusTexto}</span></td>
                    <td style="padding: 12px; text-align: center;">
                        <div style="display: flex; gap: 4px; justify-content: center; flex-wrap: wrap;" id="acoes-${item.id}">
                            <button onclick="alterarStatusRapido('${item.id}', '${ehPatrocinador ? 'Parceria Confirmada' : 'Confirmado'}')" style="background:#4CAF50; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px;">Validar</button>
                            <button onclick="alterarStatusRapido('${item.id}', 'Parcial')" style="background:#FF9800; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px;">Parcial</button>
                            <button onclick="abrirEdicaoValorManual('${item.id}', ${valorPagoReal})" style="background:#2196F3; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px;">Editar R$</button>
                            <button onclick="abrirEdicaoCadastroCompleta('${item.id}', '${item.nome}', '${item.tipo_grupo}', ${conjuge}, ${amigos}, '${item.categoria_prato}', '${item.sabor_prato}')" style="background:#673AB7; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px;">Editar Dados</button>
                            <button onclick="deletarInscricao('${item.id}')" style="background:#f44336; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px;">Excluir</button>
                        </div>
                    </td>
                </tr>
            `;
        });
    } else {
        tabelaCorpo.innerHTML = '<tr><td colspan="6" style="padding:30px; text-align:center; color:#aaa;">Nenhum registro encontrado.</td></tr>';
    }

    // Injeta os totais combinados diretamente nas caixas enxutas do topo
    if (containerPublico) containerPublico.innerText = `R$ ${faturamentoPublicoGeral},00`;
    if (containerPatrocinios) containerPatrocinios.innerText = `R$ ${faturamentoPatrocinios},00`;
    if (containerGeral) containerGeral.innerText = `R$ ${faturamentoPublicoGeral + faturamentoPatrocinios},00`;
}

// BOTAO VALIDAR: Confirma o pagamento integral do registro
async function alterarStatusRapido(id, novoStatus) {
    const { error } = await _supabase
        .from('cadastro_arraia')
        .update({ status_pix: novoStatus })
        .eq('id', id);

    if (error) {
        alert("Erro ao validar registro: " + error.message);
    } else {
        carregarDadosPainelAdmin();
    }
}

// BOTAO EDITAR R$: Permite alterar o valor pago manualmente (Alunos ou Patrocinadores)
function abrirEdicaoValorManual(id, valorAtual) {
    const celula = document.getElementById(`celula-valor-${id}`);
    if (!celula) return;

    celula.innerHTML = `
        <input type="number" id="input-valor-${id}" value="${valorAtual}" style="width:50px; background:#333; color:#fff; border:1px solid #555; padding:4px; border-radius:4px; font-size:12px;">
        <button onclick="salvarValorManual('${id}')" style="background:#4CAF50; color:#fff; border:none; padding:4px 6px; border-radius:4px; cursor:pointer; font-size:11px; margin-left:2px;">OK</button>
    `;
}

async function salvarValorManual(id) {
    const valorDigitado = Number(document.getElementById(`input-valor-${id}`).value) || 0;

    const { error } = await _supabase
        .from('cadastro_arraia')
        .update({ total_pix: valorDigitado })
        .eq('id', id);

    if (error) {
        alert("Erro ao salvar valor: " + error.message);
    } else {
        carregarDadosPainelAdmin();
    }
}

// BOTAO EDITAR DADOS: Abre a edição completa dos dados do cadastro inline
function abrirEdicaoCadastroCompleta(id, nome, tipoGrupo, conjuge, amigos, categoria, sabor) {
    document.getElementById(`celula-nome-${id}`).innerHTML = `<input type="text" id="edit-nome-${id}" value="${nome}" style="width:100%; background:#333; color:#fff; border:1px solid #555; padding:4px; border-radius:4px; font-size:12px;">`;
    
    document.getElementById(`celula-grupo-${id}`).innerHTML = `
        <select id="edit-grupo-${id}" style="background:#333; color:#fff; border:1px solid #555; padding:4px; border-radius:4px; font-size:12px; margin-bottom:3px;">
            <option value="Solteiro" ${tipoGrupo === 'Solteiro' ? 'selected' : ''}>Solteiro</option>
            <option value="Casal/Família" ${tipoGrupo !== 'Solteiro' ? 'selected' : ''}>Família</option>
        </select>
        <div style="font-size:11px; color:#aaa;">
            Cônj: <input type="number" id="edit-conjuge-${id}" value="${conjuge}" style="width:30px; background:#333; color:#fff; border:1px solid #555; padding:2px;">
            Amig: <input type="number" id="edit-amigos-${id}" value="${amigos}" style="width:30px; background:#333; color:#fff; border:1px solid #555; padding:2px;">
        </div>
    `;

    document.getElementById(`celula-prato-${id}`).innerHTML = `
        <input type="text" id="edit-cat-${id}" value="${categoria}" placeholder="Categoria" style="width:100%; background:#333; color:#fff; border:1px solid #555; padding:4px; border-radius:4px; font-size:11px; margin-bottom:3px;">
        <input type="text" id="edit-sabor-${id}" value="${sabor}" placeholder="Sabor" style="width:100%; background:#333; color:#fff; border:1px solid #555; padding:4px; border-radius:4px; font-size:11px;">
    `;

    document.getElementById(`acoes-${id}`).innerHTML = `
        <button onclick="salvarEdicaoCadastroCompleta('${id}')" style="background:#4CAF50; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold;">Salvar Alterações</button>
        <button onclick="carregarDadosPainelAdmin()" style="background:#666; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:12px;">Cancelar</button>
    `;
}

async function salvarEdicaoCadastroCompleta(id) {
    const nomeAlt = document.getElementById(`edit-nome-${id}`).value.trim();
    const grupoAlt = document.getElementById(`edit-grupo-${id}`).value;
    const conjugeAlt = Number(document.getElementById(`edit-conjuge-${id}`).value) || 0;
    const amigosAlt = Number(document.getElementById(`edit-amigos-${id}`).value) || 0;
    const catAlt = document.getElementById(`edit-cat-${id}`).value.trim();
    const saborAlt = document.getElementById(`edit-sabor-${id}`).value.trim();

    if (!nomeAlt) {
        alert("O nome não pode ficar em branco.");
        return;
    }

    const { error } = await _supabase
        .from('cadastro_arraia')
        .update({
            nome: nomeAlt,
            tipo_grupo: grupoAlt,
            qtd_conjuge: conjugeAlt,
            qtd_amigos: amigosAlt,
            categoria_prato: catAlt,
            sabor_prato: saborAlt
        })
        .eq('id', id);

    if (error) {
        alert("Erro ao salvar alterações do cadastro: " + error.message);
    } else {
        carregarDadosPainelAdmin();
    }
}

// BOTAO EXCLUIR: Remoção direta com caixa de diálogo simples
async function deletarInscricao(id) {
    if (!confirm("Tem certeza que deseja excluir em definitivo este cadastro do sistema?")) return;

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