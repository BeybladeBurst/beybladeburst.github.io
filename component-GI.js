customElements.define('great-icosahedron', class extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
        this.css = `<style>*,*::before,*::after {box-sizing:border-box;}
        :host {
            min-width:calc(var(--circumR)*var(--diameter)); height:calc(var(--circumR)*var(--diameter));
        }
        figure,figure::before,figure::after {
            border:.1em dotted var(--ring, yellowgreen); border-radius:9em;
            animation-play-state:var(--paused) !important;
        }
        figure {
            width:100%; height:100%;
            margin:0;
            animation:spin 30s infinite linear;
            transform-style:preserve-3d;
        }
        figure::before,figure::after {
            content:'';
            position:absolute;
            width:100%; height:100%;
            box-sizing:border-box;
        }
        figure::before {animation:before-spin 30s infinite linear alternate-reverse;}
        figure::after  {animation:after-spin 30s infinite linear alternate-reverse;}
        @keyframes spin {100% {transform: rotateX(360deg) rotateY(720deg) rotateZ(1080deg);}}
        @keyframes before-spin {to {transform:rotate3d(var(--x),var(--y),var(--z),calc(1deg*var(--a)));}}
        @keyframes after-spin  {to {transform:rotate3d(var(--x),var(--y),var(--z),calc(-1deg*var(--a)));}}
        div,svg {
            position: absolute;
            width: calc(var(--diameter));
            overflow: visible;
            transform-style: preserve-3d;
        }
        svg:has(defs:only-of-type) {display:none;}
        use {
            stroke: var(--border,hsl(268,100%,50%)); stroke-width: var(--stroke);
            fill: hsl(var(--c),50%,50%,.8);
        }
        div:nth-of-type(odd) {
            transform: translateZ(calc(var(--inR)*var(--diameter)/2));
        }
        div:nth-of-type(even) {
            transform: rotateY(180deg) translateZ(calc(var(--inR)*var(--diameter)/2));
        }
        div svg {
            transform-origin: 50% 50% calc(var(--diameter)*var(--inR)/-2);
            transform: rotate(var(--centerA)) rotateY(calc(-1*var(--slant)));
        }
        div:nth-of-type(n+3) svg {
            transform: rotate(calc(var(--centerA) + 36deg)) rotateY(calc(-1*var(--midSlant)));
        }
        </style>`;
        [this.face, this.side, this.portion, this.around] = [20, 3, 5, 5];
        setTimeout(() => this.callback());
    }
    get stroke() {
        return this.getAttribute('stroke');
    }
    get elements() {
        const svg = document.createElement('svg');
        svg.innerHTML = `<defs><polygon id=${this.side} points='${Gon.points(this.side)}'></polygon></defs>`;

        const fillSVG = n => new Array(n).fill(`<svg><use href=#${this.side} /></svg>`).join('');
        const figure = document.createElement('figure');
        figure.innerHTML = new Array(Math.floor(this.face / this.portion)).fill(`<div>${fillSVG(this.portion)}</div>`).join('')
            + (fillSVG(this.face % this.portion) || '');

        figure.querySelectorAll('svg').forEach(svg => svg.setAttribute('viewBox', '-1,-1 2,2'));
        for (let i = 1; i <= this.around; i++)
            figure.querySelectorAll(`div svg:nth-child(${i})`).forEach(svg => svg.style.setProperty('--centerA', 360 / this.around * i + 'deg'));

        return svg.outerHTML + figure.outerHTML;
    }
    callback() {console.log()
        this.hasAttribute('paused') && this.style.setProperty('--paused', 'paused');
        this.shadow.innerHTML = this.css + this.elements;
        this.figure = this.shadow.querySelector('figure');
        this.variables();
        setTimeout(() => this.color());
        ['--x', '--y', '--z', '--a'].forEach(p => this.style.setProperty(p, Math.random() * 360 + 360));
    }
    color() {
        let hue = getComputedStyle(this).getPropertyValue('--hue');
        [
            [[1, 1], [2, 1], [3, 4], [4, 4]],
            [[1, 2], [2, 5], [3, 5], [4, 3]],
            [[1, 3], [2, 4], [3, 1], [4, 2]],
            [[1, 4], [2, 3], [3, 2], [4, 1]],
            [[1, 5], [2, 2], [3, 3], [4, 5]]
        ].forEach((colgroup, i) => colgroup.forEach(([g, t]) =>
            this.shadowRoot.querySelector(`div:nth-of-type(${g}) svg:nth-child(${t}) use`).style.setProperty('--c', hue - i * 20)
        ));
    }
    variables(...others) {
        this.gon = new Gon(this.side, this.stroke);
        [
            ['--stroke', this.stroke],
            ['--diameter', this.getAttribute('diameter') + 'em'],
            ['--slant', (this.face == 12 ? Math.PI - this.constant.foldA : this.constant.slant) + 'rad'],
            ['--inR', this.constant.inR * this.gon.side],
            ['--circumR', 1 || this.constant.circumR * this.gon.side],
            ['--midSlant', this.constant.foldA - this.constant.slant + 'rad'],
            ...others
        ].forEach(([p, v]) => this.style.setProperty(p, v));
    }
    static observedAttributes = ['stroke', 'diameter'];
    attributeChangedCallback() {
        this.figure ? this.variables() : this.callback();
    }
    get constant() {
        let [inR, circumR] = [(3 * Math.sqrt(3) + Math.sqrt(15)) / 12, Math.sqrt(10 + 2 * Math.sqrt(5)) / 4];
        return ({
            inR: Math.sqrt(3) * (Math.sqrt(5) - 3) / 12,
            circumR: Math.sqrt(11 - 4 * Math.sqrt(5)) / 2,
            foldA: Math.acos(Math.sqrt(5) / -3),
            slant: Math.PI / 2 - Math.asin(inR / circumR),
        });
    }
});
class Gon {
    constructor(n, stroke = 0, r = 1) {
        this.n = n;
        this.r = r;
        this.stroke = parseFloat(stroke);

        this.angle = {
            half: Math.PI * (1 - 2 / this.n) / 2,
            center: 2 * Math.PI / this.n
        };
        this.normal = this.r * Math.sin(this.angle.half) + this.stroke / 2;
        this.side = this.normal / Math.tan(this.angle.half) * 2;
        this.radius = {
            stroked: this.normal / Math.sin(this.angle.half),
            //truncated: this.r * Math.sin(this.angle.half) / Math.sin(Math.PI - new Gon(this.n * 2).angle.center / 2 - this.angle.half)
        };
        this.height = this.radius.stroked * (1 + Math.cos(this.angle.center / 2));
    }
    static points(n, r = 1, start = 0, alt = false) {
        const point = i => [Math.cos(2 * Math.PI / n * i + start), Math.sin(2 * Math.PI / n * i + start)].map(c => Math.round(c * r * 100000) / 100000);
        const points = [...Array(n).keys()].map(i => [...point(i), ...n < 6 ? point(i) : []]).flat();
        return (alt ? [...points.slice(2), ...points.slice(0, 2)] : points).join(' ');
    }
}