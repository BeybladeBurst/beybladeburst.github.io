const Q = Node.prototype.Q = function(el, func) {
    let els = this.querySelectorAll?.(el) ?? document.querySelectorAll(el);
    return func ? els.forEach(func) : els.length > 1 ? [...els] : els[0];
}
const E = (el, ...stuff) => {
    let SVGs = ['svg', 'defs', 'use', 'path', 'line', 'polygon', 'rect', 'circle', 'animate'];
    let [text, attr, child] = ['String', 'Object', 'Array'].map(t => stuff.find(s => Object.prototype.toString.call(s).includes(t)));
    text && (attr = {textContent: text, ...attr ?? {}});
    el == 'img' && (attr &&= {alt: attr.src.match(/([^/.]+)(\.[^/.]+)$/)?.[1], onerror: ev => ev.target.remove(), ...attr ?? {}});
    el = Object.prototype.toString.call(el).includes('Element') ? el : 
        SVGs.includes(el) ? document.createElementNS('http://www.w3.org/2000/svg', el) : document.createElement(el);
    el.append(...child ?? []);
    Object.assign(el.style, attr?.style ?? {});
    Object.assign(el.dataset, attr?.dataset ?? {});
    SVGs.includes(el.tagName) ? 
        Object.entries(attr ?? {}).forEach(([a, v]) => el.setAttribute(a, v)) : 
        Object.assign(el, (({style, ...attr}) => attr)(attr ?? {}));
    return el;
}
CSSStyleDeclaration.prototype.variables = function(obj) {
    Object.entries(obj).forEach(([p, v]) => this.setProperty(`--${p}`, v));
};
/iPad|iPhone/.test(navigator.userAgent) && document.body.classList.add('ios');

