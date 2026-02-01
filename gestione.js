// GESTIONE FAZIONI - Sistema Completo
console.log('🔄 Caricamento gestione.js...');

// ═══════════════════════════════════════════════════════════════════════
// MODAL + TOAST STYLES — iniettati dinamicamente
// ═══════════════════════════════════════════════════════════════════════
(function injectStyles() {
    if (document.getElementById('__qm_styles__')) return;
    const s = document.createElement('style');
    s.id = '__qm_styles__';
    s.textContent = `
    /* ────────────────── OVERLAY ────────────────── */
    .qm-overlay {
        position: fixed; inset: 0; z-index: 99999;
        background: rgba(8, 10, 18, 0.7);
        backdrop-filter: blur(8px) saturate(1.2);
        display: flex; align-items: center; justify-content: center;
        opacity: 0; pointer-events: none;
        transition: opacity .3s ease;
    }
    .qm-overlay.open { opacity: 1; pointer-events: all; }

    /* ────────────────── CARD ────────────────── */
    .qm-card {
        position: relative;
        width: 92%; max-width: 580px;
        background: #12141c;
        border: 1px solid rgba(99,102,241,.22);
        border-radius: 22px;
        box-shadow:
            0 0 0 1px rgba(99,102,241,.08),
            0 28px 60px rgba(0,0,0,.55),
            0 8px 24px rgba(0,0,0,.3);
        overflow: hidden;
        transform: translateY(28px) scale(.97);
        transition: transform .38s cubic-bezier(.32,1.2,.6,1);
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        color: #dde1ea;
    }
    .qm-overlay.open .qm-card { transform: translateY(0) scale(1); }

    /* ────────────────── ACCENT ────────────────── */
    .qm-accent {
        height: 3px;
        background: linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa, #8b5cf6, #6366f1);
        background-size: 260% 100%;
        animation: accentMove 2.4s linear infinite;
    }
    @keyframes accentMove { to { background-position: 260% 0; } }

    /* ────────────────── CLOSE BTN ────────────────── */
    .qm-close {
        position: absolute; top: 16px; right: 20px; z-index: 2;
        background: none; border: none;
        color: #4a4e5c; font-size: 22px; line-height: 1;
        cursor: pointer; transition: color .2s;
    }
    .qm-close:hover { color: #e74c3c; }

    /* ────────────────── HEADER ────────────────── */
    .qm-head {
        padding: 24px 28px 10px;
        display: flex; align-items: center; gap: 14px;
    }
    .qm-head-ico {
        width: 44px; height: 44px; border-radius: 13px; flex-shrink: 0;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        box-shadow: 0 4px 16px rgba(99,102,241,.4);
        display: flex; align-items: center; justify-content: center;
        font-size: 20px;
        transition: transform .3s cubic-bezier(.32,1.2,.6,1);
    }
    .qm-overlay.open .qm-head-ico { transform: scale(1) rotate(0deg); }

    .qm-head-txt h2 { margin: 0; font-size: 17px; font-weight: 650; color: #fff; letter-spacing: -.2px; }
    .qm-head-txt p { margin: 3px 0 0; font-size: 12.5px; color: #565b6e; }

    /* ────────────────── PROGRESS ────────────────── */
    .qm-prog-track {
        margin: 14px 28px 0; height: 2.5px;
        background: #1e2030; border-radius: 2px; overflow: hidden;
    }
    .qm-prog-fill {
        height: 100%; border-radius: 2px;
        background: linear-gradient(90deg, #6366f1, #8b5cf6);
        transition: width .45s cubic-bezier(.4,0,.2,1);
    }
    .qm-step-info {
        margin: 7px 28px 0; font-size: 10.5px;
        color: #3f4352; text-transform: uppercase; letter-spacing: .9px; font-weight: 600;
    }

    /* ────────────────── BODY ────────────────── */
    .qm-body {
        padding: 20px 28px 8px;
        max-height: 400px; overflow-y: auto; overflow-x: hidden;
    }
    .qm-body::-webkit-scrollbar { width: 5px; }
    .qm-body::-webkit-scrollbar-track { background: transparent; }
    .qm-body::-webkit-scrollbar-thumb { background: #2a2d3c; border-radius: 3px; }

    /* ────────────────── STEPS ────────────────── */
    .qm-step { display: none; }
    .qm-step.visible {
        display: block;
        animation: stepSlide .34s cubic-bezier(.4,0,.2,1) both;
    }
    .qm-step.visible.rev { animation-name: stepSlideRev; }
    @keyframes stepSlide    { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
    @keyframes stepSlideRev { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }

    /* ────────────────── LABELS ────────────────── */
    .qm-label {
        display: block; font-size: 12px; font-weight: 600;
        color: #6366f1; text-transform: uppercase;
        letter-spacing: .7px; margin-bottom: 9px;
    }

    /* ────────────────── INPUTS ────────────────── */
    .qm-input {
        width: 100%; box-sizing: border-box;
        background: #0f1018; border: 1.5px solid #252838;
        border-radius: 10px; padding: 11px 14px;
        color: #dde1ea; font-size: 14px; font-family: inherit;
        outline: none; transition: border-color .25s, box-shadow .25s;
    }
    .qm-input:focus {
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99,102,241,.18);
    }
    .qm-input::placeholder { color: #3d4155; }
    .qm-textarea {
        resize: vertical; min-height: 60px; line-height: 1.5;
    }

    /* ────────────────── TYPE GRID ────────────────── */
    .qm-type-grid {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px;
    }
    .qm-type-btn {
        background: #0f1018; border: 1.5px solid #252838;
        border-radius: 13px; padding: 15px 6px 13px;
        cursor: pointer; text-align: center;
        display: flex; flex-direction: column; align-items: center; gap: 8px;
        transition: all .22s cubic-bezier(.4,0,.2,1);
        position: relative; overflow: hidden;
    }
    .qm-type-btn::before {
        content: ''; position: absolute; inset: 0;
        background: radial-gradient(circle at center, rgba(99,102,241,.08), transparent 70%);
        opacity: 0; transition: opacity .3s;
    }
    .qm-type-btn:hover { border-color: #6366f1; transform: translateY(-2px); }
    .qm-type-btn:hover::before { opacity: 1; }
    .qm-type-btn.picked {
        border-color: #6366f1;
        background: rgba(99,102,241,.07);
        box-shadow: 0 0 0 2px rgba(99,102,241,.25), 0 6px 18px rgba(99,102,241,.15);
    }
    .qm-type-btn.picked::before { opacity: 1; }
    .qm-type-ico {
        position: relative; z-index: 1;
        width: 34px; height: 34px; border-radius: 9px;
        background: #1a1d2a;
        display: flex; align-items: center; justify-content: center;
        font-size: 17px; transition: background .22s;
    }
    .qm-type-btn:hover .qm-type-ico,
    .qm-type-btn.picked .qm-type-ico { background: rgba(99,102,241,.22); }
    .qm-type-btn span {
        position: relative; z-index: 1;
        font-size: 10.5px; color: #6b7080; font-weight: 500; line-height: 1.35;
    }
    .qm-type-btn.picked span { color: #a5b4fc; }

    /* ────────────────── OPTION ROWS ────────────────── */
    .qm-opt-row {
        display: flex; align-items: center; gap: 8px;
        animation: optPop .22s cubic-bezier(.4,0,.2,1) both;
    }
    @keyframes optPop { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
    .qm-opt-dot {
        width: 7px; height: 7px; border-radius: 50%;
        background: #6366f1; flex-shrink: 0;
    }
    .qm-opt-row .qm-input { flex: 1; padding: 9px 12px; font-size: 13px; }
    .qm-opt-del {
        background: none; border: none; color: #3d4155;
        font-size: 19px; cursor: pointer; padding: 0 3px;
        transition: color .18s; line-height: 1;
    }
    .qm-opt-del:hover { color: #e74c3c; }
    .qm-add-opt {
        width: 100%; margin-top: 6px;
        background: none; border: 1.5px dashed #252838;
        border-radius: 9px; padding: 9px; color: #6366f1;
        font-size: 12.5px; cursor: pointer; font-family: inherit;
        transition: all .2s;
    }
    .qm-add-opt:hover { border-color: #6366f1; background: rgba(99,102,241,.05); }

    /* ────────────────── SCALE PREVIEW ────────────────── */
    .qm-scale-row {
        display: flex; gap: 5px; align-items: center; justify-content: center;
        padding: 14px 0 6px; flex-wrap: wrap;
    }
    .qm-scale-dot {
        width: 30px; height: 30px; border-radius: 50%;
        background: #1a1d2a; border: 2px solid #252838;
        display: flex; align-items: center; justify-content: center;
        font-size: 12px; color: #6b7080; font-weight: 600;
        transition: all .2s;
    }
    .qm-scale-dot.mid {
        background: linear-gradient(135deg,#6366f1,#8b5cf6);
        border-color: transparent; color: #fff; transform: scale(1.12);
    }
    .qm-scale-lbl-row {
        display: flex; justify-content: space-between; gap: 10px; margin-top: 8px;
    }
    .qm-scale-lbl-row .qm-input {
        flex: 1; padding: 7px 10px; font-size: 12px;
    }

    /* ────────────────── RATING STARS ────────────────── */
    .qm-stars { display: flex; gap: 6px; justify-content: center; padding: 12px 0; }
    .qm-star {
        font-size: 28px; color: #252838; cursor: pointer;
        transition: color .15s, transform .15s; user-select: none;
    }
    .qm-star.lit { color: #fbbf24; transform: scale(1.15); }

    /* ────────────────── TOGGLE ────────────────── */
    .qm-tog-row {
        display: flex; align-items: center; justify-content: space-between;
        background: #0f1018; border: 1.5px solid #252838;
        border-radius: 10px; padding: 12px 16px;
    }
    .qm-tog-row label { font-size: 13px; color: #a0a3b1; font-weight: 500; }
    .qm-tog {
        position: relative; width: 42px; height: 23px;
        background: #252838; border-radius: 12px;
        border: none; cursor: pointer;
        transition: background .28s;
    }
    .qm-tog.on { background: #6366f1; }
    .qm-tog::after {
        content: ''; position: absolute; top: 3px; left: 3px;
        width: 17px; height: 17px; border-radius: 50%;
        background: #fff; transition: left .28s cubic-bezier(.4,0,.2,1);
        box-shadow: 0 1px 3px rgba(0,0,0,.3);
    }
    .qm-tog.on::after { left: 22px; }

    /* ────────────────── SCORE INPUT ────────────────── */
    .qm-score-row { display: flex; align-items: center; gap: 10px; }
    .qm-score-row .qm-input {
        width: 90px; text-align: center; font-size: 20px;
        font-weight: 700; color: #a5b4fc; letter-spacing: -.5px;
    }
    .qm-score-row .qm-score-unit { font-size: 12.5px; color: #3d4155; }

    /* ────────────────── HINT ────────────────── */
    .qm-hint { font-size: 11px; color: #3d4155; margin-top: 6px; font-style: italic; }

    /* ────────────────── REVIEW CARD ────────────────── */
    .qm-review {
        background: #0f1018; border: 1px solid #252838;
        border-radius: 14px; padding: 20px;
    }
    .qm-review-head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .qm-review-ico {
        width: 38px; height: 38px; border-radius: 10px;
        background: rgba(99,102,241,.15);
        display: flex; align-items: center; justify-content: center; font-size: 18px;
    }
    .qm-review-type { font-size: 10.5px; color: #6366f1; text-transform: uppercase; letter-spacing: .6px; font-weight: 600; }
    .qm-review-q { font-size: 15px; color: #fff; font-weight: 600; margin-top: 2px; }
    .qm-review-divider { border: none; border-top: 1px solid #1e2030; margin: 14px 0; }
    .qm-review-section { margin-bottom: 12px; }
    .qm-review-section-title { font-size: 10px; color: #3d4155; text-transform: uppercase; letter-spacing: .7px; font-weight: 600; margin-bottom: 6px; }
    .qm-review-opt { font-size: 13px; color: #9a9eb0; padding: 3px 0; display: flex; align-items: center; gap: 7px; }
    .qm-review-opt::before { content:''; width:5px; height:5px; border-radius:50%; background:#6366f1; flex-shrink:0; }
    .qm-review-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
    .qm-review-tag {
        background: #1a1d2a; border-radius: 8px;
        padding: 6px 11px; font-size: 11.5px; color: #8b90a0;
    }
    .qm-review-tag strong { color: #dde1ea; }

    /* ────────────────── FOOTER ────────────────── */
    .qm-foot {
        padding: 16px 28px 22px;
        display: flex; justify-content: flex-end; gap: 9px;
    }
    .qm-btn {
        padding: 10px 20px; border-radius: 10px; border: none;
        font-size: 13px; font-weight: 600; cursor: pointer;
        font-family: inherit; transition: all .22s cubic-bezier(.4,0,.2,1);
        display: flex; align-items: center; gap: 5px;
    }
    .qm-btn-back { background: #1a1d2a; color: #8b90a0; }
    .qm-btn-back:hover { background: #222638; color: #fff; }
    .qm-btn-next {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: #fff;
        box-shadow: 0 4px 16px rgba(99,102,241,.35);
    }
    .qm-btn-next:hover { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(99,102,241,.45); }
    .qm-btn-next:disabled { opacity: .35; pointer-events: none; transform: none; box-shadow: none; }
    .qm-btn-save {
        background: linear-gradient(135deg, #22c55e, #16a34a);
        color: #fff;
        box-shadow: 0 4px 16px rgba(34,197,94,.3);
    }
    .qm-btn-save:hover { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(34,197,94,.4); }

    /* ────────────────── TOAST ────────────────── */
    .qm-toast {
        position: fixed; bottom: 28px; left: 50%;
        transform: translateX(-50%) translateY(90px);
        z-index: 100000;
        background: #12141c; border: 1px solid #252838;
        border-radius: 14px; padding: 13px 20px;
        display: flex; align-items: center; gap: 12px;
        box-shadow: 0 12px 40px rgba(0,0,0,.45);
        transition: transform .38s cubic-bezier(.32,1.2,.6,1), opacity .3s;
        opacity: 0; pointer-events: none;
        font-family: 'Segoe UI', system-ui, sans-serif;
        color: #dde1ea; font-size: 13.5px; white-space: nowrap;
    }
    .qm-toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }
    .qm-toast-ico {
        width: 34px; height: 34px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 16px; flex-shrink: 0;
    }
    .qm-toast.ok .qm-toast-ico { background: rgba(34,197,94,.18); }
    .qm-toast.err .qm-toast-ico { background: rgba(239,68,68,.18); }
    .qm-toast-bar {
        position: absolute; bottom: 0; left: 0; height: 2.5px;
        border-radius: 0 0 14px 14px;
        animation: toastDrain 2.6s linear forwards;
    }
    .qm-toast.ok .qm-toast-bar { background: #22c55e; }
    .qm-toast.err .qm-toast-bar { background: #ef4444; }
    @keyframes toastDrain { from { width:100%; } to { width:0; } }
    `;
    document.head.appendChild(s);
})();


