// js/cadastro.js

// Interface Dinâmica: Mostra o campo de sabor apenas se selecionar uma categoria válida
function controlarCamposPrato() {
    const categoria = document.getElementById('categoria_prato').value;
    const grupoSabor = document.getElementById('grupo-sabor');
    
    if (categoria !== "") {
        grupoSabor.classList.remove('hidden');
    } else {
        grupoSabor.classList.add('hidden');
    }
}

// Regra de Negócio: Calcula o valor total do PIX baseado na estrutura do grupo familiar
function calcularPix() {
    const isPatrocinador = document.getElementById('patrocinador').value === 'sim';
    const qtdConjuges = Number(document.getElementById('qtd_conjuges').value) || 0;
    const qtdAmigos = Number(document.getElementById('qtd_amigos').value) || 0;

    // Se for patrocinador, a entrada individual do titular é R$ 0, senão R$ 15
    const entradaTitular = isPatrocinador ? 0 : 15;
    
    // Regra de precificação das cotas familiares e convidados
    const total = entradaTitular + (qtdConjuges * 15) + (qtdAmigos * 20);
    
    // Atualiza o valor visual instantaneamente na tela do celular
    document.getElementById('label-pix').innerText = `R$ ${total},00`;
    return total;
}

// Intercepta a submissão do formulário para validar regras e salvar no Supabase
document.getElementById('form-inscricao').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('btn-enviar');
    btn.disabled = true;
    btn.innerText = "Processando inscrição, aguarde...";

    const levaCaldo = document.getElementById('leva_caldo').value;
    const qtdConjuges = Number(document.getElementById('qtd_conjuges').value) || 0;
    const qtdAmigos = Number(document.getElementById('qtd_amigos').value) || 0;
    const tamanhoGrupoAtual = 1 + qtdConjuges + qtdAmigos;

    // Algoritmo de Validação de Caldos (Garantia física de insumos limitados a 3 pessoas)
    if (levaCaldo === 'Sim') {
        const { data: cadastrados, error: errCaldo } = await _supabase
            .from('inscricoes_arraia')
            .select('qtd_conjuges, qtd_amigos')
            .eq('leva_caldo', 'Sim');

        if (!errCaldo) {
            let totalCaldosConsumidos = 0;
            
            // Varre a tabela somando os integrantes reais de cada grupo cadastrado
            cadastrados.forEach(item => {
                totalCaldosConsumidos += (1 + (item.qtd_conjuges || 0) + (item.qtd_amigos || 0));
            });

            // Se o novo grupo estourar a vaga das 3 pessoas físicas, rejeita imediatamente
            if ((totalCaldosConsumidos + tamanhoGrupoAtual) > 3) {
                alert(`Inscrição Interrompida!\n\nO limite máximo para o rodízio de caldos é de 3 pessoas. Atualmente já temos ${totalCaldosConsumidos} confirmados.\n\nPor favor, remova a opção do caldo ou reduza a quantidade de integrantes do grupo para prosseguir.`);
                btn.disabled = false;
                btn.innerText = "Confirmar Minha Inscrição";
                return;
            }
        }
    }

    // Passou nas validações? Prepara a gravação no Postgres
    const totalPix = calcularPix();
    const payload = {
        nome: document.getElementById('nome').value,
        tipo_grupo: `${tamanhoGrupoAtual} p.`,
        qtd_conjuges: qtdConjuges,
        qtd_amigos: qtdAmigos,
        criancas: document.getElementById('criancas').value,
        leva_caldo: levaCaldo,
        categoria_prato: document.getElementById('categoria_prato').value,
        sabor_prato: document.getElementById('sabor_prato').value || "Não especificado",
        total_pix: totalPix,
        status_pix: 'Pendente'
    };

    const { error } = await _supabase.from('inscricoes_arraia').insert([payload]);

    if (error) {
        alert("Erro ao processar inscrição: " + error.message);
        btn.disabled = false;
        btn.innerText = "Confirmar Minha Inscrição";
    } else {
        alert(`Sucesso!\n\nSeu cadastro foi enviado com sucesso!.\n\nValor total para pagamento via PIX: R$ ${totalPix},00\n\nAcompanhe a evolução da mesa coletiva na próxima tela!`);
        
        // Reseta o estado do formulário local antes de mudar de página
        document.getElementById('form-inscricao').reset();
        
        // Redireciona fisicamente o navegador para a página da lista
        window.location.href = "lista.html"; 
    }
});