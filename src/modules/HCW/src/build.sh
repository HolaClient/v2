#!/bin/bash

mkdir -p build
mkdir -p bindings/node/build

rm -rf build/*
rm -rf bindings/node/build/*

echo "Compiling assembly..."
nasm -f elf64 -DLINUX -g -F dwarf -DPIC src/build_res.asm -o build/build_res.o

chmod 644 build/*.o

echo "Compiling C++..."
g++ -m64 -O3 -g -fvisibility=hidden -fvisibility-inlines-hidden \
    -march=native -mtune=native -flto \
    -fno-rtti -funroll-loops -finline-functions \
    -fomit-frame-pointer -fno-asynchronous-unwind-tables -ffast-math \
    -fprefetch-loop-arrays -msse4.2 -mavx2 -pthread -fPIC -fPIE -pie -fexceptions \
    -D__linux__ -DNDEBUG -DPERFORMANCE_MODE -DEPOLL_MODE \
    -I./src \
    src/*.cpp src/*/*.cpp \
    build/build_res.o \
    -o build/webserver \
    -lpthread

cp build/build_res.o bindings/node/build/

echo "Building Node.js addon..."
cd bindings/node

rm -rf build
rm -rf node_modules
rm -f package-lock.json

export npm_config_node_gyp=$(which node-gyp)
export NODE_ROOT_DIR=$(dirname $(dirname $(which node)))
export NODE_HEADERS_DIR="${NODE_ROOT_DIR}/include/node"
export NODE_LIB_DIR="${NODE_ROOT_DIR}/lib"

npm install --save node-addon-api bindings

node-gyp clean configure \
  --nodedir="${NODE_ROOT_DIR}" \
  --python=/usr/bin/python3

NODE_HEADERS_DIR="${NODE_HEADERS_DIR}" \
CFLAGS="-I${NODE_HEADERS_DIR}" \
CXXFLAGS="-I${NODE_HEADERS_DIR}" \
LDFLAGS="-L${NODE_LIB_DIR}" \
node-gyp rebuild

cd ../..