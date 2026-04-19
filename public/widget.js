/**
 * AI Commerce Lead Generator - Chat Widget
 * =========================================
 * Beágyazható standalone chatbot widget.
 * Semmilyen külső könyvtár nem kell hozzá (no React, no jQuery).
 *
 * Beágyazás a céloldalra:
 *   <script
 *     src="https://your-app.com/widget.js"
 *     data-api-key="lc_abc123..."
 *     data-org-id="uuid-here"
 *     data-theme="#6366f1"
 *     data-title="Chat with us"
 *   ></script>
 */

// =====================================================
// IIFE - Immediately Invoked Function Expression
// =====================================================
// Miért IIFE? Hogy a változóink ne kerüljenek a globális window scope-ba,
// ahol ütközhetnének az oldal más JS kódjával (pl. if (state) {...} máshol is).
// Az összes kód ezen a "(function(){ ... })()" blokkon belül él.
(function () {
  "use strict"; // strict mode: elkapja a néma hibákat (pl. typo a változónévben)

  // =====================================================
  // 1. KONFIGURÁCIÓ - script tag data-* attribútumaiból
  // =====================================================
  // document.currentScript = az éppen értelmezett <script> elem.
  // Ebből olvassuk ki a data-* attribútumokat.
  // Megjegyzés: async/defer betöltésnél currentScript null lehet,
  // ezért a config olvasást azonnal, szinkron végezzük.
  const script = document.currentScript;

  if (!script) {
    console.error("[LeadWidget] Could not find script element. Avoid async/defer.");
    return;
  }

  // Segédfüggvény: data-* attribútum olvasása fallback értékkel
  function attr(name, fallback) {
    return script.getAttribute(name) || fallback;
  }

  const config = {
    apiKey:   attr("data-api-key", ""),
    orgId:    attr("data-org-id", ""),
    theme:    attr("data-theme", "#6366f1"),   // indigo mint default szín
    title:    attr("data-title", "Chat with us"),
    subtitle: attr("data-subtitle", "Ask us anything!"),
    // Az app URL: a script src-jéből jön, így automatikusan helyes
    // akár localhost:3000-ről, akár productionból töltik be
    baseUrl:  new URL(script.src).origin,
  };

  if (!config.apiKey || !config.orgId) {
    console.error("[LeadWidget] data-api-key and data-org-id are required attributes.");
    return;
  }

  // =====================================================
  // 2. XSS VÉDELEM
  // =====================================================
  // XSS = Cross-Site Scripting: ha user inputot nyers HTML-ként injectálsz,
  // a támadó futtathat JavaScript kódot a te oldalad nevében.
  // Megoldás: a speciális karaktereket HTML entitásokra cseréljük.
  // Pl.: <script> → &lt;script&gt; → böngésző szövegként jeleníti meg, nem futtatja.
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // =====================================================
  // 3. ÁLLAPOT (STATE)
  // =====================================================
  // Vanillás JS-ben nincs React state. Egy sima objektumban tároljuk az
  // állapotot, és kézzel frissítjük a DOM-ot, ha változik valami.
  const state = {
    isOpen: false,           // nyitva van-e a chat ablak
    isLoading: false,        // küldés / API hívás folyamatban
    messages: [],            // [{role:"user"|"bot", content:"..."}]
    conversationId: null,    // UUID - a backend adja, a chat-hez kell
    sessionId: null,         // UUID - localStorage-ban tároljuk (visszatérő látogató)
    isInitialized: false,    // elindítottuk-e már a conversation inicializálást
  };

  // =====================================================
  // 4. SESSION KEZELÉS - localStorage
  // =====================================================
  // localStorage: kulcs-érték tároló a böngészőben, tartós (nem süti!).
  // Így ha a látogató visszajön, folytathatja ugyanazt a conversation-t.
  // A kulcsban benne van az orgId, hogy több widget egymás mellé tehető.
  const STORAGE_KEY = "lc_session_" + config.orgId;

  function loadSession() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        state.conversationId = parsed.conversationId || null;
        state.sessionId      = parsed.sessionId || null;
      }
    } catch (e) {
      // localStorage tiltott lehet (pl. Safari ITP, privát mód strict beállítással)
      console.warn("[LeadWidget] Could not load session:", e);
    }
  }

  function saveSession() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        conversationId: state.conversationId,
        sessionId:      state.sessionId,
      }));
    } catch (e) {
      console.warn("[LeadWidget] Could not save session:", e);
    }
  }

  // =====================================================
  // 5. SHADOW DOM FELÉPÍTÉSE
  // =====================================================
  // Shadow DOM = izolált DOM + CSS "buborék" a rendes DOM-ban.
  // Az oldal CSS nem látja bele, a widget CSS nem szivárog ki.
  // Gondolj rá úgy mint egy iframe, csak sokkal könnyebb és gyorsabb.

  // Host elem: ez kerül a <body>-ba, ez hordozza a Shadow Root-ot
  const host = document.createElement("div");
  host.id = "lc-widget-host";
  host.style.cssText = [
    "position:fixed",
    "bottom:24px",
    "right:24px",
    "z-index:2147483647", // max z-index - mindig a tetején legyen
    "font-family:system-ui,-apple-system,sans-serif",
  ].join(";");
  document.body.appendChild(host);

  // attachShadow({mode:"open"}): a shadow root JS-ből elérhető (host.shadowRoot)
  // mode:"closed" esetén kívülről nem lehetne elérni - nem kell itt
  const shadow = host.attachShadow({ mode: "open" });

  // Az összes CSS és HTML bekerül a shadow-ba egy innerHTML-lel
  // Miért nem createElement sorozat? Olvashatóbb template literal-ként.
  shadow.innerHTML = `
    <style>
      /*
       * CSS Custom Properties (változók)
       * :host = maga a shadow host elem (a <div id="lc-widget-host">)
       * Ezekbe kerül a theme szín - egy helyen változtatható
       */
      :host {
        --primary:      ${escapeHtml(config.theme)};
        --primary-dark: color-mix(in srgb, ${escapeHtml(config.theme)} 75%, black);
        --bg:           #ffffff;
        --text:         #111827;
        --muted:        #6b7280;
        --border:       #e5e7eb;
        --user-bg:      ${escapeHtml(config.theme)};
        --bot-bg:       #f3f4f6;
        --radius:       14px;
        --shadow:       0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1);
      }

      /* ---- LEBEGŐ GOMB (BUBBLE) ---- */
      #bubble {
        position: relative;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--primary);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(0,0,0,0.25);
        /* transition: az egér fölé húzásnál sima animáció */
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        color: white;
        outline: none;
      }
      #bubble:hover {
        transform: scale(1.1);
        box-shadow: 0 8px 28px rgba(0,0,0,0.3);
      }
      #bubble:focus-visible {
        /* Akadálymentesség: billentyűzetes fókusznál látható körvonal */
        outline: 3px solid var(--primary);
        outline-offset: 3px;
      }
      #bubble svg { width: 24px; height: 24px; }

      /* Olvasatlan üzenet badge (piros pont) */
      #badge {
        position: absolute;
        top: -3px;
        right: -3px;
        background: #ef4444;
        color: white;
        font-size: 11px;
        font-weight: 700;
        min-width: 18px;
        height: 18px;
        border-radius: 9px;
        padding: 0 4px;
        display: none; /* JS kapcsolja be ha kell */
        align-items: center;
        justify-content: center;
        border: 2px solid white;
      }

      /* ---- CHAT ABLAK ---- */
      #window {
        position: absolute;
        bottom: 68px; /* bubble magassága + gap */
        right: 0;
        width: 360px;
        max-height: 540px;
        background: var(--bg);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        /* Animáció: scale + opacity - "springy" effekt */
        transform-origin: bottom right;
        transition:
          transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
          opacity   0.2s  ease;
      }
      /* "hidden" class hozzáadásakor zsugorodik és eltűnik */
      #window.hidden {
        transform: scale(0.85);
        opacity: 0;
        /* pointer-events:none = kattinthatatlan amikor zárva van */
        pointer-events: none;
      }

      /* ---- FEJLÉC ---- */
      #header {
        background: var(--primary);
        color: white;
        padding: 14px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0; /* ne zsugorodjon ha kevés a hely */
      }
      .header-dot {
        width: 8px; height: 8px;
        background: #4ade80; /* zöld = online */
        border-radius: 50%;
        margin-right: 8px;
        display: inline-block;
        box-shadow: 0 0 0 2px rgba(74,222,128,0.4);
        animation: pulse 2s infinite;
      }
      @keyframes pulse {
        0%,100% { box-shadow: 0 0 0 2px rgba(74,222,128,0.4); }
        50%      { box-shadow: 0 0 0 5px rgba(74,222,128,0.15); }
      }
      .header-info { display: flex; align-items: center; }
      #header-title  { font-weight: 600; font-size: 15px; }
      #header-sub    { font-size: 12px; opacity: 0.75; margin-top: 1px; }
      #close-btn {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        opacity: 0.7;
        padding: 6px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        transition: opacity 0.15s, background 0.15s;
        outline: none;
      }
      #close-btn:hover { opacity: 1; background: rgba(255,255,255,0.15); }
      #close-btn svg   { width: 18px; height: 18px; }

      /* ---- ÜZENETEK TERÜLET ---- */
      #messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-height: 300px;
        max-height: 360px;
        /* Vékony scrollbar */
        scrollbar-width: thin;
        scrollbar-color: var(--border) transparent;
      }
      #messages::-webkit-scrollbar       { width: 4px; }
      #messages::-webkit-scrollbar-track { background: transparent; }
      #messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

      /* ---- ÜRES ÁLLAPOT ---- */
      #empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex: 1;
        color: var(--muted);
        font-size: 14px;
        text-align: center;
        padding: 24px;
        gap: 10px;
        min-height: 200px;
      }
      #empty-state svg { width: 44px; height: 44px; opacity: 0.35; }
      #empty-state strong { color: var(--text); font-size: 15px; }

      /* ---- ÜZENET BUBORÉKOK ---- */
      .msg {
        display: flex;
        /* fadeUp animáció: alulról csúszik be minden üzenet */
        animation: fadeUp 0.2s ease forwards;
      }
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .msg.user { justify-content: flex-end; }
      .msg.bot  { justify-content: flex-start; }

      .bubble {
        padding: 9px 13px;
        border-radius: 18px;
        font-size: 14px;
        line-height: 1.55;
        max-width: 82%;
        word-break: break-word;
      }
      .msg.user .bubble {
        background: var(--user-bg);
        color: white;
        border-bottom-right-radius: 4px; /* "csőr" jobb oldalt */
      }
      .msg.bot .bubble {
        background: var(--bot-bg);
        color: var(--text);
        border-bottom-left-radius: 4px; /* "csőr" bal oldalt */
      }

      /* ---- GÉPELŐS ANIMÁCIÓ (typing indicator) ---- */
      /* Amikor az AI "gondolkodik", három pattogó pont jelenik meg */
      .typing .bubble {
        display: flex;
        gap: 5px;
        padding: 12px 16px;
      }
      .typing .bubble span {
        width: 7px; height: 7px;
        background: var(--muted);
        border-radius: 50%;
        /* animation: bounce - egymás után indulnak (delay-ek) */
        animation: bounce 1.3s ease infinite;
      }
      .typing .bubble span:nth-child(2) { animation-delay: 0.18s; }
      .typing .bubble span:nth-child(3) { animation-delay: 0.36s; }
      @keyframes bounce {
        0%,60%,100% { transform: translateY(0); }
        30%          { transform: translateY(-7px); }
      }

      /* ---- INPUT TERÜLET ---- */
      #input-area {
        padding: 10px 12px;
        border-top: 1px solid var(--border);
        display: flex;
        align-items: flex-end;
        gap: 8px;
        flex-shrink: 0;
        background: var(--bg);
      }
      /* textarea: auto-resize JS-sel; rows="1" az alap */
      #msg-input {
        flex: 1;
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 8px 14px;
        font-size: 14px;
        font-family: inherit;
        color: var(--text);
        background: var(--bg);
        outline: none;
        resize: none;
        overflow: hidden;
        max-height: 100px;
        line-height: 1.4;
        transition: border-color 0.15s;
      }
      #msg-input:focus         { border-color: var(--primary); }
      #msg-input::placeholder  { color: var(--muted); }

      #send-btn {
        width: 36px; height: 36px;
        border-radius: 50%;
        background: var(--primary);
        border: none;
        cursor: pointer;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        outline: none;
        transition: background 0.15s, transform 0.1s, opacity 0.15s;
      }
      #send-btn:hover:not(:disabled)  { background: var(--primary-dark); }
      #send-btn:active:not(:disabled) { transform: scale(0.88); }
      #send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      #send-btn svg { width: 15px; height: 15px; }

      /* ---- MOBIL: teljes képernyő ---- */
      /* 480px-nél kisebb képernyőn a chat ablak kitölti az egész viewport-ot */
      @media (max-width: 480px) {
        #window {
          position: fixed;
          inset: 0;          /* top:0;right:0;bottom:0;left:0 rövidítése */
          width: 100%;
          max-height: 100%;
          border-radius: 0;
          transform-origin: center bottom;
        }
      }
    </style>

    <!-- ========= LEBEGŐ BUBBLE GOMB ========= -->
    <button id="bubble" aria-label="Open chat" aria-expanded="false" aria-controls="window">
      <!-- Chat ikon - SVG, nem kell külső CDN -->
      <svg id="icon-chat" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <!-- X ikon - bezáráskor látszik, nyitáskor rejtett -->
      <svg id="icon-close" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
           style="display:none">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
      <!-- Piros badge: olvasatlan üzenet jelzője -->
      <span id="badge" aria-live="polite" aria-label="Unread messages"></span>
    </button>

    <!-- ========= CHAT ABLAK ========= -->
    <!--
      role="dialog" + aria-label: képernyőolvasók számára jelzi, hogy ez egy párbeszédablak.
      aria-live="polite": az üzenetek változásakor a screen reader felolvassa.
    -->
    <div id="window" class="hidden" role="dialog" aria-label="Chat window" aria-hidden="true">

      <!-- Fejléc -->
      <div id="header">
        <div class="header-info">
          <span class="header-dot" aria-hidden="true"></span>
          <div>
            <div id="header-title">${escapeHtml(config.title)}</div>
            <div id="header-sub">${escapeHtml(config.subtitle)}</div>
          </div>
        </div>
        <button id="close-btn" aria-label="Close chat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Üzenetek listája - JS tölti fel -->
      <div id="messages" role="log" aria-live="polite" aria-atomic="false"></div>

      <!-- Input sor -->
      <div id="input-area">
        <textarea
          id="msg-input"
          placeholder="Type a message..."
          rows="1"
          aria-label="Message input"
          autocomplete="off"
          spellcheck="true"
        ></textarea>
        <button id="send-btn" disabled aria-label="Send message">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>

    </div>
  `;

  // =====================================================
  // 6. DOM ELEMEK LEKÉRÉSE
  // =====================================================
  // Fontos: shadow.getElementById() - NEM document.getElementById()!
  // A shadow DOM elemek kívülről láthatatlanok a rendes document számára.
  const elBubble    = shadow.getElementById("bubble");
  const elWindow    = shadow.getElementById("window");
  const elMessages  = shadow.getElementById("messages");
  const elInput     = shadow.getElementById("msg-input");
  const elSendBtn   = shadow.getElementById("send-btn");
  const elCloseBtn  = shadow.getElementById("close-btn");
  const elIconChat  = shadow.getElementById("icon-chat");
  const elIconClose = shadow.getElementById("icon-close");
  const elBadge     = shadow.getElementById("badge");

  // =====================================================
  // 7. UI FRISSÍTŐ FÜGGVÉNYEK
  // =====================================================

  /** Scroll az üzenetek aljára */
  function scrollToBottom() {
    // setTimeout(fn, 0): a böngészőnek ad egy micro-task tick-et,
    // hogy a DOM frissülése UTÁN görgessenek (különben új üzenet előtt görget)
    setTimeout(function () {
      elMessages.scrollTop = elMessages.scrollHeight;
    }, 0);
  }

  /**
   * Üzenet hozzáadása a listához
   * @param {"user"|"bot"} role
   * @param {string} content
   */
  function addMessage(role, content) {
    // Üres állapot eltávolítása (ha volt)
    var emptyState = shadow.getElementById("empty-state");
    if (emptyState) emptyState.remove();

    var msgEl = document.createElement("div");
    msgEl.className = "msg " + role;

    var bubble = document.createElement("div");
    bubble.className = "bubble";
    // textContent = XSS-biztos alternatíva innerHTML helyett!
    // Soha ne használj innerHTML user inputhoz.
    bubble.textContent = content;

    msgEl.appendChild(bubble);
    elMessages.appendChild(msgEl);
    state.messages.push({ role: role, content: content });
    scrollToBottom();
  }

  /**
   * Gépelős animáció (három pattogó pont)
   * @param {boolean} show
   */
  function setTyping(show) {
    var existing = shadow.getElementById("typing-indicator");
    if (show && !existing) {
      var el = document.createElement("div");
      el.id = "typing-indicator";
      el.className = "msg bot typing";
      // innerHTML itt OK mert ez statikus markup, nem user input
      el.innerHTML = '<div class="bubble"><span></span><span></span><span></span></div>';
      elMessages.appendChild(el);
      scrollToBottom();
    } else if (!show && existing) {
      existing.remove();
    }
  }

  /** Send gomb tiltása/engedélyezése az input tartalmától függően */
  function updateSendBtn() {
    elSendBtn.disabled = !elInput.value.trim() || state.isLoading;
  }

  /**
   * Chat ablak megnyitása vagy bezárása
   * @param {boolean} open
   */
  function toggleWindow(open) {
    state.isOpen = open;

    if (open) {
      elWindow.classList.remove("hidden");
      elWindow.setAttribute("aria-hidden", "false");
      elBubble.setAttribute("aria-expanded", "true");
      elIconChat.style.display  = "none";
      elIconClose.style.display = "";
      elBadge.style.display     = "none"; // badge eltűnik megnyitáskor
      elInput.focus();
      scrollToBottom();

      // Első megnyitáskor session betöltés + conversation init
      if (!state.isInitialized) {
        state.isInitialized = true;
        loadSession();
        startConversation();
      }
    } else {
      elWindow.classList.add("hidden");
      elWindow.setAttribute("aria-hidden", "true");
      elBubble.setAttribute("aria-expanded", "false");
      elIconChat.style.display  = "";
      elIconClose.style.display = "none";
      elBubble.focus(); // fókusz visszamegy a bubble-re bezáráskor (a11y)
    }
  }

  // =====================================================
  // 8. API HÍVÁSOK
  // =====================================================

  /**
   * Conversation inicializálása a backendnél.
   * Ha van mentett sessionId, a backend "resumeolja" azt (nem hoz létre újat).
   *
   * fetch() = modern JS HTTP kliens (XMLHttpRequest utódja).
   * async/await = Promise-alapú aszinkron kód, olvashatóbb mint callback vagy .then()
   */
  async function initConversation() {
    var body = {
      organization_id: config.orgId,
      visitor_metadata: {
        page_url:   window.location.href,
        referrer:   document.referrer || null,
        user_agent: navigator.userAgent,
        timestamp:  new Date().toISOString(),
      },
    };

    // Ha van mentett sessionId, küldjük - így a backend ugyanazt adja vissza
    if (state.sessionId) {
      body.session_id = state.sessionId;
    }

    var res = await fetch(config.baseUrl + "/api/conversations", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });

    if (!res.ok) throw new Error("Conversation init failed: " + res.status);

    var data = await res.json();
    state.conversationId = data.data.conversation_id;
    state.sessionId      = data.data.session_id;
    saveSession();
    return data.data;
  }

  /**
   * Streaming üzenetküldés az AI chatbot-nak.
   *
   * SSE (Server-Sent Events) formátumú választ olvas ReadableStream reader-rel.
   * A szöveg chunk-okban érkezik → progresszív megjelenítés (gépelős effekt).
   *
   * @param {string} message - A user által beírt szöveg
   * @param {function} onChunk - Minden szövegtöredéknél hívódik: onChunk(chunkText)
   * @param {function} onDone  - Stream végén hívódik: onDone(eventData)
   */
  async function sendStreamingMessage(message, onChunk, onDone) {
    var res = await fetch(config.baseUrl + "/api/chat", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        message:              message,
        conversation_id:      state.conversationId,
        organization_id:      config.orgId,
        api_key:              config.apiKey,  // API key validáláshoz
        stream:               true,   // SSE módot kér a backend-től
        include_products:     true,
        max_products:         5,
        similarity_threshold: 0.1,  // 0.1 = alacsony küszöb, debug módban
      }),
    });

    if (!res.ok) throw new Error("Chat API failed: " + res.status);

    // ReadableStream reader: chunk-okat olvas a HTTP response body-ból
    // Ez a modern fetch streaming API - nem kell EventSource mert POST kérés
    var reader  = res.body.getReader();
    var decoder = new TextDecoder();
    var buffer  = "";

    while (true) {
      var result = await reader.read();
      if (result.done) break;

      // Uint8Array → string, stream:true = folytatható dekódolás (multi-byte karakterek)
      buffer += decoder.decode(result.value, { stream: true });

      // SSE formátum: "data: <JSON>\n\n" soronként, több chunk is jöhet egyszerre
      var lines = buffer.split("\n");
      // Az utolsó sor lehet csonka → visszatartjuk a következő körre
      buffer = lines.pop();

      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line.startsWith("data: ")) continue;

        var jsonStr = line.slice(6); // "data: " levágása
        if (!jsonStr) continue;

        try {
          var event = JSON.parse(jsonStr);
          if (event.type === "chunk" && event.content) {
            onChunk(event.content);
          } else if (event.type === "done") {
            onDone(event);
          } else if (event.type === "error") {
            throw new Error(event.message || "Stream error");
          }
        } catch (parseErr) {
          // Nem valid JSON sor - kihagyjuk (pl. keep-alive komment)
          console.warn("[LeadWidget] SSE parse error:", parseErr);
        }
      }
    }
  }

  // =====================================================
  // 9. CONVERSATION INDÍTÁS
  // =====================================================

  async function startConversation() {
    // Azonnal mutatunk egy üdvözlő üzenetet - nem kell API-t megvárni
    addMessage("bot", "Hi! \uD83D\uDC4B " + config.subtitle);

    // Conversation létrehozása / résume a backendnél
    if (!state.conversationId) {
      try {
        await initConversation();
      } catch (e) {
        console.error("[LeadWidget] Conversation init failed:", e);
        // Nem blokkoljuk a felhasználót - majd küldéskor próbálkozunk újra
      }
    }

    // Input engedélyezése (startConversation előtt disabled volt)
    updateSendBtn();
  }

  // =====================================================
  // 10. ÜZENET KÜLDÉSE
  // =====================================================

  async function handleSend() {
    var text = elInput.value.trim();
    if (!text || state.isLoading) return;

    // Ha még nincs conversation (pl. init hiba), próbáljuk újra
    if (!state.conversationId) {
      try {
        await initConversation();
      } catch (e) {
        addMessage("bot", "Connection error. Please refresh the page.");
        return;
      }
    }

    // UI azonnali visszajelzés: üzenet megjelenik azonnal, input törlődik
    addMessage("user", text);
    elInput.value = "";
    elInput.style.height = "auto"; // textarea visszaáll 1 sorra
    state.isLoading = true;
    updateSendBtn();
    setTyping(true);

    // Az élő streaming bot üzenet DOM eleme (progresszívan töltjük)
    var botMsgEl    = null;
    var botBubbleEl = null;
    var accumulated = ""; // eddig kapott szöveg összesen

    try {
      await sendStreamingMessage(
        text,

        // onChunk: minden szövegtöredéknél hívódik
        function onChunk(chunk) {
          // Első chunk érkezésekor: typing indicator el, üres buborék létrehozása
          if (!botMsgEl) {
            setTyping(false);

            botMsgEl    = document.createElement("div");
            botMsgEl.className = "msg bot";
            botBubbleEl = document.createElement("div");
            botBubbleEl.className = "bubble";
            botMsgEl.appendChild(botBubbleEl);
            elMessages.appendChild(botMsgEl);
            // state.messages-be placeholder (onDone majd felülírja)
            state.messages.push({ role: "bot", content: "" });
          }

          accumulated += chunk;
          // textContent = XSS-biztos (nem innerHTML), folyamatosan frissül
          botBubbleEl.textContent = accumulated;
          scrollToBottom();
        },

        // onDone: stream vége, teljes szöveg + metadata megvan
        function onDone(event) {
          var finalText = event.assistant_message || accumulated;

          // Frissítjük a DOM-ot a végleges szöveggel (esetleg különbözhet)
          if (botBubbleEl) {
            botBubbleEl.textContent = finalText;
          }

          // state.messages utolsó bejegyzése a kész szöveg
          if (state.messages.length > 0) {
            state.messages[state.messages.length - 1].content = finalText;
          }

          if (event.lead_capture) {
            console.log("[LeadWidget] Lead captured:", event.lead_capture.lead_id);
          }
        }
      );

    } catch (e) {
      setTyping(false);
      console.error("[LeadWidget] Send error:", e);
      // Ha a streaming közben szakadt meg, és van részleges szöveg - megtartjuk
      if (!botMsgEl) {
        addMessage("bot", "Connection error. Please check your internet and try again.");
      }
    } finally {
      state.isLoading = false;
      updateSendBtn();
    }
  }

  // =====================================================
  // 11. EVENT LISTENERS
  // =====================================================
  // Az összes user interakció kezelése itt van összegyűjtve.

  // Bubble gomb: megnyitás / bezárás (toggle)
  elBubble.addEventListener("click", function () {
    toggleWindow(!state.isOpen);
  });

  // X gomb a fejlécben: bezárás
  elCloseBtn.addEventListener("click", function () {
    toggleWindow(false);
  });

  // Input mező változás: send gomb frissítése + textarea auto-resize
  elInput.addEventListener("input", function () {
    updateSendBtn();
    // Auto-resize: textarea nőjön a tartalom szerint (max 100px)
    elInput.style.height = "auto";
    elInput.style.height = Math.min(elInput.scrollHeight, 100) + "px";
  });

  // Enter = küldés, Shift+Enter = új sor (normál textarea viselkedés)
  elInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // megakadályozza az új sort
      handleSend();
    }
  });

  // Send gomb kattintás
  elSendBtn.addEventListener("click", handleSend);

  // ESC billentyű: bezárás (akadálymentesség)
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && state.isOpen) {
      toggleWindow(false);
    }
  });

  // =====================================================
  // 12. KEZDETI ÁLLAPOT
  // =====================================================

  // Üres állapot megjelenítése induláskor (mielőtt bármit küldene)
  elMessages.innerHTML = [
    '<div id="empty-state">',
    '  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">',
    '    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    '  </svg>',
    '  <strong>Questions? We\'re here!</strong>',
    '  <span>Start a conversation below.</span>',
    '</div>',
  ].join("");

  console.log("[LeadWidget] Ready. Org:", config.orgId, "| Base URL:", config.baseUrl);

// IIFE lezárása - a "()" a végén azonnal futtatja a függvényt
}());
