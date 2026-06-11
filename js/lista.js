// js/lista.js

// Carrega a lista pública de confirmados com layout de Cards modernos e desembolados
async function carregarListaPublica() {
    const containerLista = document.getElementById('lista-alunos-container');
    if (!containerLista) return;

    containerLista.innerHTML = "<p style='color: #aaa; text-align: center; padding: 20px;'>Carregando a mesa coletiva... 🥣</p>";

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
        containerLista.innerHTML = "<p style='color: #aaa; text-align: center; padding: 30px;'>Nenhuma inscrição confirmada até o momento. Seja o primeiro! 🤠</p>";
        return;
    }

    containerLista.innerHTML = '';

    // Varre os registros do banco e monta blocos (cards) elegantes e bem espaçados
    data.forEach(aluno => {
        const categoria = aluno.categoria_prato || '';
        const sabor = aluno.sabor_prato || '';
        const status = aluno.status_pix || 'Pendente';

        // Lógica de contagem de pessoas do grupo
        const conjuge = Number(aluno.qtd_conjuge) || 0;
        const amigos = Number(aluno.qtd_amigos) || 0;
        const totalPessoasGrupo = 1 + conjuge + amigos;

        // Formatação visual premium do status para o público
        let statusBadge = "";
        if (status === 'Pago') {
            statusBadge = `<span style="background: rgba(76, 175, 80, 0.15); color: #4CAF50; border: 1px solid rgba(76, 175, 80, 0.3); padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; white-space: nowrap;">✅ Confirmado</span>`;
        } else if (status && status.includes("Box Friendly")) {
            statusBadge = `<span style="background: rgba(33, 150, 243, 0.15); color: #2196F3; border: 1px solid rgba(33, 150, 243, 0.3); padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; white-space: nowrap;">🤝 Parceiro</span>`;
        } else {
            statusBadge = `<span style="background: rgba(255, 152, 0, 0.1); color: #FF9800; border: 1px solid rgba(255, 152, 0, 0.2); padding: 4px 8px; border-radius: 6px; font-size: 11px; font-style: italic; white-space: nowrap;">⚠️ Aguardando</span>`;
        }

        // Injeta o card do aluno perfeitamente espaçado e alinhado
        containerLista.innerHTML += `
            <div style="background: rgba(255, 255, 255, 0.04); padding: 16px; border-radius: 12px; margin-bottom: 12px; border-left: 4px solid #FFC107; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.15); line-height: 1.5;">
                <div style="flex: 1; padding-right: 12px;">
                    <!-- Nome do Aluno -->
                    <strong style="font-size: 15px; color: #fff; display: block; text-align: left; letter-spacing: 0.3px;">${aluno.nome}</strong> 
                    
                    <!-- Quantidade de pessoas do grupo -->
                    <small style="color: #aaa; display: block; margin-top: 3px; text-align: left; font-size: 11px;">
                        👥 Grupo: <span style="color: #fff; font-weight: bold;">${totalPessoasGrupo}</span> ${totalPessoasGrupo === 1 ? 'pessoa' : 'pessoas'}
                    </small>
                    
                    <!-- Box do Prato/Caldo Escolhido -->
                    <div style="margin-top: 8px; background: rgba(255, 193, 7, 0.05); border: 1px solid rgba(255, 193, 7, 0.15); padding: 6px 10px; border-radius: 6px; max-width: 95%;">
                        <small style="color: #ffc107; font-weight: bold; display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">${categoria}</small>
                        <small style="color: #e0e0e0; display: block; margin-top: 2px; font-size: 12px; font-style: italic; word-wrap: break-word;">${sabor || 'Não especificado'}</small>
                    </div>
                </div>
                
                <!-- Coluna do Status (Alinhado à direita e centralizado verticalmente) -->
                <div style="text-align: right; min-width: 95px; display: flex; justify-content: flex-end; align-items: center;">
                    ${statusBadge}
                </div>
            </div>
        `;
    });
}

// Inicializa a lista assim que a página terminar de carregar o HTML
window.addEventListener('DOMContentLoaded', () => {
    carregarListaPublica();
});