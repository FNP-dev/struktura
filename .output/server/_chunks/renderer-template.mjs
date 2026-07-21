import { r as HTTPResponse } from "../_libs/h3+rou3+srvx.mjs";
//#region #nitro/virtual/renderer-template
var rendererTemplate = () => new HTTPResponse("<!doctype html>\n<html lang=\"pl\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <link rel=\"icon\" type=\"image/svg+xml\" href=\"/favicon.svg\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\" />\n    <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin />\n    <link\n      href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap\"\n      rel=\"stylesheet\"\n    />\n    <title>FNP — Struktura Organizacyjna</title>\n    <meta\n      name=\"description\"\n      content=\"Platforma zarządzania strukturą organizacyjną firmy: pracownicy, działy, procesy, dokumenty i raporty.\"\n    />\n    <script type=\"module\" crossorigin src=\"/assets/index-Df0Ep8lY.js\"><\/script>\n    <link rel=\"stylesheet\" crossorigin href=\"/assets/index-QbZfmX24.css\">\n  </head>\n  <body>\n    <div id=\"root\"></div>\n  </body>\n</html>\n", { headers: { "content-type": "text/html; charset=utf-8" } });
//#endregion
//#region node_modules/nitro/dist/runtime/internal/routes/renderer-template.mjs
function renderIndexHTML(event) {
	return rendererTemplate(event.req);
}
//#endregion
export { renderIndexHTML as default };
