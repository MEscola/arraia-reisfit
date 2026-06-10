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
    const blocoAcompanhantes = document.getElementById('campos-acompanhantes');
    
    if (!tipoGrupoField || !fluxoSolteiro || !fluxoFamilia || !blocoAcompanhantes) return;

    if (tipoGrupoField.value === "Solteiro") {
        fluxoSolteiro.classList.remove('hidden');
        fluxoFamilia.classList.add('hidden');
        blocoAcompanhantes.classList.add('hidden');
        
        // Zera os valores para o cálculo correto do PIX no singular
        if(document.getElementById('qtd_conjuge')) document.getElementById('qtd_conjuge').value = 0;
        if(document.getElementById('qtd_amigos')) document.getElementById('qtd_amigos').value = 0;
        if(document.getElementById('criancas')) document.getElementById('criancas').value = '';
    } else {
        fluxoSolteiro.classList.add('hidden');
        fluxoFamilia.classList.remove('hidden');
        blocoAcompanhantes.classList.remove('hidden');
    }
    calcularPix();
}

// Interface: Mostra o input de texto do prato do solteiro
function controlarSaborSolteiro() {
    const pratoSolteiroField = document.getElementById('prato_solteiro');
    const groupSabor = document.getElementById('grupo-sabor-solteiro');
    
    if (!pratoSolteiroField || !groupSabor) return;

    if (pratoSolteiroField.value !== "") {
        groupSabor.classList.remove('hidden');
    } else {
        groupSabor.classList.add('hidden');
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

    // CORREÇÃO CRÍTICA: Buscando 'qtd_conjuge' no singular para não quebrar a árvore do cache do Supabase
    const { data: inscritos, error } = await _supabase
        .from('cadastro_arraia')
        .select('sabor_prato, qtd_conjuge, qtd_amigos');

    if (error) {
        console.error("Erro Supabase Caldos:", error);
        selectCaldo.innerHTML = '<option value="">⚠️ Erro ao carregar o banco</option>';
        return;
    }

    let mapaCaldos = {};
    selectCaldo.innerHTML = '<option value="">Selecione um caldo...</option>';
    let temCaldoDisponivel = false;

    CALDOS_OFICIAIS.forEach(caldo => {
        const vagasOcupadas = mapaCaldos[caldo];
        const restoVagas = 3 - vagasOcupadas;

        if (restoVagas >= tamanhoGrupoAtual) {
            // Caso ideal: o grupo cabe perfeitamente nas vagas restantes
            selectCaldo.innerHTML += `<option value="${caldo}">${caldo} (${vagasOcupadas}/3 ocupados)</option>`;
            temCaldoDisponivel = true;
        } else {
            // Regra Flexível: O grupo é maior que o limite, mas o sistema PERMITE selecionar
            // Avisa o usuário no texto do select, mas deixa a opção aberta para não travar a família
            const textoAviso = restoVagas > 0 ? `restam ${restoVagas} vagas` : "limite atingido";
            selectCaldo.innerHTML += `<option value="${caldo}">${caldo} ⚠️ (${vagasOcupadas}/3 - Seu grupo excede o limite)</option>`;
            temCaldoDisponivel = true;
        }
    });

    // Como deixamos a regra flexível, este bloco de erro geral não vai mais travar o app
    if (!temCaldoDisponivel && selectCaldo.options.length <= 1) {
        selectCaldo.innerHTML = '<option value="">⚠️ Busque a coordenação para ajustar as vagas dos caldos.</option>';
    }
}

    // Lê os inputs do HTML da tela atual (os IDs do seu index.html permanecem os mesmos)
    const qtdConjugesAtuais = Number(document.getElementById('qtd_conjuge')?.value) || 0;
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

// Regra de Negócio: Calcula o valor total do PIX baseado na estrutura do grupo familiar
function calcularPix() {
    const patrocinadorCheckbox = document.getElementById('patrocinador');
    const labelPix = document.getElementById('label-pix');
    
    const qtdConjuges = Number(document.getElementById('qtd_conjuge')?.value) || 0;
    const qtdAmigos = Number(document.getElementById('qtd_amigos')?.value) || 0;

    if (!labelPix) return 0;

    const isPatrocinador = patrocinadorCheckbox ? patrocinadorCheckbox.checked : false;
    const entradaTitular = isPatrocinador ? 0 : 15;
    
    const total = entradaTitular + (qtdConjuges * 15) + (qtdAmigos * 20);
    
    labelPix.innerText = `R$ ${total},00`;
    return total;
}

// Inicializador Único de Ciclo de Vida: Executa TUDO com proteção após o DOM estar desenhado na tela
window.addEventListener('DOMContentLoaded', () => {
    // Alinhamento e cálculo inicial do app
    ajustarFluxoGrupo();
    calcularPix();

    // DISPARADORES REATIVOS DE INPUT DO LAYOUT APP
    const campoConjuges = document.getElementById('qtd_conjuge');
    const campoAmigos = document.getElementById('qtd_amigos');
    const selectTipoGrupo = document.getElementById('tipo_grupo');
    const selectLevaCaldo = document.getElementById('leva_caldo');

    if (campoConjuges) {
        campoConjuges.addEventListener('input', () => { calcularPix(); controlarOpcoesCaldos(); });
    }
    if (campoAmigos) {
        campoAmigos.addEventListener('input', () => { calcularPix(); controlarOpcoesCaldos(); });
    }
    if (selectTipoGrupo) {
        selectTipoGrupo.addEventListener('change', () => { ajustarFluxoGrupo(); });
    }
    if (selectLevaCaldo) {
        selectLevaCaldo.addEventListener('change', () => { controlarOpcoesCaldos(); });
    }

    // FORMULÁRIO DE ENVIO PARA O BANCO
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
            const qtdConjuges = Number(document.getElementById('qtd_conjuge').value) || 0;
            const qtdAmigos = Number(document.getElementById('qtd_amigos').value) || 0;

            if (levaCaldo === 'Sim' && !saborCaldo) {
                alert("Por favor, selecione um sabor de caldo disponível!");
                btn.disabled = false;
                btn.innerText = "Confirmar Cadastro";
                return;
            }

            let categoryFinal = "";
            let saborFinal = "";

            if (tipoGrupo === "Solteiro") {
                categoryFinal = document.getElementById('prato_solteiro').value;
                saborFinal = document.getElementById('sabor_prato_solteiro').value || "Não especificado";
                
                if (!categoryFinal) {
                    alert("Por favor, selecione se trará um prato Doce ou Salgado!");
                    btn.disabled = false;
                    btn.innerText = "Confirmar Cadastro";
                    return;
                }
            } else {
                const doce = document.getElementById('sabor_doce_familia').value || "Doce não especificado";
                const salgado = document.getElementById('sabor_salgado_familia').value || "Salgado não especificado";
                
                categoryFinal = "Doce e Salgado 🍫🥐";
                saborFinal = `Doce: ${doce} | Salgado: ${salgado}`;
            }

            const totalPix = calcularPix();
            const payload = {
                nome: document.getElementById('nome').value,
                tipo_grupo: tipoGrupo,
                qtd_conjuge: qtdConjuges, // Enviando para a coluna certa no singular (qtd_conjuge)
                qtd_amigos: qtdAmigos,
                criancas: document.getElementById('criancas').value,
                leva_caldo: levaCaldo,
                categoria_prato: levaCaldo === 'Sim' ? `Caldo (${saborCaldo}) + ${categoryFinal}` : categoryFinal,
                sabor_prato: levaCaldo === 'Sim' ? saborCaldo : saborFinal, 
                total_pix: totalPix,
                status_pix: 'Pendente'
            };

            const { error } = await _supabase.from('cadastro_arraia').insert([payload]);

            if (error) {
                alert("Erro ao processar inscrição: " + error.message);
                btn.disabled = false;
                btn.innerText = "Confirmar Cadastro";
            } else {
                alert(`Sucesso!\n\nSeu cadastro foi enviado com sucesso!\n\nValor total para pagamento via PIX: R$ ${totalPix},00\n\nAcompanhe a evolução da mesa coletiva na próxima tela!`);
                formulario.reset();
                window.location.href = "lista.html"; 
            }
        });
    }
});