let url = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/ws`;
let wss;
let wsStatus;
let reconnectAttempts = 0;
let maxReconnectAttempts = 5;
let reconnectTimeout = null;
let currentPath = window.location.pathname;
let currentProps = {};
let lastKeepAlive;
let cachedRoutes = {};
let renderNow = false;

window.onload = () => {
    connectWS();
    setupClientRouting();
};

window.addEventListener('popstate', () => {
    const path = window.location.pathname;
    if (path !== currentPath) {
        currentPath = path;
        if (cachedRoutes[path]) {
            update(path, cachedRoutes[path]);
        } else {
            renderNow = true;
            wss.send(JSON.stringify({ type: "getPage", path: path }));
        }
    }
});

function setupClientRouting() {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link) {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href) {
                !href.startsWith('http') ? render(href) : window.open(href, '_blank');
            }
        }
    });

    document.addEventListener('mouseover', (e) => {
        const hoverableElement = e.target.closest('a');
        if (hoverableElement) {
            let link = hoverableElement.getAttribute('href');
            if (link) {
                if (!cachedRoutes[link]) wss.send(JSON.stringify({ type: "getPage", path: link }));
            }
        }
    });
}

function loadAsset(a, b) {
    try {
        const existing = document.querySelector(`[resource="${a}"]`);
        if (existing) existing.remove();

        if (a.endsWith('.woff2')) {
            const fontConfig = defaultFonts.find(font => font.path === a);
            if (!fontConfig) {
                console.error(`No font configuration found for ${a}`);
                return;
            }

            const style = document.createElement('style');
            style.setAttribute("resource", a);
            style.textContent = `
                @font-face {
                    font-family: '${fontConfig.name}';
                    src: url(data:font/${fontConfig.format};base64,${b}) format('${fontConfig.format}');
                    font-display: ${fontConfig.display};
                    font-weight: normal;
                    font-style: normal;
                }
            `.trim();
            document.head.appendChild(style);
        } else if (a.endsWith('.css')) {
            let c = document.createElement('style');
            c.type = 'text/css';
            c.setAttribute("resource", a)
            c.innerHTML = b;
            document.head.appendChild(c);
        } else if (a.endsWith(".js")) {
            if (a === "/assets/framework/main.js") {
                return;
            }
            let c = document.createElement('script');
            c.type = 'text/javascript';
            c.setAttribute("resource", a);
            c.innerHTML = `(function() { ${b} })();`;
            document.head.appendChild(c);
        }
    } catch (err) {
        console.error(`Error loading asset ${a}:`, err);
    }
}

function connectWS() {
    if (wss && wss.readyState === WebSocket.CONNECTING) return;

    try {
        wss = new WebSocket(url);

        wss.onopen = function () {
            wsStatus = true;
            reconnectAttempts = 0;
            wss.send(JSON.stringify({ type: "ping" }));
            lastKeepAlive = Date.now();
            wss.send(JSON.stringify({ type: "keepalive" }));
            setInterval(() => {
                if (wsStatus && (!lastKeepAlive || (Date.now() - lastKeepAlive > 60000))) {
                    lastKeepAlive = Date.now();
                    wss.send(JSON.stringify({ type: "keepalive" }));
                }
            }, 60000);
        };

        wss.onclose = function () {
            wsStatus = false;
            lastKeepAlive = null;
            if (reconnectAttempts < maxReconnectAttempts) {
                const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
                reconnectAttempts++;
                if (reconnectTimeout) clearTimeout(reconnectTimeout);
                reconnectTimeout = setTimeout(connectWS, backoffTime);
            } else {
                console.error("Maximum reconnection attempts reached");
            }
        };

        wss.onerror = function (error) {
            console.error("WebSocket error:", error);
            wsStatus = false;
        };

        wss.onmessage = function (event) {
            let data = JSON.parse(event.data);
            handleWSMessage(data);
        };
    } catch (error) {
        console.error("WebSocket connection error:", error);
        if (reconnectAttempts < maxReconnectAttempts) {
            const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            reconnectAttempts++;
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            reconnectTimeout = setTimeout(connectWS, backoffTime);
        }
    }
}

function handleWSMessage(data) {
    switch (data.type) {
        case "reload": {
            location.reload();
            break;
        }
        case "refetch": {
            renderNow = true;
            wss.send(JSON.stringify({ type: "getPage", path: currentPath }));
        }
        case "render": {
            if (renderNow) {
                render(data.path);
                renderNow = false;
            } else {
                update(data.path, data.data);
            }
            cachedRoutes[data.path] = data.data;
            break;
        }
        case "manipulate": {
            update(data.path, { props: data.props });
            break;
        }
        case "routeData": {
            cachedRoutes[data.path] = data.data.data;
            if (window.location.pathname == data.path) update(data.path, data.data.data);
            break;
        }
    }
}

function render(url) {
    currentPath = url;
    history.pushState({}, '', url);
    if (cachedRoutes[url]) {
        update(url, cachedRoutes[url]);
    } else {
        renderNow = true;
        wss.send(JSON.stringify({ type: "getPage", path: url }));
    }
}

function update(url, { content, props }) {
    if (!content && props) {
        cachedRoutes[url] = { content: cachedRoutes[url]?.content || "", props };
        for ([i, j] of Object.entries(props)) {
            document.getElementById(`hcf_prop_${i}`).innerHTML = j;
        }
    } else {
        try {
            if (content == undefined || content == null) return location.href = url;
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            if (doc.body.innerHTML && !doc.body.querySelector('parsererror')) {
                const dynamicHeadElements = document.querySelectorAll('head style:not([resource]), head link:not([resource]), head script:not([resource]), head meta:not([name="viewport"])');
                dynamicHeadElements.forEach(el => el.setAttribute('data-old-element', 'true'));
                const newElements = [];
                Array.from(doc.head.children).forEach(el => {
                    if (!el.hasAttribute('resource') && el.tagName !== 'META' && el.tagName !== 'TITLE') {
                        const newEl = el.cloneNode(true);
                        document.head.appendChild(newEl);
                        newElements.push(newEl);
                    }
                });
                const cssLinks = newElements.filter(el => el.tagName === 'LINK' && el.getAttribute('rel') === 'stylesheet');
                if (cssLinks.length > 0) {
                    Promise.all(
                        cssLinks.map(link =>
                            new Promise(resolve => {
                                if (link.sheet) {
                                    resolve();
                                } else {
                                    link.onload = resolve;
                                    link.onerror = resolve;
                                }
                            })
                        )
                    ).then(() => {
                        document.querySelectorAll('[data-old-element="true"]').forEach(el => el.remove());
                    });
                } else {
                    setTimeout(() => {
                        document.querySelectorAll('[data-old-element="true"]').forEach(el => el.remove());
                    }, 10);
                }
                if (doc.title) {
                    document.title = doc.title;
                }
                if (doc.body.className) {
                    document.body.className = doc.body.className;
                }
                document.body.innerHTML = doc.body.innerHTML;
                
                const scripts = Array.from(doc.body.querySelectorAll('script'));
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    
                    Array.from(oldScript.attributes).forEach(attr => {
                        newScript.setAttribute(attr.name, attr.value);
                    });
                    
                    if (oldScript.src) {
                        newScript.src = oldScript.src;
                    } else {
                        newScript.textContent = oldScript.textContent;
                    }
                    
                    oldScript.remove();
                    document.body.appendChild(newScript);
                });
            } else {
                document.body.textContent = content;
            }
        } catch (e) {
            document.body.textContent = content;
        }

        currentPath = url;
        currentProps = props;
        cachedRoutes[url] = { content, props };
        renderNow = false;
    }
}