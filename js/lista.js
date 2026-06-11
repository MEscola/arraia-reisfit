// js/lista.js

// Carrega a lista pública de inscritos com layout de Cards modernos e contador festivo estratégico
async function carregarListaPublica() {
    const containerLista = document.getElementById('lista-alunos-container');
    if (!containerLista) return;

    containerLista.innerHTML = "<p style='color: #aaa; text-align: center; padding: 30px; font-size: 14px;'>Carregando dados do Arraiá...</p>";

    // Busca os dados no Supabase
    const { data, error } = await _supabase
        .from('cadastro_arraia')
        .select('nome, categoria_prato, sabor_prato, qtd_conjuge, qtd_amigos, status_pix')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erro ao carregar lista pública:", error);
        containerLista.innerHTML = "<p style='color: #f44336; text-align: center; padding: 20px;'>Atenção: Erro ao carregar os dados.</p>";
        return;
    }

    if (!data || data.length === 0) {
        containerLista.innerHTML = "<p style='color: #aaa; text-align: center; padding: 40px; font-size: 14px;'>Nenhuma inscrição realizada até o momento.</p>";
        return;
    }

    containerLista.innerHTML = '';

    let totalGeralPessoasPagas = 0;
    let htmlCards = '';

    // Varre os registros do banco e processa as informações
    data.forEach(aluno => {
        const categoria = aluno.categoria_prato || '';
        const sabor = aluno.sabor_prato || '';
        const status = aluno.status_pix || 'Pendente';

        // Lógica de contagem de pessoas do grupo
        const conjuge = Number(aluno.qtd_conjuge) || 0;
        const amigos = Number(aluno.qtd_amigos) || 0;
        const totalPessoasGrupo = 1 + conjuge + amigos;

        // Se o status for validado/pago, acumula no contador interno
        if (status === 'Confirmado' || status === 'Pago' || status === 'Parceria Confirmada' || status.includes('Pago')) {
            totalGeralPessoasPagas += totalPessoasGrupo;
        }

        // Formatação visual do status
        let statusBadge = "";
        
        if (status === 'Confirmado' || status === 'Pago' || status === 'Parceria Confirmada' || status.includes('Pago')) {
            statusBadge = `<span style="background: rgba(76, 175, 80, 0.12); color: #4CAF50; border: 1px solid rgba(76, 175, 80, 0.25); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; display: inline-block;">Pago</span>`;
        } else if (status === 'Parcial' || status.includes('Parcial')) {
            statusBadge = `<span style="background: rgba(255, 152, 0, 0.12); color: #FF9800; border: 1px solid rgba(255, 152, 0, 0.25); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; display: inline-block;">Pagamento Parcial</span>`;
        } else {
            statusBadge = `<span style="background: rgba(239, 83, 80, 0.08); color: #EF5350; border: 1px solid rgba(239, 83, 80, 0.2); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-style: italic; display: inline-block;">Aguardando</span>`;
        }

        // HTML Estruturado em cards modernos
        htmlCards += `
            <div style="background: rgba(255, 255, 255, 0.04); padding: 20px; border-radius: 14px; margin-bottom: 16px; border-left: 5px solid #FFC107; box-shadow: 0 4px 12px rgba(0,0,0,0.2); line-height: 1.6;">
                
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;">
                    <div style="flex: 1; min-width: 180px;">
                        <strong style="font-size: 16px; color: #fff; display: block; text-align: left; letter-spacing: 0.3px;">${aluno.nome}</strong>
                        <small style="color: #888; display: block; margin-top: 2px; text-align: left; font-size: 11px;">
                            Grupo: <span style="color: #FFC107; font-weight: bold;">${totalPessoasGrupo}</span> ${totalPessoasGrupo === 1 ? 'pessoa' : 'pessoas'} no total
                        </small>
                    </div>
                    <div style="text-align: right; margin-top: 2px;">
                        ${statusBadge}
                    </div>
                </div>
                
                <div style="background: rgba(255, 193, 7, 0.04); border: 1px solid rgba(255, 193, 7, 0.12); padding: 10px 14px; border-radius: 8px; margin-top: 12px;">
                    <small style="color: #FFC107; font-weight: bold; display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 2px;">
                        ${categoria}
                    </small>
                    <span style="color: #e0e0e0; display: block; font-size: 13px; font-style: italic; word-wrap: break-word; text-align: left;">
                        ${sabor ? sabor : '<span style="color: #666;">Especificação não informada</span>'}
                    </span>
                </div>

            </div>
        `;
    });

    // TÁTICA DA MARCIA: O card de empolgação só aparece se bater a meta mínima de pessoas pagas
    const META_MINIMA_PESSOAS = 15; // Mude esse número para quanto você achar melhor!
    let htmlContadorTopo = '';

    if (totalGeralPessoasPagas >= META_MINIMA_PESSOAS) {
        htmlContadorTopo = `
            <div style="background: linear-gradient(135deg, rgba(255, 193, 7, 0.15) 0%, rgba(255, 87, 34, 0.15) 100%); border: 1px solid rgba(255, 193, 7, 0.3); padding: 16px; border-radius: 14px; margin-bottom: 20px; text-align: center; box-shadow: 0 4px 15px rgba(255, 152, 0, 0.1); animation: pulsarGatilho 2s infinite ease-in-out;">
                <span style="color: #eee; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; display: block;">Olha o Arraiá bombando!</span>
                <div style="font-size: 20px; color: #fff; font-weight: 900; margin: 4px 0;">
                    <span style="color: #FF9800; font-size: 26px;" id="numero-animado-publico">0</span> PESSOAS JÁ CONFIRMADAS!
                </div>
                <span style="color: #aaa; font-size: 11px; display: block;">Garanta sua vaga lançando o seu PIX! 🤠</span>
            </div>
            
            <style>
                @keyframes pulsarGatilho {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.02); box-shadow: 0 4px 20px rgba(255, 152, 0, 0.2); }
                    100% { transform: scale(1); }
                }
            </style>
        `;
    }

    // Injeta os componentes na tela
    containerLista.innerHTML = htmlContadorTopo + htmlCards;

    // Só roda a animação do cronômetro se o bloco de topo estiver visível (bateu a meta)
    if (totalGeralPessoasPagas >= META_MINIMA_PESSOAS) {
        animarContadorNumeroPublico('numero-animado-publico', totalGeralPessoasPagas);
    }
}

// Efeito cronômetro simulando o crescimento do número na tela
function animarContadorNumeroPublico(idElemento, numeroFinal) {
    const elemento = document.getElementById(idElemento);
    if (!elemento) return;

    let contagemInicial = 0;
    const duracaoEfeitoMs = 1200; 
    const passoTempoMs = Math.max(Math.floor(duracaoEfeitoMs / numeroFinal), 15);

    const temporizador = setInterval(() => {
        contagemInicial++;
        elemento.innerText = contagemInicial;

        if (contagemInicial >= numeroFinal) {
            clearInterval(temporizador);
            elemento.innerText = numeroFinal;
        }
    }, passoTempoMs);
}

// Inicializa a lista assim que a página terminar de carregar o HTML
window.addEventListener('DOMContentLoaded', () => {
    carregarListaPublica();
});