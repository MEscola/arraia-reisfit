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
    
    if (!tipoGrupoField || !fluxoSolteiro || !fluxoFamilia) return;

    if (tipoGrupoField.value === "Solteiro") {
        fluxoSolteiro.classList.remove('hidden');
        fluxoFamilia.classList.add('hidden');
    } else {
        fluxoSolteiro.classList.add('hidden');
        fluxoFamilia.classList.remove('hidden');
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

    // Puxa as inscrições existentes do Supabase com tratamento de segurança
    const { data: inscritos, error } = await _supabase
        .from('inscricoes_arraia')
        .select('sabor_prato, qtd_conjuges, qtd_amigos');

    if (error) {
        console.error("Erro Supabase Caldos:", error);
        selectCaldo.innerHTML = '<option value="">⚠️ Erro ao carregar o banco</option>';
        return;
    }

    // Inicializa o contador zerado para cada sabor oficial
    let mapaCaldos = {};
    CALDOS_OFICIAIS.forEach(c => mapaCaldos[c] = 0);

    // Contabiliza de forma segura, tratando possíveis valores nulos ou vazios vindos do banco
    if (inscritos && Array.isArray(inscritos)) {
        inscritos.forEach(item => {
            if (item.sabor_prato && mapaCaldos[item.sabor_prato] !== undefined) {
                const conjuges = Number(item.qtd_conjuges) || 0;
                const amigos = Number(item.qtd_amigos) || 0;
                mapaCaldos[item.sabor_prato] += (1 + conjuges + amigos);
            }
        });
    }

    // Calcula o tamanho do grupo que está tentando se inscrever agora na tela
    const qtdConjugesAtuais = Number(document.getElementById('qtd_conjuges')?.value) || 0;
    const qtdAmigosAtuais = Number(document.getElementById('qtd_amigos')?.value) || 0;
    const tamanhoGrupoAtual = 1 + qtdConjugesAtuais + qtdAmigosAtuais;

    // Monta o seletor mostrando apenas os caldos liberados pelo limite de 3 pessoas físicas
    selectCaldo.innerHTML = '<option value="">Selecione um caldo...</option>';
    let temCaldoDisponivel = false;

    CALDOS_OFICIAIS.forEach(caldo => {
        const vagasOcupadas = mapaCaldos[caldo];
        // Se couber o grupo atual sem ultrapassar 3 pessoas físicas no total dividindo o caldo, exibe a opção
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
    
    // Regra matemática estabelecida: Titular (0 ou 15) + Cônjuges (15 cada) + Amigos (20 cada)
    const total = entradaTitular + (qtdConjuges * 15) + (qtdAmigos * 20);
    
    // Updates the visual container in real time
    labelPix.innerText = `R$ ${total},00`;
    return total;
}

// Inicializador Único de Ciclo de Vida: Executa TUDO com proteção após o DOM estar desenhado na tela
window.addEventListener('DOMContentLoaded', () => {
    // 1. Alinha a interface inicial e calcula o primeiro valor (R$ 15,00)
    ajustarFluxoGrupo();
    calcularPix();

    // 2. Protege as escutas reativas de input contra erros de carregamento 'null'
    const campoConjuges = document.getElementById('qtd_conjuges');
    const campoAmigos = document.getElementById('qtd_amigos');

    if (campoConjuges) {
        campoConjuges.addEventListener('input', () => { calcularPix(); controlarOpcoesCaldos(); });
    }
    if (campoAmigos) {
        campoAmigos.addEventListener('input', () => { calcularPix(); controlarOpcoesCaldos(); });
    }

    // 3. Processa e intercepta a submissão do formulário com segurança
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
                // Regra Família: Traz os dois pratos de forma compulsória
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

            const { error } = await _supabase.from('inscricoes_arraia').insert([payload]);

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