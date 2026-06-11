// js/adm.js

// Executa a carga inicial dos dados assim que a página administrativa carrega
window.addEventListener('DOMContentLoaded', () => {
    carregarDadosPainelAdmin();
});

async function carregarDadosPainelAdmin() {
    const tabelaCorpo = document.getElementById('tabela-adm-corpo');
    const containerAlunos = document.getElementById('caixa-alunos-container');
    const containerParceiros = document.getElementById('caixa-parceiros-container');
    const containerPagantes = document.getElementById('total-pagantes');

    if (!tabelaCorpo) return;

    // Busca todos os registros do banco de dados ordenados pelo nome
    const { data: inscritos, error } = await _supabase
        .from('cadastro_arraia')
        .select('*')
        .order('nome', { ascending: true });

    if (error) {
        console.error("Erro ao carregar dados administrativos:", error);
        tabelaCorpo.innerHTML = '<tr><td colspan="7">Erro ao carregar dados do banco.</td></tr>';
        return;
    }

    // Variáveis de controle financeiro segregado
    let caixaAlunosArrecadado = 0;
    let caixaAlunosPendente = 0;
    
    let caixaParceirosArrecadado = 0;
    let caixaParceirosPendente = 0;

    let totalGeralPessoas = 0;

    tabelaCorpo.innerHTML = '';

    if (inscritos && inscritos.length > 0) {
        inscritos.forEach(item => {
            const conjuge = Number(item.qtd_conjuge) || 0;
            const amigos = Number(item.qtd_amigos) || 0;
            const totalGrupo = 1 + conjuge + amigos;
            totalGeralPessoas += totalGrupo;

            // Identificação de Parcerias e Isenções
            const ehParceiro = item.status_pix && item.status_pix.includes("Box Friendly");
            const isencaoTotal = item.status_pix && item.status_pix.includes("Isenção Total");
            const isencaoTitular = item.status_pix && item.status_pix.includes("Isenção Titular");

            // Cálculo do Valor Esperado (Regra Base do Evento)
            let valorEsperadoTitular = 15;
            let valorEsperadoConjuge = 15;
            let valorEsperadoAmigo = 20;

            if (ehParceiro) {
                if (isencaoTotal) {
                    valorEsperadoTitular = 0;
                    valorEsperadoConjuge = 0;
                    valorEsperadoAmigo = 0;
                } else if (isencaoTitular) {
                    valorEsperadoTitular = 0;
                }
            }

            const custoTotalInscricao = valorEsperadoTitular + (conjuge * valorEsperadoConjuge) + (amigos * valorEsperadoAmigo);
            const valorPagoReal = Number(item.total_pix) || 0;

            // Determinação reativa do Status de Pagamento (Tratamento de Pagamento Parcial)
            let statusExibicao = item.status_pix || "Pendente";
            let classeStatusCss = "status-pendente";
            let detalheSaldoResidual = "";

            if (ehParceiro) {
                if (isencaoTotal) {
                    statusExibicao = "Parceria Isenta";
                    classeStatusCss = "status-parceiro-isento";
                } else if (isencaoTitular) {
                    if (valorPagoReal >= custoTotalInscricao) {
                        statusExibicao = "Parceria Confirmada";
                        classeStatusCss = "status-confirmado";
                    } else if (valorPagoReal > 0 && valorPagoReal < custoTotalInscricao) {
                        statusExibicao = "Pagamento Parcial";
                        classeStatusCss = "status-parcial";
                        detalheSaldoResidual = ` (Falta R$ ${custoTotalInscricao - valorPagoReal},00)`;
                    } else {
                        statusExibicao = "Parceiro Pendente Acompanhante";
                        classeStatusCss = "status-pendente";
                        detalheSaldoResidual = ` (Falta R$ ${custoTotalInscricao},00)`;
                    }
                }
            } else {
                if (statusExibicao === "Confirmado") {
                    classeStatusCss = "status-confirmado";
                } else if (statusExibicao === "Parcial" || (valorPagoReal > 0 && valorPagoReal < custoTotalInscricao)) {
                    statusExibicao = "Pagamento Parcial";
                    classeStatusCss = "status-parcial";
                    detalheSaldoResidual = ` (Falta R$ ${custoTotalInscricao - valorPagoReal},00)`;
                } else {
                    classeStatusCss = "status-pendente";
                }
            }

            // Distribuição dos Valores nos Caixas Destinos Correspondentes
            if (ehParceiro) {
                caixaParceirosArrecadado += valorPagoReal;
                if (custoTotalInscricao > valorPagoReal) {
                    caixaParceirosPendente += (custoTotalInscricao - valorPagoReal);
                }
            } else {
                if (statusExibicao === "Pagamento Parcial") {
                    caixaAlunosArrecadado += valorPagoReal;
                    caixaAlunosPendente += (custoTotalInscricao - valorPagoReal);
                } else if (statusExibicao === "Confirmado") {
                    caixaAlunosArrecadado += custoTotalInscricao;
                } else {
                    caixaAlunosPendente += custoTotalInscricao;
                }
            }

            // Construção das Ações da Tabela sem referências a PIX para Isentos
            let acoesHtml = "";
            if (ehParceiro && isencaoTotal) {
                acoesHtml = `<button onclick="modificarStatusInscricao('${item.id}', 'Parceria Isenta')" class="btn-acao-validar">Validar Registro</button>`;
            } else if (statusExibicao === "Pagamento Parcial" || statusExibicao.includes("Pendente")) {
                acoesHtml = `
                    <button onclick="modificarStatusInscricao('${item.id}', 'Confirmado')" class="btn-acao-confirmar">Confirmar Integral</button>
                    <button onclick="ativarEdicaoInline('${item.id}')" class="btn-acao-editar">Editar Valor</button>
                `;
            } else {
                acoesHtml = `<button onclick="modificarStatusInscricao('${item.id}', 'Pendente')" class="btn-acao-desfazer">Desfazer</button>`;
            }

            // Renderização da Linha na Tabela Administrativa
            tabelaCorpo.innerHTML += `
                <tr id="linha-${item.id}">
                    <td><strong>${item.nome}</strong></td>
                    <td>${item.tipo_grupo} (${totalGrupo} p.)</td>
                    <td><small>${item.categoria_prato}<br>${item.sabor_prato}</small></td>
                    <td>R$ ${custoTotalInscricao},00</td>
                    <td>R$ ${valorPagoReal},00</td>
                    <td><span class="badge-status ${classeStatusCss}">${statusExibicao}${detalheSaldoResidual}</span></td>
                    <td>
                        <div class="bloco-acoes-tabela">
                            ${acoesHtml}
                            <button onclick="removerInscricaoComConfirmacao('${item.id}')" class="btn-acao-remover">Excluir</button>
                        </div>
                    </td>
                </tr>
            `;
        });
    } else {
        tabelaCorpo.innerHTML = '<tr><td colspan="7">Nenhuma inscrição localizada no banco de dados.</td></tr>';
    }

    // Atualização dos Painéis de Indicadores com Destinos Separados (adm.html)
    if (containerAlunos) {
        containerAlunos.innerHTML = `
            Valor Arrecadado (Confirmado): <strong>R$ ${caixaAlunosArrecadado},00</strong><br>
            Valor Pendente (Previsão): R$ ${caixaAlunosPendente},00<br>
            Total Estimado do Bloco: R$ ${caixaAlunosArrecadado + caixaAlunosPendente},00
        `;
    }

    if (containerParceiros) {
        containerParceiros.innerHTML = `
            Arrecadado via Taxas Extraordinárias/Parcerias: <strong>R$ ${caixaParceirosArrecadado},00</strong><br>
            Residual Pendente de Acompanhantes: R$ ${caixaParceirosPendente},00<br>
            Total Isolado do Bloco: R$ ${caixaParceirosArrecadado + caixaParceirosPendente},00
        `;
    }

    if (containerPagantes) {
        containerPagantes.innerText = `Total Geral de Público Confirmado / Previsto: ${totalGeralPessoas} pessoas`;
    }
}

