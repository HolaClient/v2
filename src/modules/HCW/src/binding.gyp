{
  "targets": [{
    "target_name": "hcw",
    "cflags!": [ "-fno-exceptions", "-fno-rtti" ],
    "cflags_cc!": [ "-fno-exceptions", "-fno-rtti" ],
    "sources": [ 
      "bindings/node/server_wrap.cpp",
      "src/socket.cpp",
      "src/app.cpp",
      "src/http/router.cpp",
      "src/http/server.cpp",
      "src/http/methods.cpp",
      "src/http/parser.cpp",
      "src/config/config.cpp"
    ],
    "include_dirs": [
      "<!@(node -p \"require('node-addon-api').include\")",
      ".",
      "src",
      "bindings/node"
    ],
    "defines": [
      "NAPI_CPP_EXCEPTIONS",
      "BUILDING_NODE_EXTENSION",
      "NODE_ADDON_API_DISABLE_DEPRECATED",
      "NAPI_DISABLE_CPP_EXCEPTIONS=0"
    ],
    "conditions": [
      ['OS=="win"', {
        "libraries": [ "-lws2_32.lib" ],
        "msvs_settings": {
          "VCCLCompilerTool": {
            "ExceptionHandling": 1,
            "RuntimeTypeInfo": "true"
          }
        }
      }],
      ['OS=="linux"', {
        "cflags": [
          "-fPIC",
          "-fvisibility=hidden"
        ],
        "cflags_cc": [
          "-fPIC",
          "-std=c++17",
          "-fvisibility-inlines-hidden",
          "-static-libstdc++",
          "-static-libgcc"
        ],
        "ldflags": [
          "-static-libstdc++",
          "-static-libgcc",
          "-Wl,--version-script=<!@(pwd)/bindings/node/scripts/symbols.map"
        ]
      }]
    ]
  }]
}
