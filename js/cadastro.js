// js/cadastro.js

// Lista oficial de caldos do Arraiá ReisFit
const CALDOS_OFICIAIS = [
    "Pela égua",
    "Caldo verde",
    "Mocotó",
    "Dobradinha",
    "Canjiquinha",
    "Caldo de aipim",
    "Caldo de abóbora"
];

// Interface: Ajusta se exibe inputs para Solteiro ou Família
function ajustarFluxoGrupo() {
    const tipoGrupoField = document.getElementById('tipo_grupo');
    const fluxoSolteiro = document.getElementById('fluxo-solteiro');
    const fluxoFamilia = document.getElementById('fluxo-familia');
    
    // Captura as caixas de acompanhantes para poder sumir com elas
    const campoConjugesGroup = document.getElementById('qtd_conjuges')?.closest('.form-group');
    const campoAmigosGroup = document.getElementById('qtd_amigos')?.closest('.form-group');
    const campoCriancasGroup = document.getElementById('criancas')?.closest('.form-group');

    if (!tipoGrupoField || !fluxoSolteiro || !fluxoFamilia) return;

    if (tipoGrupoField.value === "Solteiro") {
        // Se for Solteiro, mostra a escolha simples de prato e esconde acompanhantes
        fluxoSolteiro.classList.remove('hidden');
        fluxoFamilia.classList.add('hidden');
        
        if(campoConjugesGroup) campoConjugesGroup.classList.add('hidden');
        if(campoAmigosGroup) campoAmigosGroup.classList.add('hidden');
        if(campoCriancasGroup) campoCriancasGroup.classList.add('hidden');

        // Zera os valores para não somar no PIX por engano
        if(document.getElementById('qtd_conjuges')) document.getElementById('qtd_conjuges').value = 0;
        if(document.getElementById('qtd_amigos')) document.getElementById('qtd_amigos').value = 0;
        if(document.getElementById('criancas')) document.getElementById('criancas').value = '';
    } else {
        // Se for Casal/Família, abre a digitação obrigatória e as caixas de acompanhantes
        fluxoSolteiro.classList.add('hidden');
        fluxoFamilia.classList.remove('hidden');
        
        if(campoConjugesGroup) campoConjugesGroup.classList.remove('hidden');
        if(campoAmigosGroup) campoAmigosGroup.classList.remove('hidden');
        if(campoCriancasGroup) campoCriancasGroup.classList.remove('hidden');
    }
    calcularPix();
}

// Interface: Mostra o input de texto do prato do solteiro
function controlarSaborSolteiro() {
    const pratoSolteiroField = document.getElementById('prato_solteiro');
    const grupoSabor = document.getElementById('grupo-sabor-solteiro');
    
    if (!pratoSolteiroField || !grupoSabor) return;

    if (pratoSolteiroField.value !== "") {
        grupoSabor.classList.remove('hidden');
    } else {
        grupoSabor.classList.add('hidden');
    }
}

// LÓGICA DE CALDOS: Busca no banco e monta o select apenas com caldos que têm vagas
async function controlarOpcoesCaldos() {
    const levaCaldoField = document.getElementById('leva_caldo');
    const grupoCaldo = document.getElementById('grupo-sabores-caldo');
    const selectCaldo = document.getElementById('sabor_caldo');
    
    if (!levaCaldoField || !grupoCaldo || !selectCaldo) return;

    if (levaCaldoField.value === 'Não') {
        grupoCaldo.classList.add('hidden');
        selectCaldo.innerHTML = '';
        return;
    }

    grupoCaldo.classList.remove('hidden');
    selectCaldo.innerHTML = '<option value="">Buscando caldos disponíveis...</option>';

    // CORREÇÃO CRÍTICA: Mudado de 'inscricoes_arraia' para 'cadastro_arraia'
    const { data: inscritos, error } = await _supabase
        .from('cadastro_arraia')
        .select('sabor_prato, qtd_conjuges, qtd_amigos');

    if (error) {
        console.error("Erro Supabase Caldos:", error);
        selectCaldo.innerHTML = '<option value="">⚠️ Erro ao carregar o banco</option>';
        return;
    }

    let mapaCaldos = {};
    CALDOS_OFICIAIS.forEach(c => mapaCaldos[c] = 0);

    if (inscritos && Array.isArray(inscritos)) {
        inscritos.forEach(item => {
            if (item.sabor_prato && mapaCaldos[item.sabor_prato] !== undefined) {
                const conjuges = Number(item.qtd_conjuges) || 0;
                const amigos = Number(item.qtd_amigos) || 0;
                mapaCaldos[item.sabor_prato] += (1 + conjuges + amigos);
            }
        });
    }

    const qtdConjugesAtuais = Number(document.getElementById('qtd_conjuges')?.value) || 0;
    const qtdAmigosAtuais = Number(document.getElementById('qtd_amigos')?.value) || 0;
    const tamanhoGrupoAtual = 1 + qtdConjugesAtuais + qtdAmigosAtuais;

    selectCaldo.innerHTML = '<option value="">Selecione um caldo...</option>';
    let temCaldoDisponivel = false;

    CALDOS_OFICIAIS.forEach(caldo => {
        const vagasOcupadas = mapaCaldos[caldo];
        if ((vagasOcupadas + tamanhoGrupoAtual) <= 3) {
            selectCaldo.innerHTML += `<option value="${caldo}">${caldo} (${vagasOcupadas}/3 ocupados)</option>`;
            temCaldoDisponivel = true;
        }
    });

    if (!temCaldoDisponivel) {
        selectCaldo.innerHTML = '<option value="">⚠️ Todos os caldos atingiram o limite de 3 pessoas!</option>';
    }
}

