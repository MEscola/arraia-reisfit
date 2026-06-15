// js/adm.js

window.addEventListener('DOMContentLoaded', () => {
    carregarDadosPainelAdmin();
});

function carregarPainelADM() {
    carregarDadosPainelAdmin();
}

async function carregarDadosPainelAdmin() {
    const tabelaCorpo = document.getElementById('tabela-adm-corpo');
    const containerGeral = document.getElementById('total-general-caixa');
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
            const totalPessoasLinha = 1 + conjuge + amigos; // Soma o titular + acompanhantes
            
            totalPessoasGeral += totalPessoasLinha;

            const statusAtual = item.status_pix || "Pendente";
            
            // Identifica se é parceiro por termos oficiais do cadastro ou pelas tags do adm
            const ehParceiro = statusAtual.includes("Box Friendly") || statusAtual.includes("Parceria") || statusAtual.includes("Parceiro");
            const ehParceiro100 = statusAtual.includes("Isenção Total") || statusAtual.includes("100");
            const ehParceiro50 = statusAtual.includes("Isenção Titular") || statusAtual.includes("50");

            // Verifica se o pagamento está validado
            const estaValidado = statusAtual === "Confirmado" || statusAtual === "Pago" || statusAtual === "Parceria Confirmada" || statusAtual.includes("Pago");

            // 1. CÁLCULO DE INSCRIÇÃO INDEPENDENTE DO STATUS
            let valorInscricaoCalculada = 0;
            if (ehParceiro) {
                if (ehParceiro100) {
                    valorInscricaoCalculada = 0; // Isenção Total
                } else {
                    valorInscricaoCalculada = (conjuge * 15) + (amigos * 20); // Isenção Titular
                }
            } else {
                valorInscricaoCalculada = 15 + (conjuge * 15) + (amigos * 20); // Aluno comum
            }

            // 2. ISOLA A DOAÇÃO PURA DO PARCEIRO
            const valorDoacaoPura = ehParceiro ? (Number(item.total_pix) || 0) : 0;

            // REGRA DE SOMA: Só adiciona se estiver validado
            if (estaValidado) {
                totalPessoasPagas += totalPessoasLinha;
                faturamentoPublicoGeral += valorInscricaoCalculada;
                
                if (ehParceiro) {
                    faturamentoPatrocinios += valorDoacaoPura;
                }
            }

            let statusTexto = "⏳ Pendente";
            let estiloBadge = "background: rgba(255, 152, 0, 0.1); color: #FF9800; border: 1px solid rgba(255, 152, 0, 0.2);";

            if (estaValidado) {
                statusTexto = "✅ Pago";
                estiloBadge = "background: rgba(76, 175, 80, 0.1); color: #4CAF50; border: 1px solid rgba(76, 175, 80, 0.2);";
            } else if (statusAtual === "Parcial" || statusAtual === "Pagamento Parcial") {
                statusTexto = "⚡ Parcial";
                estiloBadge = "background: rgba(255, 87, 34, 0.1); color: #FF5722; border: 1px solid rgba(255, 87, 34, 0.2);";
            }

            // BOTÃO DINÂMICO
            let botaoAcaoStatusHTML = "";
            if (estaValidado) {
                let statusAoDesfazer = 'Pendente';
                if (ehParceiro) {
                    if (ehParceiro100) statusAoDesfazer = 'Box Friendly (Isenção Total)';
                    else if (ehParceiro50) statusAoDesfazer = 'Box Friendly (Isenção Titular)';
                }
                botaoAcaoStatusHTML = `<button onclick="alterarStatusRapido('${item.id}', '${statusAoDesfazer}')" style="background:#555; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px;">Desfazer</button>`;
            } else {
                let statusAoValidar = 'Pago';
                if (ehParceiro) {
                    if (ehParceiro100) statusAoValidar = 'Pago (Parceiro 100)';
                    else if (ehParceiro50) statusAoValidar = 'Pago (Parceiro 50)';
                }
                botaoAcaoStatusHTML = `<button onclick="alterarStatusRapido('${item.id}', '${statusAoValidar}')" style="background:#4CAF50; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px;">Validar</button>`;
            }

            let celulaValorHTML = "";
            if (ehParceiro) {
                let textoDoacaoInjetada = valorDoacaoPura > 0 ? `<div style="font-size: 10px; color: #00BCD4; margin-top: 2px; font-weight: bold;">Doação: R$ ${valorDoacaoPura},00</div>` : '';
                
                celulaValorHTML = `
                    <td style="padding: 12px; font-weight: bold; white-space: nowrap; vertical-align: top;" id="celula-pai-valor-${item.id}">
                        <div style="color: #fff; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;" onclick="abrirCaixinhaDoacaoAbaixo('${item.id}', ${valorDoacaoPura})" title="Clique para editar a doação">
                            R$ ${valorInscricaoCalculada},00 <span style="font-size: 13px;">🤝</span>
                        </div>
                        ${textoDoacaoInjetada}
                        <div id="container-doacao-abaixo-${item.id}"></div>
                    </td>`;
            } else {
                celulaValorHTML = `<td style="padding: 12px; font-weight: bold; color: #fff; white-space: nowrap; vertical-align: top;">R$ ${valorInscricaoCalculada},00</td>`;
            }

            let rotuloParceiro = "";
            if (ehParceiro) {
                if (ehParceiro100) rotuloParceiro = ' <span style="color: #00BCD4; font-size: 11px;">(Parceiro 100)</span>';
                else if (ehParceiro50) rotuloParceiro = ' <span style="color: #00BCD4; font-size: 11px;">(Parceiro 50)</span>';
                else rotuloParceiro = ' <span style="color: #00BCD4; font-size: 11px;">(Parceiro)</span>';
            }
            
            const nomeExibicao = `<strong>${item.nome}</strong>${rotuloParceiro}`;

            // Passa explicitamente a string do sabor_prato para a renderização do formulário interno de edição
            const saborSeguro = item.sabor_prato || "";

            tabelaCorpo.innerHTML += `
                <tr id="linha-${item.id}" style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 12px; vertical-align: top;" id="celula-nome-${item.id}">
                        ${nomeExibicao}
                        <small style="color:#888; display:block; margin-top:2px;">Grupo: ${item.tipo_grupo} | Total: ${totalPessoasLinha} pessoas</small>
                    </td>
                    ${celulaValorHTML}
                    <td style="padding: 12px; width: 70px; min-width: 70px; white-space: nowrap; vertical-align: top;">
                        <span class="badge-status" style="padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; display: inline-block; ${estiloBadge}">
                            ${statusTexto}
                        </span>
                    </td>
                    <td style="padding: 12px; text-align: center; vertical-align: top;">
                        <div style="display: flex; gap: 4px; justify-content: center; flex-wrap: wrap;" id="acoes-${item.id}">
                            ${botaoAcaoStatusHTML}
                            <button onclick="abrirEdicaoCadastroCompleta('${item.id}', '${item.nome.replace(/'/g, "\\'")}', '${item.tipo_grupo}', ${conjuge}, ${amigos}, '${saborSeguro.replace(/'/g, "\\'")}', '${statusAtual}')" style="background:#673AB7; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px;">Editar</button>
                            <button onclick="deletarInscricao('${item.id}')" style="background:#f44336; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px;">Excluir</button>
                        </div>
                    </td>
                </tr>
            `;
        });
    } else {
        tabelaCorpo.innerHTML = '<tr><td colspan="4" style="padding:30px; text-align:center; color:#aaa;">Nenhum registro.</td></tr>';
    }

    if (containerPublico) containerPublico.innerText = `R$ ${faturamentoPublicoGeral},00`;
    if (containerPatrocinios) containerPatrocinios.innerText = `R$ ${faturamentoPatrocinios},00`;
    if (containerGeral) containerGeral.innerText = `R$ ${faturamentoPublicoGeral + faturamentoPatrocinios},00`;
    
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