// ═══════════════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════════════
function showToast(msg, type = 'ok') {
    let t = document.getElementById('__qm_toast__');
    if (!t) {
        t = document.createElement('div');
        t.className = 'qm-toast';
        t.id = '__qm_toast__';
        t.innerHTML = '<div class="qm-toast-ico"></div><span class="qm-toast-msg"></span><div class="qm-toast-bar"></div>';
        document.body.appendChild(t);
    }
    t.className = 'qm-toast ' + type;
    t.querySelector('.qm-toast-ico').textContent = type === 'ok' ? '✅' : '❌';
    t.querySelector('.qm-toast-msg').textContent = msg;
    var bar = t.querySelector('.qm-toast-bar');
    bar.style.animation = 'none';
    void bar.offsetWidth;
    bar.style.animation = '';
    requestAnimationFrame(function(){ t.classList.add('show'); });
    setTimeout(function(){ t.classList.remove('show'); }, 2700);
}


// ═══════════════════════════════════════════════════════════════════════
// QUESTION TYPES — tutti i 12 tipi di Google Forms
// ═══════════════════════════════════════════════════════════════════════
var QM_TYPES = [
    { id:'short',       ico:'─',   name:'Risposta breve' },
    { id:'paragraph',   ico:'☰',   name:'Paragrafo' },
    { id:'multiple',    ico:'◉',   name:'Scelta multipla' },
    { id:'checkbox',    ico:'☑',   name:'Caselle controllo' },
    { id:'dropdown',    ico:'▼',   name:'Elenco a discesa' },
    { id:'file',        ico:'📎',  name:'Caricamento file' },
    { id:'scale',       ico:'↔',   name:'Scala lineare' },
    { id:'rating',      ico:'★',   name:'Classificazione' },
    { id:'grid_multi',  ico:'⊞',   name:'Griglia multipla' },
    { id:'grid_check',  ico:'⊟',   name:'Griglia controllo' },
    { id:'date',        ico:'📅',  name:'Data' },
    { id:'time',        ico:'🕐',  name:'Ora' }
];

