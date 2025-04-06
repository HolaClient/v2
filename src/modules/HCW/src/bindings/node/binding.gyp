{
  "targets": [
    {
      "target_name": "hcw",
      "sources": [
        "server_wrap.cpp",
        "../../src/socket.cpp",
        "../../src/app.cpp",
        "../../src/http/router.cpp",
        "../../src/http/server.cpp",
        "../../src/http/methods.cpp",
        "../../src/http/parser.cpp",
        "../../src/config/config.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "../../src",
        "<(node_root_dir)/include/node"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "defines": [
        "NAPI_CPP_EXCEPTIONS",
        "NAPI_VERSION=8"
      ],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "cflags_cc": [
        "-std=c++17",
        "-fPIC",
        "-fvisibility=hidden"
      ],
      "link_settings": {
        "libraries": [
          "-L<(node_root_dir)/lib",
          "-lnode"
        ]
      },
      "conditions": [
        ['OS=="linux"', {
          "cflags+": ["-fPIC"],
          "ldflags": ["-Wl,-rpath,'$$ORIGIN'"]
        }]
      ],
      "xcode_settings": {
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES"
      },
      "msvs_settings": {
        "VCCLCompilerTool": {
          "ExceptionHandling": 1
        }
      }
    }
  ]
}