function abrirCaixinhaDoacaoAbaixo(id, doacaoAtual) {
    const containerAbaixo = document.getElementById(`container-doacao-abaixo-${id}`);
    if (!containerAbaixo) return;

    if (containerAbaixo.innerHTML !== '') {
        containerAbaixo.innerHTML = '';
        return;
    }

    containerAbaixo.innerHTML = `
        <div style="display: flex; align-items: center; gap: 2px; margin-top: 5px;" onclick="event.stopPropagation();">
            <input type="number" id="input-doacao-${id}" value="${doacaoAtual === 0 ? '' : doacaoAtual}" placeholder="R$ 0" style="width:50px; background:#222; color:#fff; border:1px solid #00BCD4; padding:3px; border-radius:4px; font-size:11px;">
            <button onclick="salvarDoacaoParceiro('${id}')" style="background:#00BCD4; color:#fff; border:none; padding:3px 5px; border-radius:4px; cursor:pointer; font-size:11px; font-weight:bold;">OK</button>
            <button onclick="document.getElementById('container-doacao-abaixo-${id}').innerHTML = ''" style="background:#666; color:#fff; border:none; padding:3px 5px; border-radius:4px; cursor:pointer; font-size:11px;">X</button>
        </div>
    `;
    
    setTimeout(() => {
        const input = document.getElementById(`input-doacao-${id}`);
        if (input) {
            input.focus();
            if (doacaoAtual > 0) input.select();
        }
    }, 30);
}