var NEEDS_OPTIONS = ['multiple','checkbox','dropdown'];
var NEEDS_GRID    = ['grid_multi','grid_check'];


// ═══════════════════════════════════════════════════════════════════════
// MODAL STATE
// ═══════════════════════════════════════════════════════════════════════
var _ms = {};
function _resetState() {
    _ms = {
        step: 0, type: null, text: '',
        options: ['Opzione 1','Opzione 2'],
        rows: ['Riga 1','Riga 2'],
        cols: ['Colonna 1','Colonna 2','Colonna 3'],
        scaleMin: 1, scaleMax: 5, scaleMinLbl: '', scaleMaxLbl: '',
        required: false, maxScore: null
    };
}


// ═══════════════════════════════════════════════════════════════════════
// OPEN / CLOSE
// ═══════════════════════════════════════════════════════════════════════
function addQuestion() {
    _resetState();
    _ensureDOM();
    _render();
    requestAnimationFrame(function(){ document.getElementById('__qm_ov__').classList.add('open'); });
}

function _close() {
    var ov = document.getElementById('__qm_ov__');
    if (ov) ov.classList.remove('open');
}


// ═══════════════════════════════════════════════════════════════════════
// ENSURE DOM
// ═══════════════════════════════════════════════════════════════════════
function _ensureDOM() {
    if (document.getElementById('__qm_ov__')) return;
    var ov = document.createElement('div');
    ov.className = 'qm-overlay'; ov.id = '__qm_ov__';
    ov.addEventListener('click', function(e){ if (e.target === ov) _close(); });
    ov.innerHTML =
        '<div class="qm-card">' +
            '<div class="qm-accent"></div>' +
            '<button class="qm-close" onclick="_close()">×</button>' +
            '<div class="qm-head">' +
                '<div class="qm-head-ico" id="__ico__">📝</div>' +
                '<div class="qm-head-txt">' +
                    '<h2 id="__title__">Nuova Domanda</h2>' +
                    '<p id="__sub__">Seleziona il tipo</p>' +
                '</div>' +
            '</div>' +
            '<div class="qm-prog-track"><div class="qm-prog-fill" id="__prog__" style="width:25%"></div></div>' +
            '<div class="qm-step-info" id="__info__">Passo 1 / 4 — Tipo</div>' +
            '<div class="qm-body" id="__body__"></div>' +
            '<div class="qm-foot" id="__foot__"></div>' +
        '</div>';
    document.body.appendChild(ov);
}


// ═══════════════════════════════════════════════════════════════════════
// RENDER STEP
// ═══════════════════════════════════════════════════════════════════════
function _render(dir) {
    if (dir === undefined) dir = 1;
    var body  = document.getElementById('__body__');
    var foot  = document.getElementById('__foot__');
    var prog  = document.getElementById('__prog__');
    var info  = document.getElementById('__info__');
    var ico   = document.getElementById('__ico__');
    var title = document.getElementById('__title__');
    var sub   = document.getElementById('__sub__');

    prog.style.width = (((_ms.step + 1) / 4) * 100) + '%';
    var stepNames = ['Tipo','Domanda','Configurazione','Conferma'];
    info.textContent = 'Passo ' + (_ms.step + 1) + ' / 4 — ' + stepNames[_ms.step];

    var dirCls = dir < 0 ? ' rev' : '';
    var html = '', footHtml = '';
    var tp;

    switch (_ms.step) {
        /* ─── 0: TIPO ─── */
        case 0:
            ico.textContent   = '📝';
            title.textContent = 'Nuova Domanda';
            sub.textContent   = 'Seleziona il tipo di domanda';
            html = '<div class="qm-step visible' + dirCls + '">' +
                '<div class="qm-type-grid">' +
                    QM_TYPES.map(function(t){
                        return '<button class="qm-type-btn' + (_ms.type===t.id?' picked':'') + '" onclick="_pickType(\'' + t.id + '\')">' +
                            '<div class="qm-type-ico">' + t.ico + '</div>' +
                            '<span>' + t.name + '</span>' +
                        '</button>';
                    }).join('') +
                '</div>' +
            '</div>';
            footHtml = '<button class="qm-btn qm-btn-next" id="__next__" onclick="_next()"' + (!_ms.type?' disabled':'') + '>Avanti →</button>';
            break;

        /* ─── 1: TESTO ─── */
        case 1:
            tp = QM_TYPES.find(function(t){ return t.id===_ms.type; });
            ico.textContent   = tp.ico;
            title.textContent = 'Testo della Domanda';
            sub.textContent   = 'Tipo: ' + tp.name;

            var extra1 = '';
            if (_ms.type === 'scale')  extra1 = _renderScaleCfg();
            if (_ms.type === 'rating') extra1 = _renderRatingPrev();
            if (_ms.type === 'date')   extra1 = '<p class="qm-hint">Il candidato selezionerà una data dal datepicker.</p>';
            if (_ms.type === 'time')   extra1 = '<p class="qm-hint">Il candidato inserirà un orario.</p>';
            if (_ms.type === 'file')   extra1 = '<p class="qm-hint">Il candidato potrà caricare un file.</p>';

            html = '<div class="qm-step visible' + dirCls + '">' +
                '<label class="qm-label">Domanda</label>' +
                '<textarea class="qm-input qm-textarea" id="__qtxt__" placeholder="Es. Qual è la tua esperienza professionale?" oninput="_syncTxt()">' + _ms.text + '</textarea>' +
                extra1 +
            '</div>';
            footHtml = '<button class="qm-btn qm-btn-back" onclick="_back()">← Indietro</button>' +
                       '<button class="qm-btn qm-btn-next" id="__next__" onclick="_next()"' + (!_ms.text.trim()?' disabled':'') + '>Avanti →</button>';
            break;

        /* ─── 2: CONFIG ─── */
        case 2:
            ico.textContent   = '⚙️';
            title.textContent = 'Configurazione';
            sub.textContent   = 'Opzioni, punteggio e obbligatoria';

            var hasExtras = NEEDS_OPTIONS.includes(_ms.type) || NEEDS_GRID.includes(_ms.type);
            var extras2 = '';
            if (NEEDS_OPTIONS.includes(_ms.type)) extras2 += _renderOptEditor();
            if (NEEDS_GRID.includes(_ms.type))    extras2 += _renderGridEditor();

            html = '<div class="qm-step visible' + dirCls + '">' +
                extras2 +
                '<label class="qm-label" style="margin-top:' + (hasExtras?'18px':'0') + '">Punteggio Massimo</label>' +
                '<div class="qm-score-row">' +
                    '<input type="text" inputmode="numeric" class="qm-input" id="__score__" placeholder="0" value="' + (_ms.maxScore!==null?_ms.maxScore:'') + '" oninput="_syncScore(this)">' +
                    '<span class="qm-score-unit">punti</span>' +
                '</div>' +
                '<p class="qm-hint">Solo numeri interi positivi. Lascia vuoto se non necessario.</p>' +
                '<div class="qm-tog-row" style="margin-top:16px;">' +
                    '<label>Domanda obbligatoria</label>' +
                    '<button class="qm-tog' + (_ms.required?' on':'') + '" onclick="_togReq()"></button>' +
                '</div>' +
            '</div>';
            footHtml = '<button class="qm-btn qm-btn-back" onclick="_back()">← Indietro</button>' +
                       '<button class="qm-btn qm-btn-next" id="__next__" onclick="_next()">Avanti →</button>';
            break;

        /* ─── 3: REVIEW ─── */
        case 3:
            ico.textContent   = '✨';
            title.textContent = 'Conferma';
            sub.textContent   = 'Revisiona prima di salvare';
            html = '<div class="qm-step visible' + dirCls + '">' + _renderReview() + '</div>';
            footHtml = '<button class="qm-btn qm-btn-back" onclick="_back()">← Indietro</button>' +
                       '<button class="qm-btn qm-btn-save" onclick="_save()">💾 Salva Domanda</button>';
            break;
    }

    body.innerHTML = html;
    foot.innerHTML = footHtml;
}


