// Script para o site do Capitão Animais

document.addEventListener('DOMContentLoaded', function() {
    // Animação suave para links de navegação
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Botão de compra - simulação de ação
    const botaoComprar = document.querySelector('.botao-comprar');
    if (botaoComprar) {
        botaoComprar.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Em breve você poderá comprar o livro "Capitão Animais" diretamente pelo site! Por enquanto, entre em contato pelo email fornecido no rodapé.');
        });
    }

    // Efeito de destaque nos cards de personagens
    const cardsPersonagens = document.querySelectorAll('.card-personagem');
    cardsPersonagens.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f9f9f9';
        });
        card.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'white';
        });
    });

    // Atualização do ano no copyright
    const anoAtual = new Date().getFullYear();
    const elementoCopyright = document.querySelector('.copyright p');
    if (elementoCopyright) {
        elementoCopyright.textContent = `© ${anoAtual} Capitão Animais - Todos os direitos reservados`;
    }
});