let wscu;
if (location.protocol === "https:") {
    wscu = `wss://${location.hostname}/ws/core`
} else {
    wscu = `ws://${location.hostname}:${location.port}/ws/core`
}
let wsc = new WebSocket(wscu);
let wss = false;
const a = Date.now();
let preFetches = { components: {} }
let assetMap = new Map();
let isMobile = window.matchMedia("(max-width: 767px)").matches;
let isNotMobile = window.matchMedia("(min-width: 768px)").matches;

wsc.onmessage = function (raw) {
    const b = JSON.parse(raw.data);
    if (b.action === "render") {
        renderContent(b);
    } else if (b.action === "clear") {
        clearContent(b);
    } else if (b.action === "loadAssets") {
        if (b.type === "js") {
            loadJS(b);
        } else if (b.type === "css") {
            loadCSS(b);
        }
    } else if (b.action === "refetch") {
        wsc.send(JSON.stringify({ action: "render", type: "page", data: window.location.pathname }));
    } else if (b.action === "rerender") {
        wsc.send(JSON.stringify({ action: "render", type: "content", data: window.location.pathname }));
    } else if (b.action === "reload") {
        window.location.reload();
    } else if (b.action === "setTitle") {
        document.title = b.data
    } else if (b.action === "preFetch") {
        if (b.type === "component") {
            preFetches.components[b.data.name] = b.data;
        }
    } else if (b.action === "details") {
        if (b.type === "admin.pterodactyl") {
            if (b.item === "nodes") {
                showNodes(b.data)
            }
        }
    } else if (b.action === "data") {
        if (b.type === "db.read") {
            if (b.item === "permissions") {
                setCacheValue("usersPermissions", b.data)
            }
        }
    }
};

wsc.onopen = function () {
    wsc.send(JSON.stringify({ action: "render", type: "page", data: window.location.pathname }));
    wss = true
    window.wsc = wsc
};

wsc.onclose = function () {
    wss = false
    console.log("Connection closed! Reconnecting...");
    wsc = undefined
    wsc = new WebSocket(wscu);
    setTimeout(() => {
        if (wsc === undefined) {
            location.reload()
        }
    }, 2000);
};

wsc.onerror = function (err) {
    wss = false
    console.log("Connection closed! Reconnecting...", err);
    try {
        wsc = new WebSocket(wscu);
    } catch (error) {
        alert("Critical error occured! Unable to contact the server. Please try again later!")
        console.error(error)
    }
};

function clearHrefs() {
    document.querySelectorAll('a[href="#"]').forEach(a => {
        a.addEventListener('click', function (event) {
            event.preventDefault();
        });
    });
}

function clearContent(a) {
    let elements;
    if (a.targetType === "element") {
        elements = document.querySelectorAll(a.target);
    } else if (a.targetType === "id") {
        const element = document.getElementById(a.target);
        elements = element ? [element] : [];
    } else if (a.targetType === "className") {
        elements = Array.from(document.getElementsByClassName(a.target));
    }

    elements.forEach(e => {
        if (e) {
            if (a.targetType === "id") {
                e.parentNode.removeChild(e);
            } else {
                e.innerHTML = '';
            }
        }
    });
}

function render(a, b) {
    if (wss !== true) window.location.reload()
    let url = true;
    if (!b) {
        sendMsg("render", "content", a.startsWith('/') ? a : `/${a}`)
    } else {
        if (b === "component") {
            url = false;
            if (preFetches.components[a]) {
                renderContent(preFetches.components[a])
            } else {
                sendMsg("preFetch", "component", a);
            }
            localStorage.setItem(window.location.pathname, JSON.stringify({
                component: a,
                url: window.location.pathname
            }));
        } else {
            sendMsg("render", b, a.startsWith('/') ? a : `/${a}`)
        }
    }
    if (url === true) changeURL(a);
}

function sendMsg(action, type, data) {
    wsc.send(JSON.stringify({ action, type, data }));
}

function renderClean(a) {
    wsc.send(JSON.stringify({ action: "render", type: "page", data: a.startsWith('/') ? a : `/${a}` }));
    changeURL(a);
}

function changeURL(url) {
    if (url !== "") {
        window.history.pushState({}, '', '/' + url);
    } else {
        window.history.replaceState({}, '', '/');
    }
}

if (!window.cacheHandler) {
    window.cacheHandler = {};
}

function setCacheValue(a, b) {
    window.cacheHandler[a] = b
    return true
}

function getCacheValue(a,) {
    return window.cacheHandler[a]
}

