// js/lista.js

// Carrega a lista pública de confirmados no contêiner correto do HTML
async function carregarListaPublica() {
    const containerLista = document.getElementById('lista-alunos-container');
    if (!containerLista) return;

    containerLista.innerHTML = "<p style='color: #aaa; text-align: center;'>Carregando a mesa coletiva...</p>";

    // Busca os dados no Supabase
    const { data, error } = await _supabase
        .from('cadastro_arraia')
        .select('nome, categoria_prato, sabor_prato, qtd_conjuge, qtd_amigos, status_pix')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erro ao carregar lista pública:", error);
        containerLista.innerHTML = "<p style='color: #f44336; text-align: center;'>⚠️ Erro ao carregar os dados da mesa coletiva.</p>";
        return;
    }

    if (!data || data.length === 0) {
        containerLista.innerHTML = "<p style='color: #aaa; text-align: center;'>Nenhuma inscrição confirmada até o momento. Seja o primeiro! 🤠</p>";
        return;
    }

    containerLista.innerHTML = '';

    // Varre os registros do banco e monta blocos (cards) elegantes
    data.forEach(aluno => {
        const categoria = aluno.categoria_prato || '';
        const sabor = aluno.sabor_prato || '';
        const status = aluno.status_pix || 'Pendente';

        // Lógica de contagem de pessoas do grupo
        const conjuge = Number(aluno.qtd_conjuge) || 0;
        const amigos = Number(aluno.qtd_amigos) || 0;
        const totalPessoasGrupo = 1 + conjuge + amigos;

        // Formatação visual sutil do status para o público
        let statusBadge = "";
        if (status === 'Pago') {
            statusBadge = `<span style="background: rgba(76, 175, 80, 0.2); color: #4CAF50; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;">✅ Confirmado</span>`;
        } else if (status && status.includes("Box Friendly")) {
            statusBadge = `<span style="background: rgba(33, 150, 243, 0.2); color: #2196F3; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;">🤝 Parceiro</span>`;
        } else {
            statusBadge = `<span style="background: rgba(255, 152, 0, 0.2); color: #FF9800; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-style: italic;">⚠️ Aguardando</span>`;
        }

        // Injeta o card do aluno diretamente no contêiner do seu HTML
        containerLista.innerHTML += `
            <div style="background: rgba(255, 255, 255, 0.05); padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #FFC107; display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1; padding-right: 10px;">
                    <strong style="font-size: 14px; color: #fff; display: block; text-align: left;">${aluno.nome}</strong> 
                    <small style="color: #aaa; display: block; margin-top: 2px; text-align: left;">Grupo: ${totalPessoasGrupo} ${totalPessoasGrupo === 1 ? 'pessoa' : 'pessoas'}</small>
                    <small style="color: #bbb; display: block; margin-top: 4px; font-size: 11px; line-height: 1.3; max-width: 220px; word-wrap: break-word; text-align: left;">
                        <span style="color: #ffc107; font-weight: bold;">${categoria}</span>: ${sabor}
                    </small>
                </div>
                <div style="text-align: right; min-width: 90px;">
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