const Q = Node.prototype.Q = function(el, func) {
    let els = this.querySelectorAll?.(el) ?? document.querySelectorAll(el);
    return func ? els.forEach(func) : els.length > 1 ? [...els] : els[0];
}
const E = (el, attr) => {
    el == 'img' && (attr = {alt: 'image', ...attr ?? {}});
    el = document.createElement(el);
    Object.assign(el.style, attr?.style ?? {});
    return Object.assign(el, (({style, ...attr}) => attr)(attr ?? {}));
}
E.figure = ({imgs, caption, ...attr}) =>
    [...[imgs].flat().map(src => E('img', {src})), E('figcaption', {innerHTML: caption})]
    .reduce((figure, child) => figure.appendChild(child).parentElement, E('figure', attr));
E.ul = lis => [...[lis].flat()].map(li => E('li', {innerHTML: li})).reduce((ul, li) => ul.appendChild(li).parentElement, E('ul'));
E.ol = lis => [...[lis].flat()].map(li => E('li', {innerHTML: li})).reduce((ol, li) => ol.appendChild(li).parentElement, E('ol'));
E.dl = obj => Object.entries(obj).map(([k, v]) => [E('dt', {innerHTML: k}), ...[v].flat().filter(d => d).map(d => E('dd', {innerHTML: d + '<wbr>'}))])
                .flat(9).reduce((dl, d) => dl.appendChild(d).parentElement, E('dl'));

