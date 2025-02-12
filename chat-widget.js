class ChatWidget {
  constructor(options = {}) {
    this.options = {
      position: 'bottom-right',
      buttonColor: '#007BFF',
      chatWidth: '300px',
      chatHeight: '400px',
      ...options
    };
    
    this.isOpen = false;
    this.room = new WebsimSocket();
    this.setupStyles();
    this.createElements();
    this.setupEventListeners();
  }

  setupStyles() {
    const styles = `
      .chat-widget-container {
        position: fixed;
        z-index: 9999;
        ${this.options.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
        ${this.options.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
        font-family: Arial, sans-serif;
      }
      .chat-widget-button {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: ${this.options.buttonColor};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        transition: transform 0.3s ease;
      }
      .chat-widget-button:hover {
        transform: scale(1.1);
      }
      .chat-widget-button svg {
        width: 30px;
        height: 30px;
        fill: white;
      }
      .chat-widget-panel {
        position: absolute;
        bottom: 70px;
        right: 0;
        width: ${this.options.chatWidth};
        height: ${this.options.chatHeight};
        background: white;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.15);
        display: none;
        flex-direction: column;
        overflow: hidden;
      }
      .chat-widget-panel.open {
        display: flex;
      }
      .chat-widget-header {
        padding: 15px;
        background: ${this.options.buttonColor};
        color: white;
        font-weight: bold;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .chat-widget-close {
        cursor: pointer;
        padding: 5px;
      }
      .chat-widget-messages {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
        background: #f5f5f5;
      }
      .chat-widget-input-container {
        padding: 10px;
        border-top: 1px solid #eee;
        display: flex;
      }
      .chat-widget-input {
        flex: 1;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        margin-right: 8px;
      }
      .chat-widget-send {
        background: ${this.options.buttonColor};
        color: white;
        border: none;
        padding: 8px 15px;
        border-radius: 4px;
        cursor: pointer;
      }
      .chat-widget-send:hover {
        opacity: 0.9;
      }
      .chat-message {
        display: flex;
        align-items: flex-start;
        margin-bottom: 10px;
        animation: chatFadeIn 0.3s ease-out;
      }
      .chat-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        margin-right: 8px;
        flex-shrink: 0;
        overflow: hidden;
      }
      .chat-content {
        background: white;
        padding: 8px 12px;
        border-radius: 8px;
        max-width: 80%;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      }
      .chat-username {
        font-weight: bold;
        font-size: 0.9em;
        margin-bottom: 4px;
        color: ${this.options.buttonColor};
      }
      .chat-text {
        word-break: break-word;
        line-height: 1.4;
      }
      @keyframes chatFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      /* Scrollbar Styles */
      .chat-widget-messages::-webkit-scrollbar {
        width: 6px;
      }
      .chat-widget-messages::-webkit-scrollbar-track {
        background: #f1f1f1;
      }
      .chat-widget-messages::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 3px;
      }
      .chat-widget-messages::-webkit-scrollbar-thumb:hover {
        background: #555;
      }
    `;

    if (!document.getElementById('chat-widget-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'chat-widget-styles';
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }
  }

  createElements() {
    // Create container
    this.container = document.createElement('div');
    this.container.className = 'chat-widget-container';

    // Create toggle button
    this.button = document.createElement('div');
    this.button.className = 'chat-widget-button';
    this.button.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M20,2H4C2.9,2,2,2.9,2,4v18l4-4h14c1.1,0,2-0.9,2-2V4C22,2.9,21.1,2,20,2z"/>
      </svg>
    `;

    // Create chat panel
    this.panel = document.createElement('div');
    this.panel.className = 'chat-widget-panel';

    // Create header
    const header = document.createElement('div');
    header.className = 'chat-widget-header';
    header.innerHTML = `
      <span>Chat Room</span>
      <span class="chat-widget-close">✕</span>
    `;

    // Create messages container
    this.messagesContainer = document.createElement('div');
    this.messagesContainer.className = 'chat-widget-messages';

    // Create input container
    const inputContainer = document.createElement('div');
    inputContainer.className = 'chat-widget-input-container';

    // Create input field
    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.className = 'chat-widget-input';
    this.input.placeholder = 'Type a message...';

    // Create send button
    this.sendButton = document.createElement('button');
    this.sendButton.className = 'chat-widget-send';
    this.sendButton.textContent = 'Send';

    // Assemble the components
    inputContainer.appendChild(this.input);
    inputContainer.appendChild(this.sendButton);

    this.panel.appendChild(header);
    this.panel.appendChild(this.messagesContainer);
    this.panel.appendChild(inputContainer);

    this.container.appendChild(this.panel);
    this.container.appendChild(this.button);

    // Add to document
    document.body.appendChild(this.container);
  }

  setupEventListeners() {
    // Toggle chat panel
    this.button.addEventListener('click', () => this.toggleChat());
    this.panel.querySelector('.chat-widget-close').addEventListener('click', () => this.toggleChat());

    // Send message handlers
    this.sendButton.addEventListener('click', () => this.sendMessage());
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });

    // WebSocket message handler
    this.room.onmessage = (event) => {
      const data = event.data;
      if (data.type === 'chat') {
        this.addMessage(data);
      }
    };
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    this.panel.classList.toggle('open', this.isOpen);
    if (this.isOpen) {
      this.input.focus();
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  sendMessage() {
    const message = this.input.value.trim();
    if (!message) return;

    this.room.send({
      type: 'chat',
      message: message
    });

    this.input.value = '';
  }

  addMessage(data) {
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';

    const avatarUrl = `https://images.websim.ai/avatar/${data.username}`;
    
    messageElement.innerHTML = `
      <img class="chat-avatar" src="${avatarUrl}" 
           onerror="this.src='data:image/svg+xml,${encodeURIComponent(`
             <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
               <circle cx="16" cy="16" r="16" fill="${this.options.buttonColor}"/>
               <text x="16" y="16" text-anchor="middle" fill="white" 
                     font-size="16" font-family="Arial" dy=".3em">${data.username ? data.username[0].toUpperCase() : '?'}</text>
             </svg>
           `)}'"
      >
      <div class="chat-content">
        <div class="chat-username">${data.username || 'Anonymous'}</div>
        <div class="chat-text">${this.escapeHtml(data.message)}</div>
      </div>
    `;

    this.messagesContainer.appendChild(messageElement);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

// Export the class
window.ChatWidget = ChatWidget;

// Usage example:
// const chat = new ChatWidget({
//   position: 'bottom-right', // or 'bottom-left', 'top-right', 'top-left'
//   buttonColor: '#007BFF',
//   chatWidth: '300px',
//   chatHeight: '400px'
// });