document.addEventListener('DOMContentLoaded', function() {
    // Add logo verification
    const logoImg = document.querySelector('.logo-svg');
    if (logoImg) {
        logoImg.addEventListener('load', function() {
            this.style.opacity = '1';
        });
        
        logoImg.addEventListener('error', function() {
            console.error('Error loading logo SVG');
            this.style.display = 'none';
        });
    }

    if (localStorage.getItem('token')) {
        window.location.href = '/index.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const username = formData.get('username');
        const password = formData.get('password');
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Add loading state
        submitBtn.classList.add('loading');
        submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Logowanie...';

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = '/index.html';
            } else {
                showError('Nieprawidłowe dane logowania');
            }
        } catch (error) {
            showError('Błąd logowania');
        } finally {
            // Remove loading state
            submitBtn.classList.remove('loading');
            submitBtn.innerHTML = originalText;
        }
    });

    function showError(message) {
        // Remove any existing error message
        removeError();

        // Create new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;

        // Insert error message after the first form-group
        const firstFormGroup = loginForm.querySelector('.form-group');
        firstFormGroup.parentNode.insertBefore(errorDiv, firstFormGroup);

        // Add animation
        errorDiv.style.animation = 'fadeIn 0.3s ease-in-out';
    }

    function removeError() {
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    // Hide error message when typing
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', removeError);
    });

    // Add input focus effects
    document.querySelectorAll('.input-icon-wrapper input').forEach(input => {
        input.addEventListener('focus', () => {
            const container = document.querySelector('.login-container');
            container.style.transform = 'perspective(1000px) rotateX(1deg)';
        });
        
        input.addEventListener('blur', () => {
            const container = document.querySelector('.login-container');
            container.style.transform = 'perspective(1000px) rotateX(0deg)';
        });
    });

    // Add subtle parallax effect
    document.addEventListener('mousemove', (e) => {
        const shapes = document.querySelectorAll('.shape-left, .shape-right');
        const mouseX = (e.clientX - window.innerWidth / 2) / 50;
        const mouseY = (e.clientY - window.innerHeight / 2) / 50;

        shapes.forEach(shape => {
            shape.style.transform = `translate(${mouseX}px, ${mouseY}px) rotate(${shape.classList.contains('shape-left') ? '-12deg' : '12deg'})`;
        });
    });
});