// Regra de Negócio: Calcula o valor total do PIX baseado na estrutura do grupo familiar
function calcularPix() {
    const patrocinadorField = document.getElementById('patrocinador');
    const labelPix = document.getElementById('label-pix');
    
    const qtdConjuges = Number(document.getElementById('qtd_conjuges')?.value) || 0;
    const qtdAmigos = Number(document.getElementById('qtd_amigos')?.value) || 0;

    if (!patrocinadorField || !labelPix) return 0;

    const isPatrocinador = patrocinadorField.value === 'sim';
    const entradaTitular = isPatrocinador ? 0 : 15;
    
    const total = entradaTitular + (qtdConjuges * 15) + (qtdAmigos * 20);
    
    labelPix.innerText = `R$ ${total},00`;
    return total;
}

// Inicializador Único de Ciclo de Vida: Executa TUDO com proteção após o DOM estar desenhado na tela
window.addEventListener('DOMContentLoaded', () => {
    ajustarFluxoGrupo();
    calcularPix();

    const campoConjuges = document.getElementById('qtd_conjuges');
    const campoAmigos = document.getElementById('qtd_amigos');

    if (campoConjuges) {
        campoConjuges.addEventListener('input', () => { calcularPix(); controlarOpcoesCaldos(); });
    }
    if (campoAmigos) {
        campoAmigos.addEventListener('input', () => { calcularPix(); controlarOpcoesCaldos(); });
    }

    const formulario = document.getElementById('form-inscricao');
    if (formulario) {
        formulario.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('btn-enviar');
            btn.disabled = true;
            btn.innerText = "Processando inscrição, aguarde...";

            const tipoGrupo = document.getElementById('tipo_grupo').value;
            const levaCaldo = document.getElementById('leva_caldo').value;
            const saborCaldo = document.getElementById('sabor_caldo').value;
            const qtdConjuges = Number(document.getElementById('qtd_conjuges').value) || 0;
            const qtdAmigos = Number(document.getElementById('qtd_amigos').value) || 0;

            if (levaCaldo === 'Sim' && !saborCaldo) {
                alert("Por favor, selecione um sabor de caldo disponível!");
                btn.disabled = false;
                btn.innerText = "Confirmar Meu Cadastro";
                return;
            }

            let categoriaFinal = "";
            let saborFinal = "";

            if (tipoGrupo === "Solteiro") {
                categoriaFinal = document.getElementById('prato_solteiro').value;
                saborFinal = document.getElementById('sabor_prato_solteiro').value || "Não especificado";
                
                if (!categoriaFinal) {
                    alert("Por favor, selecione se trará um prato Doce ou Salgado!");
                    btn.disabled = false;
                    btn.innerText = "Confirmar Meu Cadastro";
                    return;
                }
            } else {
                const doce = document.getElementById('sabor_doce_familia').value || "Doce não especificado";
                const salgado = document.getElementById('sabor_salgado_familia').value || "Salgado não especificado";
                
                categoriaFinal = "Doce e Salgado 🍫🥐";
                saborFinal = `Doce: ${doce} | Salgado: ${salgado}`;
            }

            const totalPix = calcularPix();
            const payload = {
                nome: document.getElementById('nome').value,
                tipo_grupo: tipoGrupo,
                qtd_conjuges: qtdConjuges,
                qtd_amigos: qtdAmigos,
                criancas: document.getElementById('criancas').value,
                leva_caldo: levaCaldo,
                categoria_prato: levaCaldo === 'Sim' ? `Caldo (${saborCaldo}) + ${categoriaFinal}` : categoriaFinal,
                sabor_prato: levaCaldo === 'Sim' ? saborCaldo : saborFinal, 
                total_pix: totalPix,
                status_pix: 'Pendente'
            };

            // CORREÇÃO CRÍTICA: Mudado para salvar na tabela 'cadastro_arraia'
            const { error } = await _supabase.from('cadastro_arraia').insert([payload]);

            if (error) {
                alert("Erro ao processar inscrição: " + error.message);
                btn.disabled = false;
                btn.innerText = "Confirmar Meu Cadastro";
            } else {
                alert(`Sucesso!\n\nSeu cadastro foi enviado com sucesso!\n\nValor total para pagamento via PIX: R$ ${totalPix},00\n\nAcompanhe a evolução da mesa coletiva na próxima tela!`);
                formulario.reset();
                window.location.href = "lista.html"; 
            }
        });
    }
});