const fs = require('fs');
const path = require('path');

const symbolsMap = `{
  global:
    napi_register_module_v*;
    _ZN3hcw*;
    _Z12InitModulePN4node*;
    _ZN10ServerWrap*;
    _ZN10RouterWrap*;
    Init;
  local: *;
};`;

const mapPath = path.join(__dirname, 'symbols.map');
fs.writeFileSync(mapPath, symbolsMap);
console.log('Created symbols map at:', mapPath);
