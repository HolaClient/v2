module.exports = function linkHTMLCSSClassNames(html, classMap) {   
    return html.replace(/class="([^"]+)"/g, (match, classes) => {
        const compressedClasses = classes.split(' ')
            .map(cls => classMap[cls] || cls)
            .join(' ');
        return `class="${compressedClasses}"`;
    });
}