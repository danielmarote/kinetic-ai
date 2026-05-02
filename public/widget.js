/**
 * Helply Embeddable Chat Widget
 * Usage: <script src="https://yourapp.com/widget.js" data-bot-id="YOUR_BOT_ID" async></script>
 */
(function () {
  'use strict';

  // Get bot ID from script tag or global var
  var botId = document.currentScript
    ? document.currentScript.getAttribute('data-bot-id')
    : window.HelplyBotId;

  if (!botId) {
    console.warn('[Helply] No data-bot-id specified on script tag.');
    return;
  }

  var appUrl = document.currentScript
    ? document.currentScript.src.replace('/widget.js', '')
    : (window.HelplyAppUrl || window.location.origin);

  var sessionId = 'bb_' + Math.random().toString(36).slice(2) + '_' + Date.now();
  var isOpen = false;
  var messages = [];
  var isLoading = false;
  var botConfig = null;

  // ── Fetch bot config ──────────────────────────────────────────────────────
  function loadBotConfig() {
    fetch(appUrl + '/api/bots/' + botId + '/config')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (data && data.bot) {
          botConfig = data.bot;
          updateBotUI();
        }
      })
      .catch(function () {});
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  var PRIMARY = '#6366f1';

  function getStyles(color) {
    return [
      '#bb-widget-btn { position:fixed; bottom:20px; right:20px; width:56px; height:56px;',
      'border-radius:50%; background:' + color + '; border:none; cursor:pointer; box-shadow:0 4px 12px rgba(0,0,0,.2);',
      'display:flex; align-items:center; justify-content:center; z-index:999998; transition:transform .2s; }',
      '#bb-widget-btn:hover { transform:scale(1.05); }',
      '#bb-widget-btn svg { width:24px; height:24px; fill:white; }',
      '#bb-widget-panel { position:fixed; bottom:86px; right:20px; width:360px; height:500px;',
      'background:white; border-radius:16px; box-shadow:0 8px 32px rgba(0,0,0,.15);',
      'display:flex; flex-direction:column; z-index:999997; overflow:hidden;',
      'transition:opacity .2s, transform .2s; transform-origin:bottom right; }',
      '#bb-widget-panel.bb-hidden { opacity:0; transform:scale(.95); pointer-events:none; }',
      '#bb-header { background:' + color + '; color:white; padding:16px; display:flex;',
      'align-items:center; justify-content:space-between; }',
      '#bb-header h3 { margin:0; font-size:15px; font-weight:600; }',
      '#bb-header p { margin:2px 0 0; font-size:11px; opacity:.8; }',
      '#bb-close { background:none; border:none; color:white; cursor:pointer; font-size:20px; line-height:1; padding:0; }',
      '#bb-messages { flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:10px; }',
      '.bb-msg { max-width:80%; padding:10px 13px; border-radius:12px; font-size:13px; line-height:1.5; word-break:break-word; }',
      '.bb-msg-user { background:' + color + '; color:white; margin-left:auto; border-bottom-right-radius:4px; }',
      '.bb-msg-bot { background:#f3f4f6; color:#111; border-bottom-left-radius:4px; }',
      '.bb-msg-bot.bb-typing { opacity:.6; }',
      '#bb-input-area { border-top:1px solid #e5e7eb; padding:12px; display:flex; gap:8px; }',
      '#bb-input { flex:1; border:1px solid #e5e7eb; border-radius:8px; padding:8px 12px;',
      'font-size:13px; outline:none; resize:none; }',
      '#bb-input:focus { border-color:' + color + '; }',
      '#bb-send { background:' + color + '; color:white; border:none; border-radius:8px;',
      'padding:8px 14px; cursor:pointer; font-size:13px; font-weight:600; white-space:nowrap; }',
      '#bb-send:disabled { opacity:.5; cursor:not-allowed; }',
      '@media (max-width:420px) { #bb-widget-panel { width:calc(100vw - 24px); right:12px; bottom:78px; } }',
    ].join('');
  }

  function injectStyles(color) {
    var style = document.createElement('style');
    style.id = 'bb-widget-styles';
    style.textContent = getStyles(color || PRIMARY);
    document.head.appendChild(style);
  }

  // ── DOM ───────────────────────────────────────────────────────────────────
  function createWidget() {
    var color = (botConfig && botConfig.primaryColor) || PRIMARY;
    var botName = (botConfig && botConfig.name) || 'Support';
    var welcomeMsg = (botConfig && botConfig.welcomeMessage) || 'Hi! How can I help you today?';

    // Style
    var existingStyle = document.getElementById('bb-widget-styles');
    if (existingStyle) existingStyle.remove();
    injectStyles(color);

    // Button
    var btn = document.createElement('button');
    btn.id = 'bb-widget-btn';
    btn.setAttribute('aria-label', 'Open chat');
    btn.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';

    // Panel
    var panel = document.createElement('div');
    panel.id = 'bb-widget-panel';
    panel.className = 'bb-hidden';
    panel.innerHTML = [
      '<div id="bb-header">',
      '  <div>',
      '    <h3>' + escapeHtml(botName) + '</h3>',
      '    <p>AI-powered support</p>',
      '  </div>',
      '  <button id="bb-close" aria-label="Close">✕</button>',
      '</div>',
      '<div id="bb-messages"></div>',
      '<div id="bb-input-area">',
      '  <textarea id="bb-input" rows="1" placeholder="Type a message..." maxlength="2000"></textarea>',
      '  <button id="bb-send">Send</button>',
      '</div>',
    ].join('');

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    // Events
    btn.addEventListener('click', togglePanel);
    document.getElementById('bb-close').addEventListener('click', closePanel);
    document.getElementById('bb-send').addEventListener('click', sendMessage);
    document.getElementById('bb-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Show welcome message
    if (messages.length === 0) {
      addMessage('assistant', welcomeMsg);
    }
  }

  function updateBotUI() {
    var existing = document.getElementById('bb-widget-btn');
    if (existing) {
      existing.remove();
      var panel = document.getElementById('bb-widget-panel');
      if (panel) panel.remove();
    }
    createWidget();
  }

  // ── State ─────────────────────────────────────────────────────────────────
  function togglePanel() {
    isOpen ? closePanel() : openPanel();
  }

  function openPanel() {
    isOpen = true;
    var panel = document.getElementById('bb-widget-panel');
    if (panel) panel.classList.remove('bb-hidden');
    setTimeout(function () {
      var input = document.getElementById('bb-input');
      if (input) input.focus();
    }, 200);
  }

  function closePanel() {
    isOpen = false;
    var panel = document.getElementById('bb-widget-panel');
    if (panel) panel.classList.add('bb-hidden');
  }

  function addMessage(role, text) {
    messages.push({ role: role, content: text });
    var container = document.getElementById('bb-messages');
    if (!container) return;

    var div = document.createElement('div');
    div.className = 'bb-msg ' + (role === 'user' ? 'bb-msg-user' : 'bb-msg-bot');
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  }

  function setLoading(loading) {
    isLoading = loading;
    var btn = document.getElementById('bb-send');
    var input = document.getElementById('bb-input');
    if (btn) btn.disabled = loading;
    if (input) input.disabled = loading;
  }

  // ── Chat ──────────────────────────────────────────────────────────────────
  function sendMessage() {
    if (isLoading) return;
    var input = document.getElementById('bb-input');
    if (!input) return;

    var text = input.value.trim();
    if (!text) return;

    input.value = '';
    addMessage('user', text);
    setLoading(true);

    // Show typing indicator
    var container = document.getElementById('bb-messages');
    var typingEl = document.createElement('div');
    typingEl.className = 'bb-msg bb-msg-bot bb-typing';
    typingEl.textContent = '...';
    if (container) {
      container.appendChild(typingEl);
      container.scrollTop = container.scrollHeight;
    }

    fetch(appUrl + '/api/bots/' + botId + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sessionId, message: text }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
        if (data.message && data.message.content) {
          addMessage('assistant', data.message.content);
        } else if (data.error) {
          addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
        }
      })
      .catch(function () {
        if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
        addMessage('assistant', 'Connection error. Please check your internet and try again.');
      })
      .finally(function () {
        setLoading(false);
      });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    injectStyles(PRIMARY);
    createWidget();
    loadBotConfig();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
