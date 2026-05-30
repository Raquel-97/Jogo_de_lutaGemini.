//=================================================
// Configurações iniciais do canvas
//=================================================
const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = 1024; 
canvas.height = 576; 

c.fillRect(0, 0, canvas.width, canvas.height);

const saciHTML = document.getElementById('saci');
const curupiraHTML = document.getElementById('curupira');

// Captura das barras de vida do HTML
const barraVidaSaci = document.getElementById('vida-saci');
const barraVidaCurupira = document.getElementById('vida-curupira');

// Captura do elemento do Timer no HTML
const timerHTML = document.querySelector('.timer');

let tempoRestante = 30; // O jogo terá 30 segundos
let idDoTimer; // Guardará o intervalo para podermos pará-lo no fim do jogo.

const gravidade = 0.7; 
let jogoEncerrado = false; 

//=================================================
// Classe Sprite
//=================================================
class Sprite {
    constructor({ posicao, velocidade, cor, eInimigo }) {
        this.posicao = posicao;
        this.velocidade = velocidade;
        this.altura = 150;
        this.largura = 50;
        this.cor = cor || 'red'; 
        this.eInimigo = eInimigo || false; 
        this.lastKey = ''; 

        // Configuração do Ataque
        this.attackBox = {
            posicao: { x: this.posicao.x, y: this.posicao.y },
            largura: 100,
            altura: 50
        };
        this.isAttacking = false;

        // Atributo de vida (100%)
        this.vida = 100;
    }

    draw() {
        // Renderização invisível no canvas (pois o CSS desenha por cima)
        c.fillStyle = 'rgba(0, 0, 0, 0)'; 
        c.fillRect(this.posicao.x, this.posicao.y, this.largura, this.altura);

        // Caixa de ataque sutil em debug (opcional)
        if (this.isAttacking) {
            c.fillStyle = 'rgba(0, 255, 0, 0.2)';
            c.fillRect(this.attackBox.posicao.x, this.attackBox.posicao.y, this.attackBox.largura, this.attackBox.altura);
        }
    }

    update() {
        this.draw();
        
        if (this.eInimigo) {
            this.attackBox.posicao.x = this.posicao.x - this.attackBox.largura + this.largura;
        } else {
            this.attackBox.posicao.x = this.posicao.x;
        }
        this.attackBox.posicao.y = this.posicao.y + 30; 

        this.posicao.x += this.velocidade.x;
        this.posicao.y += this.velocidade.y;

        if (this.posicao.y + this.altura + this.velocidade.y >= canvas.height) {
            this.velocidade.y = 0;
            this.posicao.y = canvas.height - this.altura; 
        } else {
            this.velocidade.y += gravidade;
        }
    }

    atacar() {
        this.isAttacking = true;
        setTimeout(() => {
            this.isAttacking = false;
        }, 100);
    }
}

function checarColisaoRetangular({ retangulo1, retangulo2 }) {
    return (
        retangulo1.attackBox.posicao.x + retangulo1.attackBox.largura >= retangulo2.posicao.x && 
        retangulo1.attackBox.posicao.x <= retangulo2.posicao.x + retangulo2.largura &&        
        retangulo1.attackBox.posicao.y + retangulo1.attackBox.altura >= retangulo2.posicao.y && 
        retangulo1.attackBox.posicao.y <= retangulo2.posicao.y + retangulo2.altura            
    );
}

// Criando os guerreiros mitológicos
const jogador = new Sprite({
    posicao: { x: 150, y: 100 },
    velocidade: { x: 0, y: 0 },
    eInimigo: false
});

const inimigo = new Sprite({
    posicao: { x: 800, y: 100 },
    velocidade: { x: 0, y: 0 },
    eInimigo: true 
});

const keys = {
    a: { pressed: false },
    d: { pressed: false },
    ArrowRight: { pressed: false },
    ArrowLeft: { pressed: false }
};

//=================================================
// Loop Principal de Animação (Versão Limpa)
//=================================================
function animate() {
    if (jogoEncerrado) return;

    window.requestAnimationFrame(animate);
    
    // 1. Limpa a tela deixando o fundo transparente
    c.clearRect(0, 0, canvas.width, canvas.height); 
    
    // 2. Atualiza a física dos personagens
    jogador.update();
    inimigo.update();

    // 3. Sincronização das Divs CSS do Saci e Curupira
    if (saciHTML) saciHTML.style.transform = `translate(${jogador.posicao.x}px, ${jogador.posicao.y}px)`;
    if (curupiraHTML) curupiraHTML.style.transform = `translate(${inimigo.posicao.x}px, ${inimigo.posicao.y}px)`;
    
    // 4. Gerenciamento de Dano e Colisões Dinâmicas
    // Saci ataca Curupira
    if (checarColisaoRetangular({ retangulo1: jogador, retangulo2: inimigo }) && jogador.isAttacking) {
        jogador.isAttacking = false; 
        inimigo.vida -= 20; 
        
        if (barraVidaCurupira) barraVidaCurupira.style.width = inimigo.vida + '%';
        
        if (inimigo.vida <= 0) {
            exibirFimDeJogo("SACI");
        }
    }

    // Curupira ataca Saci
    if (checarColisaoRetangular({ retangulo1: inimigo, retangulo2: jogador }) && inimigo.isAttacking) {
        inimigo.isAttacking = false;
        jogador.vida -= 20; 
        
        if (barraVidaSaci) barraVidaSaci.style.width = jogador.vida + '%';
        
        if (jogador.vida <= 0) {
            exibirFimDeJogo("CURUPIRA");
        }
    }

    // Comandos de movimentação originais
    jogador.velocidade.x = 0;
    inimigo.velocidade.x = 0;

    if (keys.a.pressed && jogador.lastKey === 'a') jogador.velocidade.x = -5;
    else if (keys.d.pressed && jogador.lastKey === 'd') jogador.velocidade.x = 5;

    if (keys.ArrowLeft.pressed && inimigo.lastKey === 'ArrowLeft') inimigo.velocidade.x = -5;
    else if (keys.ArrowRight.pressed && inimigo.lastKey === 'ArrowRight') inimigo.velocidade.x = 5;
}

