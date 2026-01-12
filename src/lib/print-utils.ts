
export const printElement = (element: HTMLElement, title: string = 'Print') => {
    // Create iframe element
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (!doc) {
        document.body.removeChild(iframe);
        return;
    }

    // Get all style sheets
    const stylesheets = Array.from(document.styleSheets)
        .map(stylesheet => {
            try {
                if (stylesheet.href) {
                    return `<link rel="stylesheet" href="${stylesheet.href}">`;
                }
                const rules = Array.from(stylesheet.cssRules)
                    .map(rule => rule.cssText)
                    .join('\n');
                return `<style>${rules}</style>`;
            } catch (e) {
                return '';
            }
        })
        .join('\n');

    // Get inline styles
    const inlineStyles = Array.from(document.querySelectorAll('style'))
        .map(style => style.outerHTML)
        .join('\n');

    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <title>${title}</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            ${stylesheets}
            ${inlineStyles}
            <style>
                @media print {
                    body { margin: 0; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            </style>
        </head>
        <body>
            ${element.outerHTML}
        </body>
        </html>
    `);
    doc.close();

    // Print when images needed for print are loaded (optional improvement), 
    // but typically a small timeout or onload is sufficient.
    
    iframe.onload = () => {
        // Wait a bit ensuring styles applied and rendering happened
        setTimeout(() => {
            try {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
            } catch (e) {
                console.error("Print failed", e);
            } finally {
                // Remove iframe after printing (or if user cancels)
                // Note: The 'afterprint' event isn't 100% reliable across all browsers/versions for remove, 
                // but significantly better than removing immediately.
                // For safety in Electron/Chrome, we can remove it after a delay or listen to focus returning.
                
                // Simple cleanup:
                setTimeout(() => {
                    if (document.body.contains(iframe)) {
                        document.body.removeChild(iframe);
                    }
                }, 1000);
            }
        }, 500);
    };
};
