#!/usr/bin/env node

const { execSync } = require('child_process');
const { platform, arch } = process;
const path = require('path');
const fs = require('fs');

const isWin = platform === 'win32';
const projectRoot = path.resolve(__dirname, '../../..');
const compiler = isWin ? 'clang++' : 'g++';

async function build() {
    console.log('Building native module...');

    try {
        const headerDir = path.resolve(__dirname, '../../../headers/nodejs');
        const nodeLibDir = path.join(headerDir, 'lib');

        if (!fs.existsSync(headerDir)) {
            throw new Error('Node headers directory not found at: ' + headerDir);
        }

        const sources = [
            'bindings/node/server_wrap.cpp',
            'src/socket.cpp',
            'src/app.cpp',
            'src/http/router.cpp',
            'src/http/server.cpp',
            'src/config/config.cpp',
            'build/parser.o'
        ].map(f => path.join(projectRoot, f));

        const includeDirs = [
            path.join(projectRoot, 'src'),
            path.join(headerDir, 'include'),
            path.join(headerDir, 'include/node'),
            path.join(projectRoot, 'node_modules/node-addon-api')
        ];

        const buildDir = path.join(__dirname, '..', 'build');
        fs.mkdirSync(buildDir, { recursive: true });

        const outName = `hcw_${platform}_${arch}.node`;
        const outFile = path.join(buildDir, outName);

        const commonFlags = [
            '-std=c++17',
            '-fPIC',
            '-shared',
            '-O3',
            '-fvisibility=hidden',
            '-fvisibility-inlines-hidden',
            '-fno-inline-functions',
            '-ffunction-sections',
            '-fdata-sections',
            '-DNODE_ADDON_API_DISABLE_DEPRECATED',
            '-DNODE_GYP_MODULE_NAME=hcw',
            '-DNAPI_CPP_EXCEPTIONS',
            '-DBUILDING_NODE_EXTENSION'
        ];

        const platformFlags = isWin
            ? ['-lws2_32', '-Wl,--export-all-symbols']
            : [
                '-pthread',
                '-Wl,--exclude-libs,ALL',
                '-Wl,--no-undefined',
                '-Wl,--gc-sections',
                '-Wl,--as-needed',
                '-Wl,--version-script=' + path.join(__dirname, 'symbols.map')
            ];

        if (!isWin) {
            const symbolsMap = `{
            global:
                _ZN4http*;
                node_register_module_v*;
            local: *;
            };`;
            fs.writeFileSync(path.join(__dirname, 'symbols.map'), symbolsMap);
        }

        const cmd = [
            compiler,
            ...commonFlags,
            ...platformFlags,
            ...includeDirs.map(dir => `-I"${dir}"`),
            ...sources.map(f => `"${f}"`),
            '-o',
            `"${outFile}"`
        ].join(' ');

        console.log('Compiling C++ files...');
        execSync(cmd, { stdio: 'inherit', cwd: projectRoot });
        console.log('Build successful!');

    } catch (error) {
        console.error('Build failed:', error.message);
        process.exit(1);
    }
}

build().catch(console.error);