// ═══════════════════════════════════════════════════════════════════════
// NAV
// ═══════════════════════════════════════════════════════════════════════
function _next() {
    if (_ms.step === 0 && !_ms.type)        return;
    if (_ms.step === 1 && !_ms.text.trim()) return;
    _ms.step++;
    _render(1);
}
function _back() {
    if (_ms.step > 0) { _ms.step--; _render(-1); }
}


// ═══════════════════════════════════════════════════════════════════════
// STEP 0 — pick type
// ═══════════════════════════════════════════════════════════════════════
function _pickType(id) {
    _ms.type = id;
    var grid = document.querySelector('.qm-type-grid');
    if (grid) {
        grid.innerHTML = QM_TYPES.map(function(t){
            return '<button class="qm-type-btn' + (_ms.type===t.id?' picked':'') + '" onclick="_pickType(\'' + t.id + '\')">' +
                '<div class="qm-type-ico">' + t.ico + '</div>' +
                '<span>' + t.name + '</span>' +
            '</button>';
        }).join('');
    }
    var btn = document.getElementById('__next__');
    if (btn) btn.disabled = false;
}


// ═══════════════════════════════════════════════════════════════════════
// STEP 1 — text sync + scale + rating
// ═══════════════════════════════════════════════════════════════════════
function _syncTxt() {
    var el = document.getElementById('__qtxt__');
    if (el) _ms.text = el.value;
    var btn = document.getElementById('__next__');
    if (btn) btn.disabled = !_ms.text.trim();
}

function _renderScaleCfg() {
    var dots = '';
    var mid = Math.round((_ms.scaleMin + _ms.scaleMax) / 2);
    for (var i = _ms.scaleMin; i <= _ms.scaleMax; i++) {
        dots += '<div class="qm-scale-dot' + (i===mid?' mid':'') + '">' + i + '</div>';
    }
    return '<div style="margin-top:20px;">' +
        '<label class="qm-label">Intervallo scala</label>' +
        '<div class="qm-scale-row">' + dots + '</div>' +
        '<div style="display:flex;gap:10px;align-items:center;justify-content:center;margin-top:4px;">' +
            '<input type="number" class="qm-input" style="width:70px;text-align:center;padding:7px;" min="0" max="9" value="' + _ms.scaleMin + '" oninput="_syncScale(\'min\',this.value)">' +
            '<span style="color:#3d4155;font-size:13px;">→</span>' +
            '<input type="number" class="qm-input" style="width:70px;text-align:center;padding:7px;" min="2" max="10" value="' + _ms.scaleMax + '" oninput="_syncScale(\'max\',this.value)">' +
        '</div>' +
        '<div class="qm-scale-lbl-row" style="margin-top:10px;">' +
            '<input type="text" class="qm-input" placeholder="Es. Poco d\'accordo" value="' + _ms.scaleMinLbl + '" oninput="_ms.scaleMinLbl=this.value">' +
            '<input type="text" class="qm-input" placeholder="Es. Molto d\'accordo" value="' + _ms.scaleMaxLbl + '" oninput="_ms.scaleMaxLbl=this.value">' +
        '</div>' +
    '</div>';
}

function _syncScale(which, val) {
    var n = parseInt(val, 10);
    if (isNaN(n)) return;
    if (which === 'min') _ms.scaleMin = Math.max(0, Math.min(n, _ms.scaleMax - 1));
    else                 _ms.scaleMax = Math.max(_ms.scaleMin + 1, Math.min(n, 10));
    // re-render step 1 body
    var body = document.getElementById('__body__');
    body.innerHTML = '<div class="qm-step visible">' +
        '<label class="qm-label">Domanda</label>' +
        '<textarea class="qm-input qm-textarea" id="__qtxt__" placeholder="Es. Qual è la tua esperienza professionale?" oninput="_syncTxt()">' + _ms.text + '</textarea>' +
        _renderScaleCfg() +
    '</div>';
}

function _renderRatingPrev() {
    var stars = '';
    for (var i = 1; i <= 5; i++) {
        stars += '<div class="qm-star" onmouseenter="_starHov(' + i + ')" onmouseleave="_starUnhov()" onclick="_starClick(' + i + ')">★</div>';
    }
    return '<div style="margin-top:18px;">' +
        '<label class="qm-label">Anteprima classificazione</label>' +
        '<div class="qm-stars">' + stars + '</div>' +
        '<p class="qm-hint">Questa è solo un\'anteprima di come apparirà al candidato.</p>' +
    '</div>';
}
function _starHov(n)   { document.querySelectorAll('.qm-star').forEach(function(s,i){ s.classList.toggle('lit', i<n); }); }
function _starUnhov()  { document.querySelectorAll('.qm-star').forEach(function(s){ s.classList.remove('lit'); }); }
function _starClick(n) { document.querySelectorAll('.qm-star').forEach(function(s,i){ s.classList.toggle('lit', i<n); }); }


// ═══════════════════════════════════════════════════════════════════════
// STEP 2 — options / grid / score / required
// ═══════════════════════════════════════════════════════════════════════

// Score: accetta SOLO cifre (intero positivo non negativo)
function _syncScore(el) {
    var v = el.value.replace(/[^0-9]/g, '');
    el.value = v;
    _ms.maxScore = v === '' ? null : parseInt(v, 10);
}

function _togReq() {
    _ms.required = !_ms.required;
    var btn = document.querySelector('.qm-tog');
    if (btn) btn.classList.toggle('on', _ms.required);
}

