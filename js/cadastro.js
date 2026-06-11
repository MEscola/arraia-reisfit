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
                document.getElementById('sabor_salgado_familia').value = ''; // Limpa se estiver oculto
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

// LÓGICA DE CALDOS: Busca no banco e monta o select apenas com caldos que têm vagas
async function controlarOpcoesCaldos() {
    const levaCaldoField = document.getElementById('leva_caldo');
    const grupoCaldo = document.getElementById('grupo-sabores-caldo');
    const selectCaldo = document.getElementById('sabor_caldo');
    
    if (!levaCaldoField || !grupoCaldo || !selectCaldo) return;

    // Dispara a reorganização visual dos pratos reativamente baseada na escolha do caldo
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

// Regra de Negócio Dinâmica: Aplica descontos confidenciais baseados nos tokens de parceria
function calcularPix() {
    const patrocinadorCheckbox = document.getElementById('patrocinador');
    const labelPix = document.getElementById('label-pix');
    const btnCopiar = document.getElementById('btn-copiar-pix');
    
    const qtdConjuges = Number(document.getElementById('qtd_conjuge')?.value) || 0;
    const qtdAmigos = Number(document.getElementById('qtd_amigos')?.value) || 0;

    if (!labelPix) return 0;

    // Valores padrão cobrados de alunos normais
    let entradaTitular = 15;
    let taxaConjuge = 15;
    let taxaAmigo = 20;

    // Se o switch estiver ligado, checa a palavra-chave secreta digitada
    if (patrocinadorCheckbox && patrocinadorCheckbox.checked) {
        const nivel = obterNivelParceria();

        if (nivel === "100") {
            // Isenção TOTAL (Titular e Família inteira zerados)
            entradaTitular = 0;
            taxaConjuge = 0;
            taxaAmigo = 0;
        } else if (nivel === "50") {
            // Isenção INDIVIDUAL (Apenas o Titular zera)
            entradaTitular = 0;
        }
    }

    const total = entradaTitular + (qtdConjuges * taxaConjuge) + (qtdAmigos * taxaAmigo);
    
    // Captura o tipo de grupo selecionado na tela de forma correta
    const tipoGrupo = document.getElementById('tipo_grupo')?.value || "Solteiro";
    const nivelParceria = obterNivelParceria();
    
    // REGRA UNIFICADA: Se deu zero e o switch está ligado, valida os cenários de Isenção
    if (total === 0 && patrocinadorCheckbox && patrocinadorCheckbox.checked) {
        
        if (nivelParceria === "100" || (nivelParceria === "50" && tipoGrupo === "Solteiro")) {
            labelPix.innerText = "Parceiro Isento ✨";
            if (btnCopiar) btnCopiar.classList.add('hidden'); // Esconde o botão se for 100% isento
        } else {
            labelPix.innerText = `R$ ${total},00`;
            if (btnCopiar) btnCopiar.classList.remove('hidden'); // Mostra se tiver valor residual
        }

    } else {
        // Se o valor for maior que zero (ex: aluno comum ou nível 50 com acompanhantes pagantes)
        labelPix.innerText = `R$ ${total},00`;
        if (btnCopiar) btnCopiar.classList.remove('hidden'); // Garante que o botão aparece para quem precisa pagar
    }

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
    const inputCodigoParceiro = document.getElementById('codigo_parceiro');

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
    // FIX CRÍTICO: Dispara o recálculo do PIX instantaneamente enquanto o usuário digita a palavra chave
    if (inputCodigoParceiro) {
        inputCodigoParceiro.addEventListener('input', () => { validarCodigoParceiro(); });
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
                nome: document.getElementById('nome').value,
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
                alert(`Sucesso!\n\nSeu cadastro foi enviado com sucesso!\n\nValor total para pagamento via PIX: ${totalPix === 0 && statusPixFinal.includes("Total") ? "Isento ✨" : "R$ " + totalPix + ",00"}\n\nAcompanhe a evolução da mesa coletiva na próxima tela!`);
                formulario.reset();
                window.location.href = "lista.html"; 
            }
        });
    }

    // Função para copiar a chave PIX com um único clique no celular
function copiarChavePixRapido() {
    const chavePix = "recepcao@reisfit.com.br";
    
    navigator.clipboard.writeText(chavePix).then(() => {
        const btn = document.getElementById('btn-copiar-pix');
        if (btn) {
            btn.innerText = "✨ Chave Copiada!";
            btn.style.backgroundColor = "#4CAF50"; // Muda para verde para dar o feedback de sucesso
            
            // Volta para o texto padrão com a cor laranja depois de 3 segundos
            setTimeout(() => {
                btn.innerText = "📋 Copiar Chave PIX";
                btn.style.backgroundColor = "#FF9800";
            }, 3000);
        }
    }).catch(err => {
        // Caso o navegador do celular bloqueie o recurso de cópia automática por segurança
        alert("Não foi possível copiar automaticamente. Use a chave: " + chavePix);
    });
}
});