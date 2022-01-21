export function createElement(element, props={}) {
    let elem = document.createElement(element);
    Object.keys(props).forEach(key => elem.setAttribute(key, props[key]));

    return elem;
}