/* ── Options editor ── */
function _renderOptEditor() {
    var rows = '';
    for (var i = 0; i < _ms.options.length; i++) {
        rows += _optRow(_ms.options[i], i);
    }
    return '<label class="qm-label">Opzioni di risposta</label>' +
        '<div id="__opts__">' + rows + '</div>' +
        '<button class="qm-add-opt" onclick="_addOpt()">+ Aggiungi opzione</button>';
}
function _optRow(val, i) {
    return '<div class="qm-opt-row" style="animation-delay:' + (i*.05) + 's">' +
        '<div class="qm-opt-dot"></div>' +
        '<input type="text" class="qm-input" value="' + val + '" oninput="_ms.options[' + i + ']=this.value">' +
        '<button class="qm-opt-del" onclick="_delOpt(' + i + ')">×</button>' +
    '</div>';
}
function _addOpt() {
    _ms.options.push('Opzione ' + (_ms.options.length+1));
    var el = document.getElementById('__opts__');
    if (el) {
        var h = '';
        for (var i = 0; i < _ms.options.length; i++) h += _optRow(_ms.options[i], i);
        el.innerHTML = h;
    }
}
function _delOpt(i) {
    if (_ms.options.length <= 1) return;
    _ms.options.splice(i,1);
    var el = document.getElementById('__opts__');
    if (el) {
        var h = '';
        for (var j = 0; j < _ms.options.length; j++) h += _optRow(_ms.options[j], j);
        el.innerHTML = h;
    }
}

/* ── Grid editor ── */
function _renderGridEditor() {
    var rowsH = '', colsH = '';
    for (var i = 0; i < _ms.rows.length; i++) rowsH += _gridRow(_ms.rows[i], i, 'rows');
    for (var j = 0; j < _ms.cols.length; j++) colsH += _gridRow(_ms.cols[j], j, 'cols');
    return '<div id="__grid__">' +
        '<label class="qm-label">Righe (domande)</label>' +
        '<div id="__grows__">' + rowsH + '</div>' +
        '<button class="qm-add-opt" onclick="_addGridItem(\'rows\')">+ Aggiungi riga</button>' +
        '<label class="qm-label" style="margin-top:16px;">Colonne (opzioni)</label>' +
        '<div id="__gcols__">' + colsH + '</div>' +
        '<button class="qm-add-opt" onclick="_addGridItem(\'cols\')">+ Aggiungi colonna</button>' +
    '</div>';
}
function _gridRow(val, i, arr) {
    var color = arr==='rows' ? '#8b5cf6' : '#22c55e';
    return '<div class="qm-opt-row" style="animation-delay:' + (i*.05) + 's">' +
        '<div class="qm-opt-dot" style="background:' + color + '"></div>' +
        '<input type="text" class="qm-input" value="' + val + '" oninput="_ms.' + arr + '[' + i + ']=this.value">' +
        '<button class="qm-opt-del" onclick="_delGridItem(\'' + arr + '\',' + i + ')">×</button>' +
    '</div>';
}
function _addGridItem(arr) {
    var labels = { rows:'Riga', cols:'Colonna' };
    _ms[arr].push(labels[arr] + ' ' + (_ms[arr].length+1));
    _reRenderGrid();
}
function _delGridItem(arr, i) {
    if (_ms[arr].length <= 1) return;
    _ms[arr].splice(i,1);
    _reRenderGrid();
}
function _reRenderGrid() {
    var el = document.getElementById('__grid__');
    if (el) el.outerHTML = _renderGridEditor();
}


// ═══════════════════════════════════════════════════════════════════════
// STEP 3 — REVIEW
// ═══════════════════════════════════════════════════════════════════════
function _renderReview() {
    var tp = QM_TYPES.find(function(t){ return t.id===_ms.type; });
    var extra = '';

    if (NEEDS_OPTIONS.includes(_ms.type) && _ms.options.length) {
        extra += '<div class="qm-review-section">' +
            '<div class="qm-review-section-title">Opzioni</div>' +
            _ms.options.map(function(o){ return '<div class="qm-review-opt">' + o + '</div>'; }).join('') +
        '</div>';
    }
    if (NEEDS_GRID.includes(_ms.type)) {
        extra += '<div class="qm-review-section">' +
            '<div class="qm-review-section-title">Righe</div>' +
            _ms.rows.map(function(r){ return '<div class="qm-review-opt">' + r + '</div>'; }).join('') +
            '<div class="qm-review-section-title" style="margin-top:10px;">Colonne</div>' +
            _ms.cols.map(function(c){ return '<div class="qm-review-opt">' + c + '</div>'; }).join('') +
        '</div>';
    }
    if (_ms.type === 'scale') {
        extra += '<div class="qm-review-section">' +
            '<div class="qm-review-section-title">Scala</div>' +
            '<div style="font-size:13px;color:#9a9eb0;">' + _ms.scaleMin + ' → ' + _ms.scaleMax +
                (_ms.scaleMinLbl ? ' <span style="color:#3d4155;">(' + _ms.scaleMinLbl + ' … ' + _ms.scaleMaxLbl + ')</span>' : '') +
            '</div>' +
        '</div>';
    }

    return '<div class="qm-review">' +
        '<div class="qm-review-head">' +
            '<div class="qm-review-ico">' + tp.ico + '</div>' +
            '<div>' +
                '<div class="qm-review-type">' + tp.name + '</div>' +
                '<div class="qm-review-q">' + _ms.text + '</div>' +
            '</div>' +
        '</div>' +
        '<hr class="qm-review-divider">' +
        extra +
        '<div class="qm-review-tags">' +
            '<div class="qm-review-tag">📊 Punteggio max: <strong>' + (_ms.maxScore!==null ? _ms.maxScore+' pts' : 'Nessuno') + '</strong></div>' +
            '<div class="qm-review-tag">' + (_ms.required ? '🔴 Obbligatoria' : '⚪ Opzionale') + '</div>' +
        '</div>' +
    '</div>';
}


// ═══════════════════════════════════════════════════════════════════════
// SAVE
// ═══════════════════════════════════════════════════════════════════════
function _save() {
    var q = {
        question: _ms.text,
        type: _ms.type,
        required: _ms.required,
        maxScore: _ms.maxScore
    };
    if (NEEDS_OPTIONS.includes(_ms.type)) q.options = _ms.options.filter(function(o){ return o.trim(); });
    if (NEEDS_GRID.includes(_ms.type))    { q.gridRows = _ms.rows.filter(function(r){ return r.trim(); }); q.gridCols = _ms.cols.filter(function(c){ return c.trim(); }); }
    if (_ms.type === 'scale')             { q.scaleMin = _ms.scaleMin; q.scaleMax = _ms.scaleMax; q.scaleMinLabel = _ms.scaleMinLbl; q.scaleMaxLabel = _ms.scaleMaxLbl; }

    questions.push(q);
    saveQuestions();
    renderQuestions();
    _close();
    showToast('Domanda aggiunta con successo!', 'ok');
}


// ═══════════════════════════════════════════════════════════════════════
// CODICE ORIGINALE — invariato
// ═══════════════════════════════════════════════════════════════════════

window.addEventListener('load', function() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if (!user.isInstitutional && !user.isAdmin) {
        alert('⚠️ ACCESSO NEGATO\n\nQuesta sezione è riservata agli esponenti istituzionali.');
        window.location.href = 'home.html';
        return;
    }
    initializeFactionPanel(user);
});

const factionColors = {
    'Polizia di Stato': '#0066cc', 'Arma dei Carabinieri': '#cc0000', 'Polizia Locale': '#0099cc',
    'Guardia di Finanza': '#FFD700', 'Polizia Penitenziaria': '#8B4513', 'Vigili del Fuoco': '#FF4500',
    'Croce Rossa Italiana': '#DC143C', 'Croce Verde': '#228B22', 'ACI': '#0066cc'
};

const factionLogos = {
    'Polizia di Stato': 'https://via.placeholder.com/100/0066cc/FFFFFF?text=PS',
    'Arma dei Carabinieri': 'https://via.placeholder.com/100/cc0000/FFFFFF?text=CC',
    'Polizia Locale': 'https://via.placeholder.com/100/0099cc/FFFFFF?text=PL',
    'Guardia di Finanza': 'https://via.placeholder.com/100/FFD700/000000?text=GdF',
    'Polizia Penitenziaria': 'https://via.placeholder.com/100/8B4513/FFFFFF?text=PP',
    'Vigili del Fuoco': 'https://via.placeholder.com/100/FF4500/FFFFFF?text=VVF',
    'Croce Rossa Italiana': 'https://via.placeholder.com/100/DC143C/FFFFFF?text=CRI',
    'Croce Verde': 'https://via.placeholder.com/100/228B22/FFFFFF?text=CV',
    'ACI': 'https://via.placeholder.com/100/0066cc/FFFFFF?text=ACI'
};

