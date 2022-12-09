
const fs = require("fs");
const path = require("path");

if (!fs.existsSync("dist")) {
  fs.mkdirSync("dist");
}

let html = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("index.css", "utf8");
const js = fs.readFileSync("index.js", "utf8");

html = html.replace(`<link rel="stylesheet" href="index.css" />`, `<style>\n${css}\n</style>`);
html = html.replace(`<script type="module" src="index.js"></script>`, `<script>\n${js}\n</script>`);

fs.writeFileSync(path.join(__dirname, "dist", "jsonForms.html"), html);
