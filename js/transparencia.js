// js/transparencia.js

window.addEventListener('DOMContentLoaded', () => {
    carregarPortalTransparencia();
});

async function carregarPortalTransparencia() {
    // Pegando os elementos da tela
    const txtGeralArrecadado = document.getElementById('transp-geral-arrecadado');
    const txtGeralGasto = document.getElementById('transp-geral-gasto');
    const txtGeralSaldo = document.getElementById('transp-geral-saldo');

    const txtAlunos = document.getElementById('transp-alunos');
    const txtParceiros = document.getElementById('transp-parceiros');
    const txtArrecadacao = document.getElementById('transp-arrecadacao');
    
    const blocoCategorias = document.getElementById('transp-resumo-categorias');
    const tabelaCorpo = document.getElementById('tabela-transp-corpo');
    
    const txtTotalGasto = document.getElementById('transp-total-gasto');
    const txtSaldoFinal = document.getElementById('transp-saldo-final');

    if (!tabelaCorpo) return;

    // 1. BUSCAR ENTRADAS (Inscritos)
    const { data: inscritos, error: erroInscritos } = await _supabase
        .from('cadastro_arraia')
        .select('qtd_conjuge, qtd_amigos, status_pix, total_pix');

    // 2. BUSCAR SAÍDAS (Gastos)
    const { data: gastos, error: erroGastos } = await _supabase
        .from('gastos_arraia')
        .select('*')
        .order('created_at', { ascending: false });

    if (erroInscritos || erroGastos) {
        console.error("Erro Supabase:", erroInscritos || erroGastos);
        return;
    }

    // --- PROCESSAR RECURSOS RECEBIDOS ---
    let faturamentoPublicoAlunos = 0;       // Gaveta dos Alunos comuns
    let faturamentoPatrocinios = 0;         // Gaveta dos Parceiros (Doações/PIX Puro)
    let faturamentoInscricoesParceiros = 0; // Inscrições de acompanhantes vindas de parceiros

    if (inscritos) {
        inscritos.forEach(item => {
            const statusAtual = item.status_pix || "Pendente";
            
            const ehParceiro = statusAtual.includes("Box Friendly") || statusAtual.includes("Parceria") || statusAtual.includes("Parceiro");
            const ehParceiro100 = statusAtual.includes("Isenção Total") || statusAtual.includes("100");
            const ehParceiro50 = statusAtual.includes("Isenção Titular") || statusAtual.includes("50");

            const estaValidado = statusAtual === "Confirmado" || statusAtual === "Pago" || statusAtual === "Parceria Confirmada" || statusAtual.includes("Pago");

            if (estaValidado) {
                const conjuge = Number(item.qtd_conjuge) || 0;
                const amigos = Number(item.qtd_amigos) || 0;
                
                let valorInscricaoCalculada = 0;
                if (ehParceiro) {
                    if (ehParceiro100) {
                        valorInscricaoCalculada = 0;
                    } else if (ehParceiro50) {
                        // Isenção Titular: ignora os 15 do titular e soma cônjuge e amigos
                        valorInscricaoCalculada = (conjuge * 15) + (amigos * 20);
                    } else {
                        valorInscricaoCalculada = (conjuge * 15) + (amigos * 20);
                    }
                } else {
                    valorInscricaoCalculada = 15 + (conjuge * 15) + (amigos * 20);
                }

                if (ehParceiro) {
                    faturamentoInscricoesParceiros += valorInscricaoCalculada;
                    const valorDoacaoPura = Number(item.total_pix) || 0;
                    faturamentoPatrocinios += valorDoacaoPura;
                } else {
                    faturamentoPublicoAlunos += valorInscricaoCalculada;
                }
            }
        });
    }

    // A arrecadação total é a soma de tudo o que entrou de fato no evento
    const arrecadacaoTotal = faturamentoPublicoAlunos + faturamentoInscricoesParceiros + faturamentoPatrocinios;

    // --- PROCESSAR SAÍDAS E CATEGORIAS ---
    let custosTotal = 0;
    const resumoCategorias = {};

    tabelaCorpo.innerHTML = '';

    if (gastos && gastos.length > 0) {
        gastos.forEach(gasto => {
            const valorGasto = Number(gasto.valor) || 0;
            custosTotal += valorGasto;

            const cat = gasto.categoria || "Outros";
            resumoCategorias[cat] = (resumoCategorias[cat] || 0) + valorGasto;

            let botaoNotaHTML = gasto.url_nota 
                ? `<a href="${gasto.url_nota}" target="_blank" style="color:#00BCD4; font-weight:bold; text-decoration:none; background:rgba(0,188,212,0.08); padding:4px 10px; border-radius:6px; font-size:12px; border: 1px solid rgba(0,188,212,0.2);">Ver</a>` 
                : `<span style="color:#555; font-style:italic; font-size:12px;">Não anexada</span>`;

            tabelaCorpo.innerHTML += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 13px;">
                    <td style="padding: 8px 2px; color:#aaa;">${gasto.categoria}</td>
                    <td style="padding: 8px 2px; color:#fff; font-weight: 500;">${gasto.descricao}</td>
                    <td style="padding: 8px 2px; color:#fff; font-weight:bold; white-space:nowrap;">R$ ${valorGasto.toFixed(2)}</td>
                    <td style="padding: 8px 2px; text-align:center;">${botaoNotaHTML}</td>
                </tr>
            `;
        });

        // Renderizar e ORDENAR o resumo por categorias (Maior gasto primeiro)
        if (blocoCategorias) {
            blocoCategorias.innerHTML = '';
            
            const emojis = {
                "Descartáveis": "🌭", "Bebidas": "🥤", "Brindes/Bingo": "🎁", 
                "Decoração": "🎨", "Outros": "📦", "Logística": "🚚", "Infraestrutura": "🎪"
            };

            Object.entries(resumoCategorias)
                .sort((a, b) => b[1] - a[1])
                .forEach(([categoria, valor]) => {
                    const emoji = emojis[categoria] || "📋";
                    blocoCategorias.innerHTML += `
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: #ddd; margin-bottom: 8px;">
                            <span>${emoji} ${categoria}</span>
                            <span style="font-family: monospace; color: #fff;">R$ ${valor.toFixed(2)}</span>
                        </div>
                    `;
                });
        }

    } else {
        tabelaCorpo.innerHTML = '<tr><td colspan="4" style="padding:30px; text-align:center; color:#888; font-style:italic;">Nenhum gasto registrado.</td></tr>';
        if (blocoCategorias) blocoCategorias.innerHTML = '<p style="color:#666; font-size:13px;">Nenhum gasto para resumir.</p>';
    }

    // --- ATUALIZAR ACUMULADORES NA TELA ---
    const saldoFinalCaixa = arrecadacaoTotal - custosTotal;

    // Atualiza Bloco Novo: RESUMO GERAL (No topo)
    if (txtGeralArrecadado) txtGeralArrecadado.innerText = `R$ ${arrecadacaoTotal.toFixed(2)}`;
    if (txtGeralGasto) txtGeralGasto.innerText = `R$ ${custosTotal.toFixed(2)}`;
    if (txtGeralSaldo) {
        txtGeralSaldo.innerText = `R$ ${saldoFinalCaixa.toFixed(2)}`;
        txtGeralSaldo.style.color = saldoFinalCaixa >= 0 ? "#00BCD4" : "#F44336";
    }

    // AJUSTE DE SINCRONIZAÇÃO AQUI:
    // O público geral da ADM soma alunos + ingressos de convidados de parceiros
    if (txtAlunos) txtAlunos.innerText = `R$ ${(faturamentoPublicoAlunos + faturamentoInscricoesParceiros).toFixed(2)}`;
    // O patrocínio exibe apenas o PIX puro do parceiro (os R$ 50,00)
    if (txtParceiros) txtParceiros.innerText = `R$ ${faturamentoPatrocinios.toFixed(2)}`;
    if (txtArrecadacao) txtArrecadacao.innerText = `R$ ${arrecadacaoTotal.toFixed(2)}`;

    // Atualiza Bloco 2: Total Gasto
    if (txtTotalGasto) txtTotalGasto.innerText = `R$ ${custosTotal.toFixed(2)}`;

    // Atualiza Bloco 3: Saldo Final Simplificado
    if (txtSaldoFinal) {
        txtSaldoFinal.innerText = `R$ ${saldoFinalCaixa.toFixed(2)}`;
        
        const lblTextoSaldo = document.getElementById('label-saldo-texto');
        if (lblTextoSaldo) {
            if (saldoFinalCaixa < 0) {
                lblTextoSaldo.innerText = "Déficit após todos os gastos registrados:";
                txtSaldoFinal.style.color = "#F44336";
            } else {
                lblTextoSaldo.innerText = "Saldo após todos os gastos registrados:";
                txtSaldoFinal.style.color = "#00BCD4";
            }
        }
    }
}