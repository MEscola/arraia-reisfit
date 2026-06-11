// js/lista.js

// Carrega a lista pública de confirmados com layout de Cards modernos e bem espaçados
async function carregarListaPublica() {
    const containerLista = document.getElementById('lista-alunos-container');
    if (!containerLista) return;

    containerLista.innerHTML = "<p style='color: #aaa; text-align: center; padding: 30px; font-size: 14px;'>Carregando a mesa coletiva... 🥣</p>";

    // Busca os dados no Supabase
    const { data, error } = await _supabase
        .from('cadastro_arraia')
        .select('nome, categoria_prato, sabor_prato, qtd_conjuge, qtd_amigos, status_pix')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erro ao carregar lista pública:", error);
        containerLista.innerHTML = "<p style='color: #f44336; text-align: center; padding: 20px;'>⚠️ Erro ao carregar os dados da mesa coletiva.</p>";
        return;
    }

    if (!data || data.length === 0) {
        containerLista.innerHTML = "<p style='color: #aaa; text-align: center; padding: 40px; font-size: 14px;'>Nenhuma inscrição confirmada até o momento. Seja o primeiro! 🤠</p>";
        return;
    }

    containerLista.innerHTML = '';

    // Varre os registros do banco e monta blocos com alto espaçamento e respiro visual
    data.forEach(aluno => {
        const categoria = aluno.categoria_prato || '';
        const sabor = aluno.sabor_prato || '';
        const status = aluno.status_pix || 'Pendente';

        // Lógica de contagem de pessoas do grupo
        const conjuge = Number(aluno.qtd_conjuge) || 0;
        const amigos = Number(aluno.qtd_amigos) || 0;
        const totalPessoasGrupo = 1 + conjuge + amigos;

        // Formatação visual premium do status com fundos translúcidos sutilmente coloridos
        let statusBadge = "";
        if (status === 'Pago') {
            statusBadge = `<span style="background: rgba(76, 175, 80, 0.12); color: #4CAF50; border: 1px solid rgba(76, 175, 80, 0.25); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; display: inline-block;">✅ Confirmado</span>`;
        } else if (status && status.includes("Box Friendly")) {
            statusBadge = `<span style="background: rgba(33, 150, 243, 0.12); color: #2196F3; border: 1px solid rgba(33, 150, 243, 0.25); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; display: inline-block;">🤝 Parceiro</span>`;
        } else {
            statusBadge = `<span style="background: rgba(255, 152, 0, 0.08); color: #FF9800; border: 1px solid rgba(255, 152, 0, 0.2); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-style: italic; display: inline-block;">⚠️ Aguardando</span>`;
        }

        // HTML Estruturado em blocos verticais (Flex-wrap) para NUNCA embolar no celular
        containerLista.innerHTML += `
            <div style="background: rgba(255, 255, 255, 0.04); padding: 20px; border-radius: 14px; margin-bottom: 16px; border-left: 5px solid #FFC107; box-shadow: 0 4px 12px rgba(0,0,0,0.2); line-height: 1.6;">
                
                <!-- Cabeçalho do Card: Nome e Status lado a lado com quebra automática se faltar espaço no celular -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;">
                    <div style="flex: 1; min-width: 180px;">
                        <strong style="font-size: 16px; color: #fff; display: block; text-align: left; letter-spacing: 0.3px;">${aluno.nome}</strong>
                        <small style="color: #888; display: block; margin-top: 2px; text-align: left; font-size: 11px;">
                            👥 Levará <span style="color: #FFC107; font-weight: bold;">${totalPessoasGrupo}</span> ${totalPessoasGrupo === 1 ? 'pessoa' : 'pessoas'} no total
                        </small>
                    </div>
                    <div style="text-align: right; margin-top: 2px;">
                        ${statusBadge}
                    </div>
                </div>
                
                <!-- Caixa Dedicada ao Prato: Isolada abaixo para dar leitura limpa e ampla -->
                <div style="background: rgba(255, 193, 7, 0.04); border: 1px solid rgba(255, 193, 7, 0.12); padding: 10px 14px; border-radius: 8px; margin-top: 12px;">
                    <small style="color: #FFC107; font-weight: bold; display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 2px;">
                        🍴 ${categoria}
                    </small>
                    <span style="color: #e0e0e0; display: block; font-size: 13px; font-style: italic; word-wrap: break-word; text-align: left;">
                        ${sabor ? sabor : '<span style="color: #666;">Sabor não especificado</span>'}
                    </span>
                </div>

            </div>
        `;
    });
}

// Inicializa a lista assim que a página terminar de carregar o HTML
window.addEventListener('DOMContentLoaded', () => {
    carregarListaPublica();
});