function renderContent(a) {
    const setAttr = (e) => {
        if (a.id) e.setAttribute('hc-component-name', a.id);
    };

    let elements;

    if (a.targetType === "element") {
        elements = document.querySelectorAll(a.target);
    } else if (a.targetType === "id") {
        const element = document.getElementById(a.target);
        elements = element ? [element] : [];
    } else if (a.targetType === "className") {
        elements = Array.from(document.getElementsByClassName(a.target));
    }

    elements.forEach(e => {
        if (e) {
            setAttr(e);
            if (a.type === "push") {
                e.innerHTML += a.data;
            } else {
                e.innerHTML = a.data;
            }
        }
    });
    if (a.highlights) {
        highlight(a.id, a.highlights);
    }
    if (a.functions && a.functions.length !== 0) {
        for (let i of a.functions) {
            if (typeof i === "function") {
                i();
            } else if (typeof i === "string") {
                const fnMatch = i.match(/^([a-zA-Z_$][a-zA-Z_$0-9]*)\((.*)\)$/);
                if (fnMatch) {
                    const fnName = fnMatch[1];
                    const args = fnMatch[2];
                    if (typeof globalThis[fnName] === "function") {
                        try {
                            const parsedArgs = new Function(`return [${args}]`)();
                            globalThis[fnName](...parsedArgs);
                        } catch (error) {
                            console.log(`Error executing function: ${i} - ${error}`);
                        }
                    } else {
                        console.log(`No valid function found for: ${i}`);
                    }
                } else if (typeof globalThis[i] === "function") {
                    globalThis[i]();
                } else {
                    console.log(`No valid function found for: ${i}`);
                }
            } else {
                console.log(`Invalid input: ${i}`);
            }
        }
    }
    clearHrefs();
    /* let b = localStorage.getItem(window.location.pathname);
    if (b) {
        let { component } = JSON.parse(b);
        if (preFetches.components[component]) {
            renderContent(preFetches.components[component]);
        }
    } */
}

function highlight(a, b) {
    let c = document.getElementById(a);
    if (c) {
        let d = b.toAdd.split(' ');
        let e = b.toRemove.split(' ');

        e.forEach(i => {
            c.classList.remove(i);
        });

        let f = document.getElementById(b.parent);
        if (f) {

            let g = Array.from(f.children);

            g.forEach(j => {
                d.forEach(i => {
                    j.classList.remove(i);
                });
                e.forEach(i => {
                    j.classList.add(i);
                });
            });
        }

        d.forEach(i => {
            c.classList.add(i);
        });
    }
}

function loadJS(a) {
    const existingAsset = assetMap.get(a.name);
    if (existingAsset) {
        existingAsset.script.remove();
    }
    createScript(a.name, a.data);
}

function createScript(name, content) {
    const script = document.createElement('script');
    script.type = 'application/javascript';
    script.textContent = content;
    script.setAttribute('data-name', name);
    document.head.appendChild(script);
    assetMap.set(name, { script, content });
    script.onload = () => console.log(`JavaScript "${name}" loaded successfully`);
    script.onerror = (error) => console.error(`Error loading JavaScript "${name}":`, error);
}

function loadCSS(a) {
    const { name, data } = a;
    const existingAsset = assetMap.get(name);
    if (existingAsset) {
        existingAsset.style.remove();
    }

    createStyle(name, data);
}

function createStyle(name, content) {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.textContent = content;
    style.setAttribute('data-name', name);
    document.head.appendChild(style);

    // Store the style and content in the asset map
    assetMap.set(name, { style, content });
}

window.onpopstate = function () {
    render(window.location.href.replace(window.location.origin, ''), "page");
}

function toggleAside(a) {
    let b = document.getElementById(a);
    if (b) {
        toggleSidebar(a)
    } else {
        const elements = document.querySelectorAll('[hc-component-type="aside"]');
        elements.forEach(i => toggleSidebar(i.id));
    }
}

function toggleSidebar(a) {
    const aside = document.getElementById(a);
    const main = document.querySelector("main");
    const nav = document.querySelector("nav");

    aside.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
    main.style.transition = isNotMobile ? 'margin-left 0.5s ease' : 'none';
    nav.style.transition = isNotMobile ? 'padding-left 0.5s ease' : 'none';

    if (aside.classList.contains("hidden")) {
        aside.classList.remove("hidden");
        aside.style.opacity = '0';
        aside.style.transform = 'translateX(-100%)';
        setTimeout(() => {
            aside.style.opacity = '1';
            aside.style.transform = 'translateX(0)';
        }, 10);

        if (isNotMobile) {
            main.style.marginLeft = '272px';
            nav.style.paddingLeft = '80px';
        }
    } else {
        aside.style.opacity = '0';
        aside.style.transform = 'translateX(-100%)';
        setTimeout(() => {
            aside.classList.add("hidden");
        }, 500);

        if (isNotMobile) {
            main.style.marginLeft = '80px';
            nav.style.paddingLeft = '80px';
        }
    }
}

function updateClock() {
    const a = document.getElementById("timeViewer");
    if (a) {
        const b = Date.now();
        const c = new Date(b);
        const d = c.getHours();
        const e = c.getMinutes().toString().padStart(2, '0');
        const f = c.getSeconds().toString().padStart(2, '0');
        a.innerHTML = `${d}:${e}:${f}`;
    } else {
        clearInterval(clockInterval);
    }
}

const currentSeconds = new Date().getSeconds();
const remainingSeconds = 60 - currentSeconds;

setTimeout(() => {
    updateClock();
    window.clockInterval = setInterval(updateClock, 1000);
}, remainingSeconds * 1000);