// Inicializa o ciclo do jogo
animate();
diminuirTimer();

//=================================================
// Captura do Teclado (Event Listeners)
//=================================================
window.addEventListener('keydown', (event) => {
    switch (event.key) {
        // Saci
        case 'd': keys.d.pressed = true; jogador.lastKey = 'd'; break;
        case 'a': keys.a.pressed = true; jogador.lastKey = 'a'; break;
        case 'w': 
            if (jogador.posicao.y + jogador.altura >= canvas.height) jogador.velocidade.y = -20;
            break;
        case ' ': jogador.atacar(); break;

        // Curupira
        case 'ArrowRight': keys.ArrowRight.pressed = true; inimigo.lastKey = 'ArrowRight'; break;
        case 'ArrowLeft': keys.ArrowLeft.pressed = true; inimigo.lastKey = 'ArrowLeft'; break;
        case 'ArrowUp': 
            if (inimigo.posicao.y + inimigo.altura >= canvas.height) inimigo.velocidade.y = -20;
            break;
        case 'Enter': inimigo.atacar(); break;
    }
});

window.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'd': keys.d.pressed = false; break;
        case 'a': keys.a.pressed = false; break;
        case 'ArrowRight': keys.ArrowRight.pressed = false; break;
        case 'ArrowLeft': keys.ArrowLeft.pressed = false; break;
    }
});

//=================================================
// Tela de Fim de Jogo
//=================================================
function exibirFimDeJogo(vencedor) {
    jogoEncerrado = true;
    c.fillStyle = 'rgba(0, 0, 0, 0.7)';
    c.fillRect(0, 0, canvas.width, canvas.height);

    c.fillStyle = 'yellow';
    c.font = 'bold 50px monospace';
    c.textAlign = 'center';
    c.fillText(`${vencedor} VENCEU!`, canvas.width / 2, canvas.height / 2);

    c.fillStyle = 'white';
    c.font = '20px monospace';
    c.fillText("Pressione F5 para jogar novamente", canvas.width / 2, canvas.height / 2 + 60);
    c.textAlign = 'left'; 
}

function diminuirTimer() {
    if (jogoEncerrado) return;// Para evitar que o timer continue após o jogo terminar.

    if (tempoRestante > 0) {// Verifica se ainda há tempo restante.
        idDoTimer = setTimeout(diminuirTimer, 1000); // Chama a função novamente após 1 segundo.
        tempoRestante--;// Decrementa o tempo restante a cada segundo.
        
        if (timerHTML) timerHTML.innerText = tempoRestante;// Atualiza o display do timer no HTML.
    }

    if (tempoRestante === 0) {// Quando o tempo acabar, determina o vencedor com base na vida restante.
        determinarVencedorPorTempo();// Chama a função para determinar o vencedor por tempo.
    }
}

function determinarVencedorPorTempo() {// Função para determinar o vencedor quando o tempo acabar.
    jogoEncerrado = true;// Marca o jogo como encerrado para evitar mais atualizações.
    
    c.fillStyle = 'rgba(0, 0, 0, 0.7)';// Desenha uma camada semi-transparente para destacar a mensagem de fim de jogo.
    c.fillRect(0, 0, canvas.width, canvas.height);// Prepara o estilo do texto para a mensagem de fim de jogo.

    c.fillStyle = 'yellow';
    c.font = 'bold 50px monospace';
    c.textAlign = 'center';

    if (jogador.vida === inimigo.vida) {// Se ambos tiverem a mesma vida, é um empate.
        c.fillText("EMPATE!", canvas.width / 2, canvas.height / 2);// Se o jogador tiver mais vida, ele vence por tempo.
    } else if (jogador.vida > inimigo.vida) {// Se o inimigo tiver mais vida, ele vence por tempo.
        c.fillText("SACI VENCEU POR TEMPO!", canvas.width / 2, canvas.height / 2);// Se o inimigo tiver mais vida, ele vence por tempo.
    } else {
        c.fillText("CURUPIRA VENCEU POR TEMPO!", canvas.width / 2, canvas.height / 2);// Exibe a mensagem de fim de jogo e instrução para reiniciar.
    }

    c.fillStyle = 'white';
    c.font = '20px monospace';
    c.fillText("Pressione F5 para jogar novamente", canvas.width / 2, canvas.height / 2 + 60);
    c.textAlign = 'left';
}