function initializeFactionPanel(user) {
    const faction = user.faction;
    if (!faction) { alert('⚠️ Errore: Fazione non trovata!'); return; }
    
    const color = factionColors[faction];
    if (document.getElementById('userName')) document.getElementById('userName').textContent = user.username;
    if (document.getElementById('factionName')) {
        document.getElementById('factionName').textContent = faction;
        document.getElementById('factionName').style.color = color;
    }
    if (document.getElementById('factionLogo')) document.getElementById('factionLogo').src = factionLogos[faction];
    if (document.getElementById('factionTitle')) {
        document.getElementById('factionTitle').textContent = faction;
        document.getElementById('factionTitle').style.color = color;
    }
    
    loadFactionData(faction);
    loadWebhooks(faction);
    updateStatus(faction);
    loadQuestions(faction);
    loadApplications(faction);
    loadArchive(faction);
}

function sendDiscordWebhook(type, data) {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const faction = user.faction;
    const webhooks = JSON.parse(localStorage.getItem(`webhooks_${faction}`) || '{}');
    let webhookUrl = '', embed = {};
    const concorsoUrl = 'https://theninjamaster324.github.io/Comune-di-Piacenza/home.html#fazioni';    
    if (type === 'open') {
        webhookUrl = webhooks.management || '';
        embed = {
            title: '📅 Candidature Aperte!',
            description: `Le candidature per **${faction}** sono ora APERTE!\n\n[📝 Candidati Ora](${concorsoUrl})`,
            color: parseInt(factionColors[faction].replace('#', ''), 16),
            fields: [
                { name: '📆 Data Apertura', value: data.openDate || 'Adesso', inline: true },
                { name: '🕒 Data Chiusura', value: data.closeDate || 'Da definire', inline: true }
            ],
            footer: { text: `Gestito da ${user.username}` },
            timestamp: new Date().toISOString()
        };
    } else if (type === 'close') {
        webhookUrl = webhooks.management || '';
        embed = {
            title: '🔒 Candidature Chiuse',
            description: `Le candidature per **${faction}** sono ora CHIUSE.`,
            color: 0xe74c3c,
            fields: [{ name: '📊 Candidature Ricevute', value: String(data.totalApplications || 0), inline: true }],
            footer: { text: `Gestito da ${user.username}` },
            timestamp: new Date().toISOString()
        };
    } else if (type === 'results') {
        webhookUrl = webhooks.management || '';
        embed = {
            title: '📊 Risultati Pubblicati',
            description: `I risultati del concorso per **${faction}** sono stati pubblicati!\n\n[📋 Visualizza Risultati](${concorsoUrl})`,
            color: 0x27ae60,
            fields: [
                { name: '✅ Idonei', value: String(data.passed || 0), inline: true },
                { name: '❌ Non Idonei', value: String(data.failed || 0), inline: true }
            ],
            footer: { text: `Pubblicati da ${user.username}` },
            timestamp: new Date().toISOString()
        };
    }
    
    if (!webhookUrl) return;
    fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'Comune di Piacenza', avatar_url: 'https://via.placeholder.com/100', embeds: [embed] })
    }).catch(err => console.error('❌ Errore webhook:', err));
}

function showManageTab(tab) {
    document.querySelectorAll('.manage-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.manage-tab-content').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');
    const tabContent = document.getElementById(tab + 'Tab');
    if (tabContent) tabContent.classList.add('active');
}

function scheduleOpen() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const faction = user.faction;
    const openDateEl = document.getElementById('openDate');
    if (!openDateEl || !openDateEl.value) { alert('⚠️ Seleziona una data e ora!'); return; }
    
    const openDate = openDateEl.value;
    const schedule = JSON.parse(localStorage.getItem(`schedule_${faction}`) || '{}');
    schedule.openDate = openDate;
    schedule.status = 'scheduled';
    localStorage.setItem(`schedule_${faction}`, JSON.stringify(schedule));
    sendDiscordWebhook('open', {
        openDate: new Date(openDate).toLocaleString('it-IT'),
        closeDate: schedule.closeDate ? new Date(schedule.closeDate).toLocaleString('it-IT') : 'Da definire'
    });
    alert('✅ Apertura programmata!\n\nData: ' + new Date(openDate).toLocaleString('it-IT'));
    updateStatus(faction);
}

function scheduleClose() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const faction = user.faction;
    const closeDateEl = document.getElementById('closeDate');
    if (!closeDateEl || !closeDateEl.value) { alert('⚠️ Seleziona una data e ora!'); return; }
    
    const closeDate = closeDateEl.value;
    const schedule = JSON.parse(localStorage.getItem(`schedule_${faction}`) || '{}');
    schedule.closeDate = closeDate;
    localStorage.setItem(`schedule_${faction}`, JSON.stringify(schedule));
    alert('✅ Chiusura programmata!\n\nData: ' + new Date(closeDate).toLocaleString('it-IT'));
    updateStatus(faction);
}

function openNow() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const faction = user.faction;
    const schedule = JSON.parse(localStorage.getItem(`schedule_${faction}`) || '{}');
    schedule.status = 'open';
    schedule.openDate = new Date().toISOString();
    schedule.sessionId = Date.now();
    localStorage.setItem(`schedule_${faction}`, JSON.stringify(schedule));
    sendDiscordWebhook('open', { openDate: 'Adesso' });
    alert('✅ Candidature APERTE!');
    updateStatus(faction);
}

function closeNow() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const faction = user.faction;
    const applications = JSON.parse(localStorage.getItem(`applications_${faction}`) || '[]');
    const schedule = JSON.parse(localStorage.getItem(`schedule_${faction}`) || '{}');
    schedule.status = 'closed';
    schedule.closeDate = new Date().toISOString();
    localStorage.setItem(`schedule_${faction}`, JSON.stringify(schedule));
    sendDiscordWebhook('close', { totalApplications: applications.length });
    alert('✅ Candidature CHIUSE!\n\nCandidature ricevute: ' + applications.length);
    updateStatus(faction);
}

function updateStatus(faction) {
    const schedule = JSON.parse(localStorage.getItem(`schedule_${faction}`) || '{}');
    const statusBox = document.getElementById('currentStatus');
    if (!statusBox) return;
    
    let statusHtml = '';
    if (schedule.status === 'open') {
        statusHtml = `<strong style="color: #27ae60;">🟢 APERTO</strong><br>Apertura: ${schedule.openDate ? new Date(schedule.openDate).toLocaleString('it-IT') : 'N/A'}<br>${schedule.closeDate ? 'Chiusura programmata: ' + new Date(schedule.closeDate).toLocaleString('it-IT') : ''}`;
    } else if (schedule.status === 'closed') {
        statusHtml = `<strong style="color: #e74c3c;">🔴 CHIUSO</strong><br>Ultimo concorso chiuso: ${schedule.closeDate ? new Date(schedule.closeDate).toLocaleString('it-IT') : 'N/A'}`;
    } else if (schedule.status === 'scheduled') {
        statusHtml = `<strong style="color: #f39c12;">⏰ PROGRAMMATO</strong><br>Apertura programmata: ${schedule.openDate ? new Date(schedule.openDate).toLocaleString('it-IT') : 'N/A'}`;
    } else {
        statusHtml = '<strong style="color: #95a5a6;">⚪ NON ATTIVO</strong><br>Nessun concorso programmato';
    }
    statusBox.innerHTML = statusHtml;
}

