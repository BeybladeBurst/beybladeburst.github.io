const Knob = {
    init (knob) {
        knob.minθ = new E(knob).get('--min');
        knob.maxθ = 360 - knob.minθ;
        knob.currentθ = () => new E(knob).get('--angle');
        knob.onpointerdown = ev => Knob.press(ev);
    },
    press ({ target: knob, clientY }) {
        knob.startY = clientY;
        knob.startθ = knob.currentθ();

        Q('html').classList.add('dragging');
        document.onpointermove = ev => Knob.drag(ev, knob);
        document.onpointerup = ev => Knob.lift(knob);
    },
    drag (ev, knob) {
        ev.preventDefault();
        let currentθ = knob.currentθ();
        (currentθ == knob.minθ || currentθ == knob.maxθ) && (knob.startθ = currentθ);

        let currentY = ev.clientY;
        let updatedθ = Math.max(knob.minθ, Math.min(knob.startθ - (currentY - knob.startY), knob.maxθ));
        (updatedθ == knob.minθ || updatedθ == knob.maxθ) && (knob.startY = currentY);
        new E.prop({'--angle': `${updatedθ}deg`}).apply(knob);

        let value = (updatedθ - knob.minθ) / (knob.maxθ - knob.minθ);
        knob.Q('input').value = Q(`progress`).value = value;
        new E.prop({'--value': value}).apply(Q(`progress`).parentElement);
    
    },
    lift (knob) {
        Q('html').classList.remove('dragging');
        document.onpointermove = null;
    }
};
const Fader = {
    init (input) {
        input.value = Math.random()*100;
        let pillar = Q(`#faders p:nth-child(${input.tabIndex})`);
        new E.prop({'--w-size': 5.5 - input.tabIndex + 1 + '%'}).apply(pillar);
        
        input.oninput = ev => Fader.move(input, pillar);
        input.onpointerup = ev => Fader.confirm();
        setTimeout(() => input.dispatchEvent(new InputEvent('input')));
    },
    move (input, pillar) {
        new E.prop({'--w-pos': 100 - input.value + '%'}).apply(pillar);
        new E.prop({'--value': input.value}).apply(input);
        let until = Fader.penetrated();
        new E.prop({'--laser': until === 0 ? '5000px' : Q(`#faders p:nth-child(${until})`).getBoundingClientRect().x+'px'}).apply(Q('#faders'));
    },
    confirm: () => Q('#faders').classList.toggle('done', Fader.penetrated() === 0),
    penetrated: () => Q('#faders p').findIndex(p => {
        let [pos, size] = new E(p).get('--w-pos', '--w-size');
        return pos < 10 - (2*size/5 - .35) || pos > 10 + (2*size/5 - .35);
    }) + 1
}
const BD =  {
    init (diverter) {
        BD.diverter = diverter.sQ('article');
        BD.control = Q('#knob input'), BD.meter = Q('meter');
    },
    get angle() {return new E(BD.diverter).get('--angle');},
    set angle(angle) {new E.prop({'--angle': angle + 'deg'}).apply(BD.diverter)},
    spin (time) {
        if (Q('#bd.seeing:not(.blurred)')) {
            let speed = BD.meter.value = Math.max(.05, parseFloat(BD.control.value)) + (Math.random() - .5)/100;
            //new E.prop({'--tilt': Math.max(0, (speed - .5 + Math.random(}).apply(Q('bird-diverter'))/10)*90) + 'deg');
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

        new O(Drums.lastHit).each(([piece, lastHit]) => time - lastHit > 100 && Drums.playback.set(piece, 0));

        if (!Drums.playback.last || time - Drums.playback.last > Drums.playback.DPM) {
            let [beat, div] = Drums.playback.progress();
            new O(Drums.pattern).each(([piece, pattern]) => pattern[beat][div] && Drums.playback.set(piece, 1, time));
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
    init () {
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
    truncate (which) {
        Scroll.truncated[which] = true;
        Q(`aside div:nth-of-type(${which+1}) hedron-p`).sQ('polygon', polygon => {
            let side = parseInt(polygon.id), stroke = new E(polygon).get('--stroke');
            const r = new Polygon(side, stroke).normal;
            const strokeAdjusted = r - (new Polygon(side, stroke, r).radius.stroked - r);
            const points = Polygon.points(side, strokeAdjusted, -Math.PI / side, true);
    
            const animate = polygon.Q(`animate`);
            new E.prop({
                from: animate.getAttribute('to') || animate.parentNode.getAttribute('points'),
                to: points
            }).apply(animate);
            new E.prop({points}).apply(animate.parentNode);
            animate.beginElement();
        });
    },
    merge (transfer, receive) {
        let [trS, reS] = [Q(`hedron-p[face="${transfer}"]`), Q(`hedron-p[face="${receive}"]`)].map(hedron => hedron.shadowRoot);
        [trS, reS].forEach(shadow => E(shadow.Q('polygon'), {stroke: shadow.host.stroke}));
        reS.Q('figure').style.fontSize = reS.host.getAttribute('scale') + 'em';
        reS.append(trS.Q('figure'), trS.Q('style[id]'), trS.host.parentElement.Q('style').cloneNode(true));
        reS.Q('defs').append(trS.Q('defs>*'));
        trS.host.remove();
    }  
}
