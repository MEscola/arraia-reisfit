// js/lista.js

async function carregarListaPublica() {
    const container = document.getElementById('lista-alunos-container');
    container.innerHTML = "Atualizando lista de pratos da mesa coletiva...";

    // Seleciona estritamente os campos não financeiros organizados alfabeticamente
    const { data, error } = await _supabase
        .from('inscricoes_arraia')
        .select('nome, categoria_prato, sabor_prato, qtd_conjuges, qtd_amigos')
        .order('nome', { ascending: true });

    if (error) {
        container.innerHTML = "<p style='color:red;'>Erro ao sincronizar dados da mesa de pratos.</p>";
        return;
    }

    if (data.length === 0) {
        container.innerHTML = "Nenhuma inscrição realizada até o momento. Seja o primeiro a montar a mesa!";
        return;
    }

    // Renderiza a lista na UI em formato de cards mobile limpos
    container.innerHTML = '';
    data.forEach(item => {
        const totalGrupo = 1 + (item.qtd_conjuges || 0) + (item.qtd_amigos || 0);
        container.innerHTML += `
            <div class="card-aluno">
                <strong>${item.nome}</strong> (${totalGrupo} ${totalGrupo > 1 ? 'pessoas' : 'pessoa'})<br>
                <span style="color:#FFC107; font-size:14px; font-weight:bold;">Levará:</span> ${item.categoria_prato} — <em>${item.sabor_prato}</em>
            </div>
        `;
    });
}