let questions = [];

function loadQuestions(faction) {
    questions = JSON.parse(localStorage.getItem(`questions_${faction}`) || '[]');
    renderQuestions();
}

// ── renderQuestions aggiornata per tutti i tipi ──
function renderQuestions() {
    const list = document.getElementById('questionsList');
    if (!list) return;
    if (questions.length === 0) {
        list.innerHTML = '<p style="color: #888;">Nessuna domanda aggiunta.</p>';
        return;
    }
    const typeNames = {
        short:'Risposta breve', paragraph:'Paragrafo', multiple:'Scelta multipla',
        checkbox:'Caselle di controllo', dropdown:'Elenco a discesa', file:'Caricamento file',
        scale:'Scala lineare', rating:'Classificazione', grid_multi:'Griglia scelta multipla',
        grid_check:'Griglia caselle controllo', date:'Data', time:'Ora',
        open:'Risposta Aperta', closed:'Risposta Chiusa'
    };

    list.innerHTML = questions.map((q, i) => `
        <div class="question-card">
            <h5>Domanda ${i + 1}: ${q.question}</h5>
            <p><strong>Tipo:</strong> ${typeNames[q.type] || q.type}</p>
            ${q.options ? '<p><strong>Opzioni:</strong> ' + q.options.join(', ') + '</p>' : ''}
            ${q.gridRows ? '<p><strong>Righe:</strong> ' + q.gridRows.join(', ') + '</p>' : ''}
            ${q.gridCols ? '<p><strong>Colonne:</strong> ' + q.gridCols.join(', ') + '</p>' : ''}
            ${q.scaleMin != null ? '<p><strong>Scala:</strong> ' + q.scaleMin + ' → ' + q.scaleMax + (q.scaleMinLabel?' ('+q.scaleMinLabel+' … '+q.scaleMaxLabel+')':'') + '</p>' : ''}
            <p><strong>Punteggio Max:</strong> ${q.maxScore || 'N/A'}</p>
            <p><strong>Obbligatoria:</strong> ${q.required ? 'Sì' : 'No'}</p>
            <div class="question-options">
                <button onclick="deleteQuestion(${i})" class="btn-danger">🗑️ Elimina</button>
            </div>
        </div>
    `).join('');
}

// addQuestion() è definita sopra nel blocco modale

function deleteQuestion(index) {
    if (confirm('Eliminare questa domanda?')) {
        questions.splice(index, 1);
        saveQuestions();
        renderQuestions();
    }
}

function saveQuestions() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    localStorage.setItem(`questions_${user.faction}`, JSON.stringify(questions));
}

function loadApplications(faction) {
    const applications = JSON.parse(localStorage.getItem(`applications_${faction}`) || '[]');
    const list = document.getElementById('applicationsList');
    
    if (!list) return;
    
    if (applications.length === 0) {
        list.innerHTML = '<p style="color: #888;">Nessuna candidatura ricevuta.</p>';
        return;
    }
    
    list.innerHTML = applications.map((app, i) => `
        <div class="application-card">
            <div class="application-header">
                <h4>Candidatura #${i + 1}</h4>
                <span style="color: #888;">${new Date(app.date).toLocaleString('it-IT')}</span>
            </div>
            <div class="application-info">
                <div class="info-item"><span class="info-label">Nome</span><span class="info-value">${app.name || 'N/A'}</span></div>
                <div class="info-item"><span class="info-label">Cognome</span><span class="info-value">${app.surname || 'N/A'}</span></div>
                <div class="info-item"><span class="info-label">Discord</span><span class="info-value">${app.discord || 'N/A'}</span></div>
                <div class="info-item"><span class="info-label">Email</span><span class="info-value">${app.email || 'N/A'}</span></div>
            </div>
            <button onclick="toggleAnswers(${i})" class="btn-primary" style="margin: 15px 0;">📋 Visualizza Risposte</button>
            <div id="answers-${i}" class="application-answers" style="display: none;">
                <h5>Risposte:</h5>
                ${app.answers ? app.answers.map((a, j) => {
                    const q = questions[j];
                    const maxScore = q && q.maxScore ? q.maxScore : 0;
                    const currentScore = app.questionScores && app.questionScores[j] !== undefined ? app.questionScores[j] : 0;
                    return `
                        <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #667eea;">
                            <p><strong>D${j + 1}:</strong> ${a.question}</p>
                            <p style="color: #666;"><strong>Risposta:</strong> ${a.answer}</p>
                            ${maxScore > 0 ? `
                                <div style="margin-top: 10px;">
                                    <label><strong>Punteggio:</strong></label>
                                    <input type="number" class="score-input" min="0" max="${maxScore}" value="${currentScore}" 
                                        onchange="updateQuestionScore('${faction}', ${i}, ${j}, this.value, ${maxScore})" style="width: 80px; margin: 0 10px;">
                                    <span>/ ${maxScore} punti</span>
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('') : '<p>Nessuna risposta</p>'}
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <h5>Punteggio Totale: <span id="total-score-${i}">${app.totalScore || 0}</span> punti</h5>
                </div>
            </div>
            <div style="margin-top: 20px;">
                <button onclick="setResult('${faction}', ${i}, 'passed')" class="btn-success">✅ Idoneo</button>
                <button onclick="setResult('${faction}', ${i}, 'failed')" class="btn-danger">❌ Non Idoneo</button>
                <button onclick="archiveSingleCandidate('${faction}', ${i})" class="btn-secondary" style="background: #3498db;">📦 Archivia</button>
                ${app.result ? `<span style="margin-left: 15px; font-weight: bold; color: ${app.result === 'passed' ? '#27ae60' : '#e74c3c'};">${app.result === 'passed' ? '✅ IDONEO' : '❌ NON IDONEO'}</span>` : ''}
            </div>
        </div>
    `).join('');
}

function toggleAnswers(index) {
    const answersDiv = document.getElementById(`answers-${index}`);
    if (answersDiv) answersDiv.style.display = answersDiv.style.display === 'none' ? 'block' : 'none';
}

function updateQuestionScore(faction, appIndex, questionIndex, score, maxScore) {
    const applications = JSON.parse(localStorage.getItem(`applications_${faction}`) || '[]');
    const app = applications[appIndex];
    if (!app.questionScores) app.questionScores = [];
    let validScore = parseInt(score);
    if (isNaN(validScore) || validScore < 0) validScore = 0;
    if (validScore > maxScore) validScore = maxScore;
    app.questionScores[questionIndex] = validScore;
    app.totalScore = app.questionScores.reduce((sum, s) => sum + (s || 0), 0);
    localStorage.setItem(`applications_${faction}`, JSON.stringify(applications));
    const totalScoreEl = document.getElementById(`total-score-${appIndex}`);
    if (totalScoreEl) totalScoreEl.textContent = app.totalScore;
}

function setResult(faction, index, result) {
    const applications = JSON.parse(localStorage.getItem(`applications_${faction}`) || '[]');
    applications[index].result = result;
    localStorage.setItem(`applications_${faction}`, JSON.stringify(applications));
    alert('✅ Risultato impostato: ' + (result === 'passed' ? 'IDONEO' : 'NON IDONEO'));
    loadApplications(faction);
}

function publishResults() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const faction = user.faction;
    const applications = JSON.parse(localStorage.getItem(`applications_${faction}`) || '[]');
    const passed = applications.filter(a => a.result === 'passed').length;
    const failed = applications.filter(a => a.result === 'failed').length;
    if (!confirm(`Pubblicare i risultati?\n\n✅ Idonei: ${passed}\n❌ Non Idonei: ${failed}`)) return;
    applications.forEach(app => app.published = true);
    localStorage.setItem(`applications_${faction}`, JSON.stringify(applications));
    sendDiscordWebhook('results', { passed, failed });
    alert('✅ Risultati pubblicati!');
    loadApplications(faction);
}

