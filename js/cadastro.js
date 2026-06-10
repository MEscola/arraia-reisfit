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

// Interface: Exibe ou esconde o input de valor da doação
function controlarFluxoPatrocinio() {
    const checkbox = document.getElementById('patrocinador');
    const grupoValor = document.getElementById('grupo-valor-doacao');
    const inputValor = document.getElementById('valor_doacao');

    if (!checkbox || !grupoValor) return;

    if (checkbox.checked) {
        grupoValor.classList.remove('hidden');
    } else {
        grupoValor.classList.add('hidden');
        if (inputValor) inputValor.value = ''; // Limpa o valor digitado se desligar
    }
    calcularPix();
}

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

    const { data: inscritos, error } = await _supabase
        .from('cadastro_arraia')
        .select('sabor_prato, qtd_conjuge, qtd_amigos');

    if (error) {
        console.error("Erro Supabase Caldos:", error);
        selectCaldo.innerHTML = '<option value="">⚠️ Erro ao carregar o banco</option>';
        return;
    }

    let mapaCaldos = {};
    CALDOS_OFICIAIS.forEach(c => mapaCaldos[c] = 0);

    if (inscritos && Array.isArray(inscritos) && inscritos.length > 0) {
        inscritos.forEach(item => {
            if (item.sabor_prato && mapaCaldos[item.sabor_prato] !== undefined) {
                const conjuge = Number(item.qtd_conjuge) || 0;
                const amigos = Number(item.qtd_amigos) || 0;
                mapaCaldos[item.sabor_prato] += (1 + conjuge + amigos);
            }
        });
    }

    const qtdConjugesAtuais = Number(document.getElementById('qtd_conjuge')?.value) || 0;
    const qtdAmigosAtuais = Number(document.getElementById('qtd_amigos')?.value) || 0;
    const tamanhoGrupoAtual = 1 + qtdConjugesAtuais + qtdAmigosAtuais;

    selectCaldo.innerHTML = '<option value="">Selecione um caldo...</option>';
    let temCaldoDisponivel = false;

    CALDOS_OFICIAIS.forEach(caldo => {
        const vagasOcupadas = mapaCaldos[caldo];
        const restoVagas = 3 - vagasOcupadas;

        if (restoVagas >= tamanhoGrupoAtual) {
            selectCaldo.innerHTML += `<option value="${caldo}">${caldo} (${vagasOcupadas}/3 ocupados)</option>`;
            temCaldoDisponivel = true;
        } else {
            selectCaldo.innerHTML += `<option value="${caldo}">${caldo} ⚠️ (${vagasOcupadas}/3 - Grupo excede o limite)</option>`;
            temCaldoDisponivel = true;
        }
    });

    if (!temCaldoDisponivel && selectCaldo.options.length <= 1) {
        selectCaldo.innerHTML = '<option value="">⚠️ Busque a coordenação para ajustar as vagas dos caldos.</option>';
    }
}

// Regra de Negócio Dinâmica: Aplica isenções escalonadas baseadas na doação do patrocinador
function calcularPix() {
    //patrocinador no index está como "Sou Box Friendly", mas a lógica de cálculo continua a mesma, apenas o nome do checkbox mudou para refletir a nova abordagem de patrocínio coletivo. O ID do checkbox permanece 'patrocinador' para manter a consistência com o código existente.
    const patrocinadorCheckbox = document.getElementById('patrocinador');
    const valorDoacaoField = document.getElementById('valor_doacao');
    const labelPix = document.getElementById('label-pix');
    
    const qtdConjuges = Number(document.getElementById('qtd_conjuge')?.value) || 0;
    const qtdAmigos = Number(document.getElementById('qtd_amigos')?.value) || 0;

    if (!labelPix) return 0;

    let valorDoacao = 0;
    let entradaTitular = 15;
    let taxaConjuge = 15;
    let taxaAmigo = 20;

    // Se o switch estiver ligado, lê o valor da doação digitado
    if (patrocinadorCheckbox && patrocinadorCheckbox.checked) {
        valorDoacao = Number(valorDoacaoField?.value) || 0;

        // Regra de escalonamento de benefícios
        if (valorDoacao >= 100) {
            // A partir de R$ 100: Isenção TOTAL (família inteira zera as taxas de entrada)
            entradaTitular = 0;
            taxaConjuge = 0;
            taxaAmigo = 0;
        } else if (valorDoacao >= 50) {
            // Entre R$ 50 e R$ 99: Isenção individual apenas do titular
            entradaTitular = 0;
        }
    }

    // Soma final: A doação em dinheiro + taxas residuais do grupo
    const total = valorDoacao + entradaTitular + (qtdConjuges * taxaConjuge) + (qtdAmigos * taxaAmigo);
    
    labelPix.innerText = `R$ ${total},00`;
    return total;
}

// Inicializador Único de Ciclo de Vida: Executa TUDO com proteção após o DOM estar desenhado na tela
window.addEventListener('DOMContentLoaded', () => {
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
                qtd_conjuge: qtdConjuges,
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