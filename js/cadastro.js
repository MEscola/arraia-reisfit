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

// Interface: Exibe ou esconde o bloco confidencial de parceria
function controlarFluxoPatrocinio() {
    const checkbox = document.getElementById('patrocinador');
    const grupoValor = document.getElementById('grupo-valor-doacao');
    const inputCodigo = document.getElementById('codigo_parceiro');
    const avisoValido = document.getElementById('aviso-parceiro-valido');

    if (!checkbox || !grupoValor) return;

    if (checkbox.checked) {
        grupoValor.classList.remove('hidden');
    } else {
        grupoValor.classList.add('hidden');
        if (inputCodigo) inputCodigo.value = '';
        if (avisoValido) avisoValido.classList.add('hidden');
    }
    calcularPix();
}

// Lógica: Retorna qual o nível do código digitado ('50', '100' ou 'invalido')
function obterNivelParceria() {
    const inputCodigo = document.getElementById('codigo_parceiro');
    if (!inputCodigo) return 'invalido';

    const codigoTratado = inputCodigo.value.toLowerCase().trim();

    if (codigoTratado === "reisfit50") return "50";
    if (codigoTratado === "reisfit100") return "100";

    return "invalido";
}

// Interface: Mostra o aviso de sucesso apenas se o código for válido
function validarCodigoParceiro() {
    const avisoValido = document.getElementById('aviso-parceiro-valido');
    if (!avisoValido) return;

    const nivel = obterNivelParceria();

    if (nivel !== "invalido") {
        avisoValido.classList.remove('hidden');
    } else {
        avisoValido.classList.add('hidden');
    }
    calcularPix();
}