const Knob = {
    init: knob => {
        knob.minθ = parseInt(getComputedStyle(knob).getPropertyValue('--min'));
        knob.maxθ = 360 - knob.minθ;
        knob.currentθ = () => parseFloat(getComputedStyle(knob).getPropertyValue('--angle'));
        knob.onpointerdown = ev => Knob.press(ev);
    },
    press: ({ target: knob, clientY }) => {
        knob.startY = clientY;
        knob.startθ = knob.currentθ();

        Q('html').classList.add('dragging');
        document.onpointermove = ev => Knob.drag(ev, knob);
        document.onpointerup = ev => Knob.lift(knob);
    },
    drag: (ev, knob) => {
        ev.preventDefault();
        let currentθ = knob.currentθ();
        (currentθ == knob.minθ || currentθ == knob.maxθ) && (knob.startθ = currentθ);

        let currentY = ev.clientY;
        let updatedθ = Math.max(knob.minθ, Math.min(knob.startθ - (currentY - knob.startY), knob.maxθ));
        (updatedθ == knob.minθ || updatedθ == knob.maxθ) && (knob.startY = currentY);
        knob.style.setProperty('--angle', `${updatedθ}deg`);

        let value = (updatedθ - knob.minθ) / (knob.maxθ - knob.minθ);
        knob.Q('input').value = Q(`progress`).value = value;
        Q(`progress`).parentElement.style.setProperty('--value', value);
    
    },
    lift: knob => {
        Q('html').classList.remove('dragging');
        document.onpointermove = null;
    }
};
const Fader = {
    init: input => {
        input.value = Math.random()*100;
        let pillar = Q(`#faders p:nth-child(${input.tabIndex})`)
        pillar.style.setProperty('--w-size', 5.5 - input.tabIndex + 1 + '%');
        
        input.oninput = ev => Fader.move(input, pillar);
        input.onpointerup = ev => Fader.confirm();
        setTimeout(() => input.dispatchEvent(new InputEvent('input')));
    },
    move: (input, pillar) => {
        pillar.style.setProperty('--w-pos', 100 - input.value + '%');
        input.style.setProperty('--value', input.value);
        let until = Fader.penetrated();
        Q('#faders').style.setProperty('--laser', 
            (until === 0 ? 5000 : Q(`#faders p:nth-child(${until})`).getBoundingClientRect().x) + 'px');
    },
    confirm: () => Q('#faders').classList.toggle('done', Fader.penetrated() === 0),
    penetrated: () => Q('#faders p').findIndex(p => {
        let pos = parseFloat(getComputedStyle(p).getPropertyValue('--w-pos'));
        let size = parseFloat(getComputedStyle(p).getPropertyValue('--w-size'));
        return pos < 10 - (2*size/5 - .35) || pos > 10 + (2*size/5 - .35);
    }) + 1
}
const BD =  {
    init: diverter => {
        BD.diverter = diverter.shadowRoot.Q('article');
        BD.control = Q('#knob input'), BD.meter = Q('meter');
    },
    get angle() {return parseFloat(getComputedStyle(BD.diverter).getPropertyValue('--angle'));},
    set angle(angle) {BD.diverter.style.setProperty('--angle', angle + 'deg')},
    spin: time => {
        if (Q('#bd.seeing:not(.blurred)')) {
            let speed = BD.meter.value = Math.max(.05, parseFloat(BD.control.value)) + (Math.random() - .5)/100;
            //Q('bird-diverter').style.setProperty('--tilt', Math.max(0, (speed - .5 + Math.random()/10)*90) + 'deg');
            BD.angle += Math.min(100, time - BD.last)*speed*2;
        }
        BD.last = time;
        requestAnimationFrame(BD.spin);
    },
};
const Drums = {
    pattern: {
        kick:    [[1,0,0,0,1,0],[0,0,0,0,0,0],[1,0,0,0,1,0],[0,0,0,0,0,0],[1,0,0,0,1,0],[0,0,0,0,0,0],[1,0,1,0,0,0],[0,0,1,0,0,0]],
        snare:   [[0,0,0,0,0,0],[1,0,0,0,1,0],[0,0,0,0,0,0],[1,0,0,0,0,0],[0,0,0,0,0,0],[1,0,0,0,1,0],[0,0,0,0,0,0],[0,0,0,0,0,0]],
        crash:   [[1,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[1,0,1,0,0,0],[0,0,1,0,0,0]],
        ride:    [[0,0,0,0,0,0],[0,0,0,0,0,0],[1,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]],
        'hi-hat':[[0,0,1,0,1,0],[1,0,1,0,1,0],[1,0,1,0,1,0],[1,0,1,0,1,0],[1,0,1,0,1,0],[1,0,1,0,1,0],[0,0,0,0,0,0],[0,0,0,0,0,0]],
        'tom-h': [[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,1,1],[0,0,0,0,0,0]],
        'tom-m': [[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[1,1,0,0,0,0]],
        'tom-l': [[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,1,1]],
    },
    lastHit: {},
    playback: function(time, BPM) {
        Drums.playback.DPM ??= 1000*60 / BPM / Drums.pattern.kick[0].length;
        Drums.playback.beat ??= 0, Drums.playback.div ??= 0;
        if (!Q('#drum.seeing'))
            return Drums.playback.stop();

        Object.entries(Drums.lastHit).forEach(([piece, lastHit]) => time - lastHit > 100 && Drums.playback.set(piece, 0));

        if (!Drums.playback.last || time - Drums.playback.last > Drums.playback.DPM) {
            let [beat, div] = Drums.playback.progress();
            Object.entries(Drums.pattern).forEach(([piece, pattern]) => pattern[beat][div] && Drums.playback.set(piece, 1, time));
            Drums.playback.div++;
            Drums.playback.last = time;
        }
        requestAnimationFrame(Drums.playback);
    }
}
Drums.playback.progress = function() {
    Drums.pattern.kick[this.beat][this.div] == null && (this.beat++, this.div = 0);
    Drums.pattern.kick[this.beat] == null && (this.beat = this.div = 0);
    return [this.beat, this.div];
}
Drums.playback.stop = function() {
    this.beat = this.div = 0;
    requestAnimationFrame(this);
}
Drums.playback.set = function(piece, on, time) {
    Q(`#${piece}`).classList[on ? 'add':'remove']('on');
    Drums.lastHit[piece] = on ? time : null;
}
const Scroll = {
    inited: false,
    init: () => {
        Q('#drum h2').onclick = () => {
            Q('aside').hidden = false;
            if (!Scroll.inited) {
                Scroll.inited = true;
                Q('style:empty').textContent = ['slant','midSlant','inR'].map(p => `@property --${p} {syntax:'<number>'; inherits:true; initial-value:1;}`).join('');
                Scroll.truncated = [];
                Scroll.merge(6,8);
                Scroll.merge(12,20);
                onscroll = () => {
                    let progress = Q('html').scrollTop/(Q('html').scrollHeight-Q('html').clientHeight);
                    progress <= .5  && !Scroll.truncated[0] && Scroll.truncate(0);
                    progress <= .15 && !Scroll.truncated[1] && Scroll.truncate(1);
                }
            }
        }
        Q('aside').onclick = () => Q('aside').hidden = true;
    },
    truncate: which => {
        Scroll.truncated[which] = true;
        Q(`aside div:nth-of-type(${which+1}) hedron-p`).shadowRoot.Q('polygon', polygon => {
            let side = parseInt(polygon.id), stroke = parseFloat(polygon.getAttribute('stroke'));
            const r = new Polygon(side, stroke).normal;
            const strokeAdjusted = r - (new Polygon(side, stroke, r).radius.stroked - r);
            const points = Polygon.points(side, strokeAdjusted, -Math.PI / side, true);
    
            const animate = polygon.Q(`animate`);
            E(animate, {
                from: animate.getAttribute('to') || animate.parentNode.getAttribute('points'),
                to: points
            });
            E(animate.parentNode, {points});
            animate.beginElement();
        });
    },
    merge: (transfer, receive) => {
        let [trS, reS] = [Q(`hedron-p[face="${transfer}"]`), Q(`hedron-p[face="${receive}"]`)].map(hedron => hedron.shadowRoot);
        [trS, reS].forEach(shadow => E(shadow.Q('polygon'), {stroke: shadow.host.stroke}));
        reS.Q('figure').style.fontSize = reS.host.getAttribute('scale') + 'em';
        reS.append(trS.Q('figure'), trS.Q('style[id]'), trS.host.parentElement.Q('style').cloneNode(true));
        reS.Q('defs').append(trS.Q('defs>*'));
        trS.host.remove();
    }  
}
