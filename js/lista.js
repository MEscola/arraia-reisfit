// js/lista.js

async function carregarListaPublica() {
    const container = document.getElementById('lista-alunos-container');
    if (!container) return;
    
    container.innerHTML = "Atualizando lista de pratos da mesa coletiva...";

    // Seleciona os dados da tabela correta no Supabase
    const { data, error } = await _supabase
        .from('cadastro_arraia')
        .select('nome, categoria_prato, sabor_prato, qtd_conjuge, qtd_amigos')
        .order('nome', { ascending: true });

    if (error) {
        console.error("Erro ao carregar lista pública:", error);
        container.innerHTML = "<p style='color:#F44336;'>Erro ao sincronizar dados da mesa de pratos.</p>";
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = "<p style='color:#aaa; text-align:center;'>Nenhuma inscrição realizada até o momento.<br>Seja o primeiro a montar a mesa! 🤠</p>";
        return;
    }

    // Renderiza a lista na UI em formato de cards mobile limpos
    container.innerHTML = '';
    data.forEach(item => {
        // CORREÇÃO AQUI: Mudado para item.qtd_conjuge (no singular) para a conta fechar certo!
        const totalGrupo = 1 + (Number(item.qtd_conjuge) || 0) + (Number(item.qtd_amigos) || 0);
        
        container.innerHTML += `
            <div class="card-aluno">
                <strong>${item.nome}</strong> (${totalGrupo} ${totalGrupo > 1 ? 'pessoas' : 'pessoa'})<br>
                <div style="margin-top: 5px; font-size: 14px; line-height: 1.4;">
                    <span style="color:#FFC107; font-weight:bold;">Confirmou:</span> ${item.categoria_prato}
                </div>
                <div style="margin-top: 2px; font-size: 13px; color: #bbb; font-style: italic;">
                    ${item.sabor_prato}
                </div>
            </div>
        `;
    });
}