// Lógica de Mutação: Atualiza o status do banco de dados via Supabase
async function modificarStatusInscricao(id, novoStatus) {
    const { error } = await _supabase
        .from('cadastro_arraia')
        .update({ status_pix: novoStatus })
        .eq('id', id);

    if (error) {
        alert("Erro ao atualizar registro administrativo: " + error.message);
    } else {
        carregarDadosPainelAdmin();
    }
}

// Lógica de Remoção Segura com Dupla Confirmação
async function removerInscricaoComConfirmacao(id) {
    const confirmacaoPrimeira = confirm("Deseja realmente excluir esta inscrição do banco de dados?");
    if (!confirmacaoPrimeira) return;

    const confirmacaoSegunda = confirm("Atenção: Esta ação é irreversível e alterará a contabilidade dos caixas. Confirma a exclusão definitiva?");
    if (!confirmacaoSegunda) return;

    const { error } = await _supabase
        .from('cadastro_arraia')
        .delete()
        .eq('id', id);

    if (error) {
        alert("Erro ao remover registro: " + error.message);
    } else {
        carregarDadosPainelAdmin();
    }
}

// Interface Inline: Permite alterar o valor pago real diretamente na linha da tabela
function activarEdicaoInline(id) {
    const linha = document.getElementById(`linha-${id}`);
    if (!linha) return;

    const célulaValorPago = linha.cells[4];
    const valorAtual = célulaValorPago.innerText.replace("R$ ", "").replace(",00", "").trim();

    célulaValorPago.innerHTML = `
        <input type="number" id="input-inline-${id}" value="${valorAtual}" style="width: 70px; padding: 4px; border-radius: 4px; background: #222; color: #fff; border: 1px solid #444;">
        <button onclick="salvarValorInline('${id}')" style="padding: 4px 8px; font-size: 11px; background: #4CAF50; color: #fff; border: none; border-radius: 4px; cursor: pointer; margin-left: 4px;">OK</button>
    `;
}

async function salvarValorInline(id) {
    const novoValor = Number(document.getElementById(`input-inline-${id}`).value) || 0;

    const { error } = await _supabase
        .from('cadastro_arraia')
        .update({ total_pix: novoValor, status_pix: 'Parcial' })
        .eq('id', id);

    if (error) {
        alert("Erro ao salvar modificação de valor: " + error.message);
    } else {
        carregarDadosPainelAdmin();
    }
}