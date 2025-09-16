// Script moderno para a landing page do Capitão Animais

document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const header = document.querySelector('header');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navLinksItems = document.querySelectorAll('.nav-links a');
    const revealElements = document.querySelectorAll('.reveal');
    
    // Header fixo com mudança de estilo ao rolar
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Revelar elementos ao rolar
        revealOnScroll();
    });
    
    // Função para revelar elementos ao rolar
    function revealOnScroll() {
        for (let i = 0; i < revealElements.length; i++) {
            const windowHeight = window.innerHeight;
            const elementTop = revealElements[i].getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < windowHeight - elementVisible) {
                revealElements[i].classList.add('active');
            }
        }
    }
    
    // Iniciar revelação de elementos
    revealOnScroll();
    
    // Menu mobile
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.classList.toggle('no-scroll');
        });
    }
    
    // Fechar menu ao clicar em um link
    navLinksItems.forEach(item => {
        item.addEventListener('click', function() {
            if (hamburger.classList.contains('active')) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.classList.remove('no-scroll');
            }
        });
    });
    
    // Rolagem suave para links de navegação
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Efeito de partículas no fundo (opcional)
    const particlesContainer = document.getElementById('particles');
    if (particlesContainer) {
        createParticles();
    }
    
    function createParticles() {
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            // Posição aleatória
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            particle.style.left = `${posX}%`;
            particle.style.top = `${posY}%`;
            
            // Tamanho aleatório
            const size = Math.random() * 15 + 5;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Opacidade aleatória
            const opacity = Math.random() * 0.5 + 0.1;
            particle.style.opacity = opacity;
            
            // Animação aleatória
            const duration = Math.random() * 20 + 10;
            particle.style.animation = `float ${duration}s infinite ease-in-out`;
            
            // Atraso aleatório
            const delay = Math.random() * 5;
            particle.style.animationDelay = `${delay}s`;
            
            particlesContainer.appendChild(particle);
        }
    }
    
    // Inicializar carrossel de depoimentos (se existir)
    const testimonialsSlider = document.querySelector('.testimonials-slider');
    if (testimonialsSlider) {
        let currentSlide = 0;
        const slides = testimonialsSlider.querySelectorAll('.testimonial-item');
        const totalSlides = slides.length;
        
        // Esconder todos os slides exceto o primeiro
        for (let i = 1; i < totalSlides; i++) {
            slides[i].style.display = 'none';
        }
        
        // Função para mudar slide
        function changeSlide() {
            slides[currentSlide].style.display = 'none';
            currentSlide = (currentSlide + 1) % totalSlides;
            slides[currentSlide].style.display = 'block';
        }
        
        // Mudar slide a cada 5 segundos
        setInterval(changeSlide, 5000);
    }
    
    // Formulário de contato
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Simulação de envio de formulário
            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            
            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';
            
            // Simular atraso de envio
            setTimeout(function() {
                contactForm.reset();
                submitButton.textContent = 'Mensagem Enviada!';
                
                setTimeout(function() {
                    submitButton.disabled = false;
                    submitButton.textContent = originalText;
                }, 2000);
            }, 1500);
        });
    }
    
    // Efeito de digitação para o título principal
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle && heroTitle.dataset.text) {
        const text = heroTitle.dataset.text;
        heroTitle.textContent = '';
        
        let i = 0;
        const typeInterval = setInterval(function() {
            if (i < text.length) {
                heroTitle.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(typeInterval);
            }
        }, 100);
    }
    
    // Atualização do ano no copyright
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
});

// Animação de contador para números
function animateCounter(element, target, duration) {
    let start = 0;
    const increment = target > 0 ? 1 : 0;
    const stepTime = Math.abs(Math.floor(duration / target));
    
    const timer = setInterval(function() {
        start += increment;
        element.textContent = start;
        
        if (start >= target) {
            element.textContent = target;
            clearInterval(timer);
        }
    }, stepTime);
}

// Inicializar contadores quando visíveis
function initCounters() {
    const counters = document.querySelectorAll('.counter');
    
    counters.forEach(counter => {
        const target = parseInt(counter.dataset.target);
        
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                animateCounter(counter, target, 2000);
                observer.disconnect();
            }
        }, { threshold: 0.5 });
        
        observer.observe(counter);
    });
}

// Inicializar contadores quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', initCounters);

    // Signup com verificação por e-mail
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        const nameInput = document.getElementById('signup-name');
        const emailInput = document.getElementById('signup-email');
        const codeStep = document.getElementById('signup-step-code');
        const codeInput = document.getElementById('signup-code');
        const messages = document.getElementById('signup-messages');
        const submitBtn = document.getElementById('signup-submit');

        function showMessage(text, type = 'info') {
            if (!messages) return;
            messages.style.display = 'block';
            messages.innerHTML = `<div class="alert ${type}">${text}</div>`;
        }

        let step = 'email';

        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (step === 'email') {
                const name = nameInput.value.trim();
                const email = emailInput.value.trim();
                if (!email) { showMessage('Informe um e-mail válido', 'error'); return; }
                submitBtn.disabled = true; submitBtn.textContent = 'Enviando código...';
                try {
                    const resp = await fetch('/api/send-verification', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, email }) });
                    const data = await resp.json();
                    if (!resp.ok || !data.ok) throw new Error(data.error || 'Falha ao enviar');
                    showMessage('Enviamos um código de 6 dígitos para seu e-mail. Confira e digite abaixo.', 'success');
                    codeStep.style.display = 'grid';
                    submitBtn.textContent = 'Verificar código';
                    step = 'code';
                } catch (err) {
                    showMessage('Não foi possível enviar o código. Tente novamente.', 'error');
                } finally {
                    submitBtn.disabled = false;
                }
            } else if (step === 'code') {
                const code = (codeInput.value || '').trim();
                if (!/^[0-9]{6}$/.test(code)) { showMessage('Digite o código de 6 dígitos.', 'error'); return; }
                submitBtn.disabled = true; submitBtn.textContent = 'Verificando...';
                try {
                    const resp = await fetch('/api/verify-code', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ code }) });
                    const data = await resp.json();
                    if (!resp.ok || !data.ok) throw new Error(data.error || 'Código inválido');
                    showMessage('Cadastro concluído! Redirecionando para sua conta...', 'success');
                    setTimeout(() => { window.location.href = '/account.html'; }, 800);
                } catch (err) {
                    showMessage('Código incorreto ou expirado.', 'error');
                } finally {
                    submitBtn.disabled = false; submitBtn.textContent = 'Verificar código';
                }
            }
        });
    }

// Scroll spy simples para destacar o link ativo no menu
(function(){
  const links = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  if (!links.length) return;

  const sections = links
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  const onScroll = () => {
    const scrollY = window.scrollY + 110; // compensa header
    let currentIndex = 0;
    sections.forEach((sec, idx) => {
      const top = sec.offsetTop;
      if (scrollY >= top) currentIndex = idx;
    });
    links.forEach(l => l.classList.remove('is-active'));
    const active = links[currentIndex];
    if (active) active.classList.add('is-active');
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('load', onScroll);
})();