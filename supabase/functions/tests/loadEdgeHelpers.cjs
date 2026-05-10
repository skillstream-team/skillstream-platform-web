const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadEdgeHelperModule(relativePath) {
  const absolutePath = path.resolve(__dirname, relativePath);
  const source = fs.readFileSync(absolutePath, 'utf8');
  const exportNames = [];
  const transformed = source.replace(/export const\s+([a-zA-Z0-9_]+)\s*=/g, (_match, name) => {
    exportNames.push(name);
    return `const ${name} =`;
  });
  const wrapped = `${transformed}\nmodule.exports = { ${exportNames.join(', ')} };`;
  const context = {
    module: { exports: {} },
    exports: {},
    require,
    TextEncoder,
    TextDecoder,
    URL,
    atob: global.atob || ((value) => Buffer.from(value, 'base64').toString('binary')),
    btoa: global.btoa || ((value) => Buffer.from(value, 'binary').toString('base64')),
  };
  vm.runInNewContext(wrapped, context, { filename: absolutePath });
  return context.module.exports;
}

module.exports = { loadEdgeHelperModule };