async function salvarDoacaoParceiro(id) {
    const valorDoado = Number(document.getElementById(`input-doacao-${id}`).value) || 0;

    const celulaNome = document.getElementById(`celula-nome-${id}`);
    let eh100 = false;
    let eh50 = false;
    
    if (celulaNome) {
        if (celulaNome.innerText.includes('100')) eh100 = true;
        if (celulaNome.innerText.includes('50')) eh50 = true;
    }

    let novoStatusPix = '';
    if (valorDoado === 0) {
        if (eh100) novoStatusPix = 'Box Friendly (Isenção Total)';
        else if (eh50) novoStatusPix = 'Box Friendly (Isenção Titular)';
        else novoStatusPix = 'Pendente';
    } else {
        if (eh100) novoStatusPix = 'Pago (Parceiro 100)';
        else if (eh50) novoStatusPix = 'Pago (Parceiro 50)';
        else novoStatusPix = 'Pago (Parceiro)';
    }

    const { error } = await _supabase
        .from('cadastro_arraia')
        .update({ total_pix: valorDoado, status_pix: novoStatusPix })
        .eq('id', id);

    if (error) {
        alert("Erro ao lançar patrocínio: " + error.message);
    } else {
        carregarDadosPainelAdmin();
    }
}

function abrirEdicaoCadastroCompleta(id, nome, tipoGrupo, conjuge, amigos, saborPrato, statusAtual) {
    const celulaNome = document.getElementById(`celula-nome-${id}`);
    if (!celulaNome) return;

    // Detecta o tipo de parceria atual
    let tipoParceriaAtual = "comum";
    if (statusAtual.includes("100") || statusAtual.includes("Total")) tipoParceriaAtual = "100";
    else if (statusAtual.includes("Box Friendly") || statusAtual.includes("50") || statusAtual.includes("Titular") || statusAtual.includes("Parceiro")) tipoParceriaAtual = "50";

    // Decodifica a string saborPrato do banco para separar o Doce e Salgado nos inputs visuais
    let doceAtual = "";
    let salgadoAtual = "";
    
    if (saborPrato.includes("|")) {
        const partes = saborPrato.split("|");
        partes.forEach(p => {
            if (p.includes("Doce:")) doceAtual = p.replace("Doce:", "").trim();
            if (p.includes("Salgado:")) salgadoAtual = p.replace("Salgado:", "").trim();
        });
    } else if (saborPrato.includes("Salgado:")) {
        salgadoAtual = saborPrato.replace("Salgado:", "").trim();
    } else if (saborPrato.includes("Doce:")) {
        doceAtual = saborPrato.replace("Doce:", "").trim();
    } else if (saborPrato && saborPrato !== "Não especificado") {
        salgadoAtual = saborPrato; // Se for texto antigo corrido, joga em salgado por precaução
    }

    // IDs dos inputs alterados para não conflitar com colunas inexistentes!
    celulaNome.innerHTML = `
        <div style="background: rgba(255,255,255,0.03); padding: 8px; border-radius: 6px; border: 1px solid #555; width: 100%; box-sizing: border-box;">
            <span style="font-size:10px; color:#00BCD4; font-weight:bold; display:block; margin-bottom:2px;">NOME DO PARTICIPANTE:</span>
            <input type="text" id="edit-nome-${id}" value="${nome}" style="width:100%; background:#222; color:#fff; border:1px solid #444; padding:5px; border-radius:4px; font-size:12px; margin-bottom:8px; box-sizing: border-box;">
            
            <span style="font-size:10px; color:#00BCD4; font-weight:bold; display:block; margin-bottom:2px;">CATEGORIA / PARCERIA:</span>
            <select id="edit-parceria-${id}" style="width:100%; background:#222; color:#fff; border:1px solid #444; padding:5px; border-radius:4px; font-size:12px; margin-bottom:8px; box-sizing: border-box;">
                <option value="comum" ${tipoParceriaAtual === 'comum' ? 'selected' : ''}>Aluno Comum</option>
                <option value="50" ${tipoParceriaAtual === '50' ? 'selected' : ''}>Box Friendly (Isenção Titular - 50)</option>
                <option value="100" ${tipoParceriaAtual === '100' ? 'selected' : ''}>Box Friendly (Isenção Total - 100)</option>
            </select>

            <span style="font-size:10px; color:#aaa; display:block; margin-bottom:2px;">TIPO DE GRUPO:</span>
            <select id="edit-grupo-${id}" style="width:100%; background:#222; color:#fff; border:1px solid #444; padding:5px; border-radius:4px; font-size:12px; margin-bottom:8px; box-sizing: border-box;">
                <option value="Solteiro" ${tipoGrupo === 'Solteiro' ? 'selected' : ''}>Solteiro</option>
                <option value="Casal/Família" ${tipoGrupo !== 'Solteiro' ? 'selected' : ''}>Família</option>
            </select>
            
            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <div style="flex: 1;">
                    <span style="font-size:10px; color:#aaa; display:block;">CÔNJUGE:</span>
                    <input type="number" id="edit-conjuge-${id}" value="${conjuge}" style="width:100%; background:#222; color:#fff; border:1px solid #444; padding:5px; border-radius:4px; box-sizing: border-box;">
                </div>
                <div style="flex: 1;">
                    <span style="font-size:10px; color:#aaa; display:block;">AMIGOS:</span>
                    <input type="number" id="edit-amigos-${id}" value="${amigos}" style="width:100%; background:#222; color:#fff; border:1px solid #444; padding:5px; border-radius:4px; box-sizing: border-box;">
                </div>
            </div>

            <span style="font-size:10px; color:#4CAF50; font-weight:bold; display:block; margin-bottom:2px;">PRATO SALGADO:</span>
            <input type="text" id="edit-sabor-salgado-${id}" value="${salgadoAtual}" placeholder="Ex: Coxinha, Empadão" style="width:100%; background:#222; color:#fff; border:1px solid #444; padding:5px; border-radius:4px; font-size:12px; margin-bottom:8px; box-sizing: border-box;">

            <span style="font-size:10px; color:#4CAF50; font-weight:bold; display:block; margin-bottom:2px;">PRATO DOCE:</span>
            <input type="text" id="edit-sabor-doce-${id}" value="${doceAtual}" placeholder="Ex: Canjica, Pé de Moleque" style="width:100%; background:#222; color:#fff; border:1px solid #444; padding:5px; border-radius:4px; font-size:12px; box-sizing: border-box;">
        </div>
    `;

    document.getElementById(`acoes-${id}`).innerHTML = `
        <button onclick="salvarEdicaoCadastroCompleta('${id}')" style="background:#4CAF50; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:11px; font-weight:bold; width: 100%; margin-bottom:4px;">Salvar</button>
        <button onclick="carregarDadosPainelAdmin()" style="background:#666; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:11px; width: 100%;">Cancelar</button>
    `;
}