function archiveSingleCandidate(faction, index) {
    const applications = JSON.parse(localStorage.getItem(`applications_${faction}`) || '[]');
    const app = applications[index];
    if (!app) { alert('⚠️ Candidato non trovato!'); return; }
    if (!confirm(`Archiviare:\n\n${app.name} ${app.surname}\nDiscord: ${app.discord}`)) return;
    
    app.archived = true;
    app.archivedDate = new Date().toISOString();
    const archive = JSON.parse(localStorage.getItem(`archive_${faction}`) || '[]');
    archive.push(app);
    localStorage.setItem(`archive_${faction}`, JSON.stringify(archive));
    applications.splice(index, 1);
    localStorage.setItem(`applications_${faction}`, JSON.stringify(applications));
    sendArchiveWebhook([app]);
    alert('✅ Candidato archiviato!');
    loadApplications(faction);
    loadArchive(faction);
}

function archiveAllCandidates() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const faction = user.faction;
    const applications = JSON.parse(localStorage.getItem(`applications_${faction}`) || '[]');
    if (applications.length === 0) { alert('⚠️ Nessuna candidatura!'); return; }
    if (!confirm(`Archiviare tutti i ${applications.length} candidati?`)) return;
    
    const archive = JSON.parse(localStorage.getItem(`archive_${faction}`) || '[]');
    applications.forEach(app => {
        app.archived = true;
        app.archivedDate = new Date().toISOString();
    });
    archive.push(...applications);
    localStorage.setItem(`archive_${faction}`, JSON.stringify(archive));
    sendArchiveWebhook(applications);
    localStorage.setItem(`applications_${faction}`, '[]');
    alert('✅ Candidati archiviati!');
    loadApplications(faction);
    loadArchive(faction);
}

function sendArchiveWebhook(applications) {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const faction = user.faction;
    const webhooks = JSON.parse(localStorage.getItem(`webhooks_${faction}`) || '{}');
    if (!webhooks.archive) return;
    
    const baseUrl = window.location.origin;
    applications.forEach(app => {
        const appId = Date.now() + Math.random().toString(36).substr(2, 9);
        localStorage.setItem(`answer_${appId}`, JSON.stringify({ faction, application: app, timestamp: Date.now() }));
        const answerUrl = `${baseUrl}/visualizza-risposte.html?id=${appId}`;
        
        const embed = {
            title: '📦 Candidato Archiviato',
            description: `Candidatura archiviata per **${faction}**`,
            color: app.result === 'passed' ? 0x27ae60 : app.result === 'failed' ? 0xe74c3c : 0x95a5a6,
            fields: [
                { name: '👤 Nome', value: `${app.name} ${app.surname}`, inline: true },
                { name: '💬 Discord', value: app.discord, inline: true },
                { name: '📧 Email', value: app.email, inline: true },
                { name: '📊 Punteggio', value: String(app.totalScore || 0), inline: true },
                { name: '📃 Risultato', value: app.result === 'passed' ? '✅ IDONEO' : app.result === 'failed' ? '❌ NON IDONEO' : '⏳ In attesa', inline: true },
                { name: '📅 Data', value: new Date(app.date).toLocaleDateString('it-IT'), inline: true },
                { name: '📋 Risposte', value: `[Clicca qui](${answerUrl})`, inline: false }
            ],
            footer: { text: `Archiviato da ${user.username}` },
            timestamp: new Date().toISOString()
        };
        
        fetch(webhooks.archive, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: `Archivio - ${faction}`, avatar_url: 'https://via.placeholder.com/100', embeds: [embed] })
        }).catch(err => console.error('Errore webhook:', err));
    });
}

function loadArchive(faction) {
    const archive = JSON.parse(localStorage.getItem(`archive_${faction}`) || '[]');
    const list = document.getElementById('archiveList');
    if (!list) return;
    if (archive.length === 0) {
        list.innerHTML = '<p style="color: #888;">Nessun candidato archiviato.</p>';
        return;
    }
    archive.sort((a, b) => new Date(b.archivedDate) - new Date(a.archivedDate));
    list.innerHTML = archive.map((app, i) => `
        <div class="application-card" style="opacity: 0.8;">
            <div class="application-header">
                <h4>📦 ${app.name} ${app.surname}</h4>
                <span style="color: #888;">Archiviato: ${new Date(app.archivedDate).toLocaleString('it-IT')}</span>
            </div>
            <div class="application-info">
                <div class="info-item"><span class="info-label">Discord</span><span class="info-value">${app.discord}</span></div>
                <div class="info-item"><span class="info-label">Email</span><span class="info-value">${app.email}</span></div>
                <div class="info-item"><span class="info-label">Punteggio</span><span class="info-value">${app.totalScore || 0} punti</span></div>
                <div class="info-item">
                    <span class="info-label">Risultato</span>
                    <span class="info-value" style="color: ${app.result === 'passed' ? '#27ae60' : app.result === 'failed' ? '#e74c3c' : '#95a5a6'};">
                        ${app.result === 'passed' ? '✅ IDONEO' : app.result === 'failed' ? '❌ NON IDONEO' : '⏳ In attesa'}
                    </span>
                </div>
            </div>
            <button onclick="viewArchivedAnswers(${i})" class="btn-primary" style="margin-top: 15px;">📋 Visualizza Risposte</button>
        </div>
    `).join('');
}

function viewArchivedAnswers(index) {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const faction = user.faction;
    const archive = JSON.parse(localStorage.getItem(`archive_${faction}`) || '[]');
    const app = archive[index];
    if (!app) return;
    
    let text = `📋 ${app.name} ${app.surname}\n\n📧 ${app.email}\n💬 ${app.discord}\n📊 Punteggio: ${app.totalScore || 0}\n✅ ${app.result === 'passed' ? 'IDONEO' : app.result === 'failed' ? 'NON IDONEO' : 'In attesa'}\n\n━━━━━━━━━━━━━━━━━━\n\n`;
    app.answers.forEach((a, i) => {
        text += `Domanda ${i + 1}: ${a.question}\nRisposta: ${a.answer}\n`;
        if (app.questionScores && app.questionScores[i] !== undefined) {
            text += `Punteggio: ${app.questionScores[i]}/${a.maxScore || 0}\n`;
        }
        text += `\n`;
    });
    alert(text);
}

function loadWebhooks(faction) {
    const webhooks = JSON.parse(localStorage.getItem(`webhooks_${faction}`) || '{}');
    if (document.getElementById('webhookManagement') && webhooks.management) document.getElementById('webhookManagement').value = webhooks.management;
    if (document.getElementById('webhookApplications') && webhooks.applications) document.getElementById('webhookApplications').value = webhooks.applications;
    if (document.getElementById('webhookArchive') && webhooks.archive) document.getElementById('webhookArchive').value = webhooks.archive;
}

function saveWebhooks() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const faction = user.faction;
    const webhooks = {
        management: document.getElementById('webhookManagement').value,
        applications: document.getElementById('webhookApplications').value,
        archive: document.getElementById('webhookArchive').value
    };
    localStorage.setItem(`webhooks_${faction}`, JSON.stringify(webhooks));
    alert('✅ Webhook salvati!');
}

function testWebhook() {
    sendDiscordWebhook('open', { openDate: 'TEST', closeDate: 'TEST' });
    alert('🧪 Test webhook inviato!\n\nControlla il tuo canale Discord.');
}

function loadFactionData(faction) {
    loadQuestions(faction);
    loadApplications(faction);
    loadArchive(faction);
}

function logout() {
    if (confirm('Sei sicuro di voler uscire?')) {
        sessionStorage.clear();
        localStorage.removeItem('logged');
        window.location.href = 'index.html';
    }
}

function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.toggle('active');
}

console.log('✅ Gestione Fazioni caricata completamente!');