// Interface: Ajusta dinamicamente a exibição de inputs baseados em Grupo e Caldo
function ajustarFluxoGrupo() {
    const tipoGrupoField = document.getElementById('tipo_grupo');
    const levaCaldoField = document.getElementById('leva_caldo');
    
    const fluxoSolteiro = document.getElementById('fluxo-solteiro');
    const fluxoFamilia = document.getElementById('fluxo-familia');
    const blocoAcompanhantes = document.getElementById('campos-acompanhantes');
    
    const campoSaborSalgadoFamilia = document.getElementById('sabor_salgado_familia')?.closest('.form-group');

    if (!tipoGrupoField || !fluxoSolteiro || !fluxoFamilia || !blocoAcompanhantes) return;

    const isSolteiro = tipoGrupoField.value === "Solteiro";
    const levaCaldo = levaCaldoField ? levaCaldoField.value === "Sim" : false;

    if (isSolteiro) {
        fluxoFamilia.classList.add('hidden');
        blocoAcompanhantes.classList.add('hidden');
        
        // Regra do Solteiro: Se leva caldo, não leva prato nenhum
        if (levaCaldo) {
            fluxoSolteiro.classList.add('hidden');
        } else {
            fluxoSolteiro.classList.remove('hidden');
        }
        
        // Zera os acompanhantes para o cálculo correto do PIX do Solteiro
        if(document.getElementById('qtd_conjuge')) document.getElementById('qtd_conjuge').value = 0;
        if(document.getElementById('qtd_amigos')) document.getElementById('qtd_amigos').value = 0;
        if(document.getElementById('criancas')) document.getElementById('criancas').value = '';
    } else {
        fluxoSolteiro.classList.add('hidden');
        fluxoFamilia.classList.remove('hidden');
        blocoAcompanhantes.classList.remove('hidden');
        
        // Regra da Família: Se leva caldo, oculta apenas o campo do Prato Salgado
        if (campoSaborSalgadoFamilia) {
            if (levaCaldo) {
                campoSaborSalgadoFamilia.classList.add('hidden');
                document.getElementById('sabor_salgado_familia').value = ''; 
            } else {
                campoSaborSalgadoFamilia.classList.remove('hidden');
            }
        }
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

// LÓGICA DE CALDOS: Reorganização e contagem baseada no banco de dados
async function controlarOpcoesCaldos() {
    const levaCaldoField = document.getElementById('leva_caldo');
    const grupoCaldo = document.getElementById('grupo-sabores-caldo');
    const selectCaldo = document.getElementById('sabor_caldo');
    
    if (!levaCaldoField || !grupoCaldo || !selectCaldo) return;

    ajustarFluxoGrupo();

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
        selectCaldo.innerHTML = '<option value="">Erro ao carregar o banco</option>';
        return;
    }

    let mapaCaldos = {};
    CALDOS_OFICIAIS.forEach(c => mapaCaldos[c] = 0);

    if (inscritos && Array.isArray(inscritos) && inscritos.length > 0) {
        inscritos.forEach(item => {
            if (item.sabor_prato) {
                CALDOS_OFICIAIS.forEach(caldo => {
                    if (item.sabor_prato.includes(caldo)) {
                        const conjuge = Number(item.qtd_conjuge) || 0;
                        const amigos = Number(item.qtd_amigos) || 0;
                        mapaCaldos[caldo] += (1 + conjuge + amigos);
                    }
                });
            }
        });
    }

    const tipoGrupo = document.getElementById('tipo_grupo')?.value || "Solteiro";
    const ehGrupo = tipoGrupo !== "Solteiro";

    selectCaldo.innerHTML = '<option value="">Selecione um caldo...</option>';
    let temCaldoDisponivel = false;

    CALDOS_OFICIAIS.forEach(caldo => {
        const vagasOcupadas = mapaCaldos[caldo];
        const LIMITE_CALDO = 3; 

        if (ehGrupo) {
            selectCaldo.innerHTML += `<option value="${caldo}">${caldo} (${vagasOcupadas} reservados - Liberado p/ Família)</option>`;
            temCaldoDisponivel = true;
        } else {
            if (vagasOcupadas < LIMITE_CALDO) {
                const restoVagas = LIMITE_CALDO - vagasOcupadas;
                selectCaldo.innerHTML += `<option value="${caldo}">${caldo} (${restoVagas} vaga${restoVagas > 1 ? 's' : ''} restante${restoVagas > 1 ? 's' : ''})</option>`;
                temCaldoDisponivel = true;
            } else {
                selectCaldo.innerHTML += `<option value="${caldo}" disabled style="color: #666;">${caldo} (Esgotado para inscrições individuais)</option>`;
            }
        }
    });

    if (!temCaldoDisponivel && selectCaldo.options.length <= 1) {
        selectCaldo.innerHTML = '<option value="">Busque a coordenação para ajustar as vagas dos caldos.</option>';
    }
}

// Regra de Negócio Dinâmica: Aplica descontos baseados nos tokens de parceria
function calcularPix() {
    const patrocinadorCheckbox = document.getElementById('patrocinador');
    const labelPix = document.getElementById('label-pix');
    const btnCopiar = document.getElementById('btn-copiar-pix');
    
    const qtdConjuges = Number(document.getElementById('qtd_conjuge')?.value) || 0;
    const qtdAmigos = Number(document.getElementById('qtd_amigos')?.value) || 0;

    if (!labelPix) return 0;

    let entradaTitular = 15;
    let taxaConjuge = 15;
    let taxaAmigo = 20;

    if (patrocinadorCheckbox && patrocinadorCheckbox.checked) {
        const nivel = obterNivelParceria();

        if (nivel === "100") {
            entradaTitular = 0;
            taxaConjuge = 0;
            taxaAmigo = 0;
        } else if (nivel === "50") {
            entradaTitular = 0;
        }
    }

    const total = entradaTitular + (qtdConjuges * taxaConjuge) + (qtdAmigos * taxaAmigo);
    const tipoGrupo = document.getElementById('tipo_grupo')?.value || "Solteiro";
    const nivelParceria = obterNivelParceria();
    
    if (total === 0 && patrocinadorCheckbox && patrocinadorCheckbox.checked) {
        if (nivelParceria === "100" || (nivelParceria === "50" && tipoGrupo === "Solteiro")) {
            labelPix.innerText = "Parceiro Isento";
            if (btnCopiar) btnCopiar.classList.add('hidden'); 
        } else {
            labelPix.innerText = `R$ ${total},00`;
            if (btnCopiar) btnCopiar.classList.remove('hidden'); 
        }
    } else {
        labelPix.innerText = `R$ ${total},00`;
        if (btnCopiar) btnCopiar.classList.remove('hidden'); 
    }

    return total;
}

// Inicializador Único de Ciclo de Vida do DOM
window.addEventListener('DOMContentLoaded', () => {
    ajustarFluxoGrupo();
    calcularPix();

    const campoConjuges = document.getElementById('qtd_conjuge');
    const campoAmigos = document.getElementById('qtd_amigos');
    const selectTipoGrupo = document.getElementById('tipo_grupo');
    const selectLevaCaldo = document.getElementById('leva_caldo');
    const inputCodigoParceiro = document.getElementById('codigo_parceiro');

    if (campoConjuges) {
        campoConjuges.addEventListener('input', () => { calcularPix(); controlarOpcoesCaldos(); });
    }
    if (campoAmigos) {
        campoAmigos.addEventListener('input', () => { calcularPix(); controlarOpcoesCaldos(); });
    }
    if (selectTipoGrupo) {
        selectTipoGrupo.addEventListener('change', () => { ajustarFluxoGrupo(); controlarOpcoesCaldos(); });
    }
    if (selectLevaCaldo) {
        selectLevaCaldo.addEventListener('change', () => { controlarOpcoesCaldos(); });
    }
    if (inputCodigoParceiro) {
        inputCodigoParceiro.addEventListener('input', () => { validarCodigoParceiro(); });
    }

    // FORMULÁRIO DE ENVIO PARA O BANCO (COM TRAVAS DE NOME COMPOSTO E DUPLICIDADE)
    const formulario = document.getElementById('form-inscricao');
    if (formulario) {
        formulario.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('btn-enviar');
            btn.disabled = true;
            btn.innerText = "Processando inscrição, aguarde...";

            const nomeOriginal = document.getElementById('nome').value;
            const nomeDigitado = nomeOriginal.trim();
            const tipoGrupo = document.getElementById('tipo_grupo').value;
            const levaCaldo = document.getElementById('leva_caldo').value;
            const saborCaldo = document.getElementById('sabor_caldo').value;
            const qtdConjuges = Number(document.getElementById('qtd_conjuge').value) || 0;
            const qtdAmigos = Number(document.getElementById('qtd_amigos').value) || 0;

            // TRAVA 1: EXIGÊNCIA DE NOME COMPOSTO (NOME E SOBRENOME OU APELIDO)
            const partesDoNome = nomeDigitado.split(/\s+/).filter(part => part.length > 0);

            if (partesDoNome.length < 2) {
                alert("Atenção!\n\nPor favor, insira o seu Nome e Sobrenome (or seu apelido do Box) para prosseguir.\n\nExemplos: 'Elaine Silva' ou 'Elaine Chocolate'.\n\nIsso evita que seu cadastro seja confundido com homônimos.");
                btn.disabled = false;
                btn.innerText = "Confirmar Cadastro";
                return; 
            }

            // TRAVA 2: TRAVA DE DUPLICIDADE NO BANCO DE DADOS
            const { data: cadastroExistente, error: errorBusca } = await _supabase
                .from('cadastro_arraia')
                .select('id')
                .ilike('nome', nomeDigitado);

            if (errorBusca) {
                console.error("Erro ao verificar duplicidade:", errorBusca);
            }

            if (cadastroExistente && cadastroExistente.length > 0) {
                alert(`Atenção!\n\nJá existe uma inscrição cadastrada com o nome "${nomeDigitado}".\n\nPara evitar dados duplicados na contabilidade do caixa, o sistema bloqueou este envio.\n\nCaso precise alterar seus dados, procure a equipe do Financeiro.`);
                btn.disabled = false;
                btn.innerText = "Confirmar Cadastro";
                return; 
            }

            // Validação do caldo
            if (levaCaldo === 'Sim' && !saborCaldo) {
                alert("Por favor, selecione um sabor de caldo disponível!");
                btn.disabled = false;
                btn.innerText = "Confirmar Cadastro";
                return;
            }

            let categoryFinal = "";
            let saborFinal = "";

            if (tipoGrupo === "Solteiro") {
                if (levaCaldo === 'Sim') {
                    categoryFinal = "Caldo 🥣";
                    saborFinal = saborCaldo;
                } else {
                    categoryFinal = document.getElementById('prato_solteiro').value;
                    saborFinal = document.getElementById('sabor_prato_solteiro').value || "Não especificado";
                    
                    if (!categoryFinal) {
                        alert("Por favor, selecione se trará um prato Doce ou Salgado!");
                        btn.disabled = false;
                        btn.innerText = "Confirmar Cadastro";
                        return;
                    }
                }
            } else {
                const doce = document.getElementById('sabor_doce_familia').value || "Doce não especificado";
                
                if (levaCaldo === 'Sim') {
                    categoryFinal = "Caldo (Salgado) e Prato Doce 🥣🍫";
                    saborFinal = `Caldo: ${saborCaldo} | Doce: ${doce}`;
                } else {
                    const salgado = document.getElementById('sabor_salgado_familia').value || "Salgado não especificado";
                    categoryFinal = "Doce e Salgado 🍫🥐";
                    saborFinal = `Doce: ${doce} | Salgado: ${salgado}`;
                }
            }

            const totalPix = calcularPix();
            const checkboxAtivo = document.getElementById('patrocinador')?.checked;
            const nivelParceria = checkboxAtivo ? obterNivelParceria() : "invalido";

            let statusPixFinal = "Pendente";
            if (nivelParceria === "100") {
                statusPixFinal = "Box Friendly (Isenção Total)";
            } else if (nivelParceria === "50") {
                statusPixFinal = "Box Friendly (Isenção Titular)";
            }

            const payload = {
                nome: nomeDigitado,
                tipo_grupo: tipoGrupo,
                qtd_conjuge: qtdConjuges,
                qtd_amigos: qtdAmigos,
                criancas: document.getElementById('criancas').value,
                leva_caldo: levaCaldo,
                categoria_prato: categoryFinal,
                sabor_prato: saborFinal, 
                total_pix: totalPix,
                status_pix: statusPixFinal
            };

            const { error } = await _supabase.from('cadastro_arraia').insert([payload]);

            if (error) {
                alert("Erro ao processar inscrição: " + error.message);
                btn.disabled = false;
                btn.innerText = "Confirmar Cadastro";
            } else {
                alert(`Sucesso!\n\nSeu cadastro foi enviado com sucesso!\n\nValor total para pagamento via PIX: ${totalPix === 0 && statusPixFinal.includes("Total") ? "Isento" : "R$ " + totalPix + ",00"}`);
                formulario.reset();
                window.location.href = "lista.html"; 
            }
        });
    }
}); 

// CHAVE PIX
function copiarChavePixRapido() {
    const chavePix = "COLOQUE_A_CHAVE_PIX_AQUI"; 
    
    navigator.clipboard.writeText(chavePix).then(() => {
        const btn = document.getElementById('btn-copiar-pix');
        if (btn) {
            btn.innerText = "Chave Copiada!";
            btn.style.backgroundColor = "#4CAF50"; 
            
            setTimeout(() => {
                btn.innerText = "Copiar Chave PIX";
                btn.style.backgroundColor = "#FF9800";
            }, 3000);
        }
    }).catch(err => {
        alert("Não foi possível copiar automaticamente. Use a chave: " + chavePix);
    });
}