async function salvarEdicaoCadastroCompleta(id) {
    const nomeAlt = document.getElementById('edit-nome-' + id).value.trim();
    const grupoAlt = document.getElementById('edit-grupo-' + id).value;
    const conjugeAlt = Number(document.getElementById('edit-conjuge-' + id).value) || 0;
    const amigosAlt = Number(document.getElementById('edit-amigos-' + id).value) || 0;
    
    // Captura dos IDs corrigidos gerados na função abrirEdicaoCadastroCompleta
    const salgadoAlt = document.getElementById('edit-sabor-salgado-' + id).value.trim();
    const doceAlt = document.getElementById('edit-sabor-doce-' + id).value.trim();
    const parceriaAlt = document.getElementById('edit-parceria-' + id).value;

    if (!nomeAlt) {
        alert("O nome é obrigatório.");
        return;
    }

    // Define o novo status com base na seleção do menu de edição
    let novoStatusFinal = "Pendente";
    if (parceriaAlt === "100") novoStatusFinal = "Box Friendly (Isenção Total)";
    else if (parceriaAlt === "50") novoStatusFinal = "Box Friendly (Isenção Titular)";

    // Monta a string no formato do banco de dados para evitar erros de esquema cache
    let saborFinal = "";
    if (salgadoAlt && doceAlt) {
        saborFinal = `Doce: ${doceAlt} | Salgado: ${salgadoAlt}`;
    } else if (salgadoAlt) {
        saborFinal = `Salgado: ${salgadoAlt}`;
    } else if (doceAlt) {
        saborFinal = `Doce: ${doceAlt}`;
    } else {
        saborFinal = "Não especificado";
    }

    let categoryFinal = grupoAlt === "Solteiro" ? "Editado (Individual)" : "Doce e Salgado 🍫🥐";

    const { error } = await _supabase
        .from('cadastro_arraia')
        .update({
            nome: nomeAlt,
            tipo_grupo: grupoAlt,
            qtd_conjuge: conjugeAlt,
            qtd_amigos: amigosAlt,
            categoria_prato: categoryFinal, // Colona válida mapeada
            sabor_prato: saborFinal,         // Colona válida mapeada
            status_pix: novoStatusFinal 
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