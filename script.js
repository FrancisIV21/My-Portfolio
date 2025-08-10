function createStars() {
    const starsContainer = document.getElementById('stars');
    const numStars = 100;
    
    for (let i = 0; i < numStars; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        starsContainer.appendChild(star);
    }
}

// Theme toggle functionality
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

themeToggle.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? '' : 'light';
    
    body.setAttribute('data-theme', newTheme);
    
    // Update button icon based on current theme
    if (newTheme === 'light') {
        themeToggle.textContent = '☀️'; // Sun icon for light mode
    } else {
        themeToggle.textContent = '🌙'; // Moon icon for dark mode
    }
});

// Set initial icon on page load
document.addEventListener('DOMContentLoaded', () => {
    const currentTheme = body.getAttribute('data-theme');
    if (currentTheme === 'light') {
        themeToggle.textContent = '☀️';
    } else {
        themeToggle.textContent = '🌙';
    }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Initialize stars when page loads
document.addEventListener('DOMContentLoaded', createStars);

// Chat functionality
class PortfolioChat {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatStatus = document.getElementById('chatStatus');
        
        // Configuration for different environments
        this.config = {
            // Use localhost:3001 for local development
            apiUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? 'http://localhost:3001/api/chat'
                : '/api/chat' // Use relative URL for production
        };
        
        this.init();
    }
    
    init() {
        if (!this.chatInput || !this.sendButton) return;
        
        this.sendButton.addEventListener('click', () => this.handleSend());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });
        
        this.chatInput.addEventListener('input', () => {
            this.sendButton.disabled = this.chatInput.value.trim() === '';
        });

        // Test backend connection on initialization
        this.testBackendConnection();
    }
    
    async testBackendConnection() {
        try {
            const healthUrl = this.config.apiUrl.replace('/chat', '/health');
            const response = await fetch(healthUrl);
            if (response.ok) {
                console.log('✅ Backend connection successful');
                this.updateStatus('Connected to AI assistant');
            } else {
                throw new Error('Health check failed');
            }
        } catch (error) {
            console.warn('⚠️ Backend connection failed, using fallback responses');
            this.updateStatus('Using offline mode');
        }
    }
    
    updateStatus(message) {
        if (this.chatStatus) {
            this.chatStatus.textContent = message;
            setTimeout(() => {
                this.chatStatus.textContent = '';
            }, 3000);
        }
    }
    
    async handleSend() {
        const message = this.chatInput.value.trim();
        if (!message || this.sendButton.disabled) return;
        
        // Add user message
        this.addMessage(message, 'user');
        this.chatInput.value = '';
        this.sendButton.disabled = true;
        
        // Show typing indicator
        this.showTyping();
        
        try {
            const response = await this.sendToAPI(message);
            this.hideTyping();
            this.addMessage(response, 'bot');
            this.updateStatus('');
        } catch (error) {
            this.hideTyping();
            this.addMessage("I'm sorry, I'm having trouble connecting to my AI brain right now. Please make sure the backend server is running on port 3001, or try again later!", 'bot');
            this.updateStatus('Connection error');
            console.error('Chat error:', error);
        }
        
        this.sendButton.disabled = false;
    }
    
    addMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = type === 'user' ? '👤' : '🤖';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = `<p>${this.formatMessage(text)}</p>`;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    formatMessage(text) {
        // Basic formatting for the message
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/\r\n/g, '<br>');
    }
    
    showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-message';
        typingDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="typing-indicator">
                    <span>Thinking</span>
                    <div class="typing-dots">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>
        `;
        
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }
    
    hideTyping() {
        const typingMessage = this.chatMessages.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    async sendToAPI(message) {
        try {
            console.log('Sending to API:', this.config.apiUrl);
            
            const response = await fetch(this.config.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message: message
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            return data.response || "I received your message but couldn't generate a response.";
            
        } catch (error) {
            console.error('API Error:', error);
            
            // If we're in development and backend is not available, show helpful message
            if (error.message.includes('fetch')) {
                throw new Error('Cannot connect to backend server. Make sure your Node.js server is running on port 3001.');
            }
            
            throw error;
        }
    }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PortfolioChat();
});