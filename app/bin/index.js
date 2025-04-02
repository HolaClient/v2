#!/usr/bin/env node
const { program } = require('commander');
const chalk = require('../../src/modules/HCU/colors');
process.loadEnvFile('.env')

program
    .version('X1')
    .description("Welcome to HolaClientX's CLI");

program
    .command('secret')
    .description('Log the session secret key.')
    .action(() => {
        console.log(chalk.white("======================================================="));
        console.log(chalk.gray("{/} 🗝️") + chalk.cyan(" [") + chalk.white("HolaClient") + chalk.cyan("]") + chalk.white(" Authentication code for this session is ") + chalk.cyan(process.env.APP_CODE))
        console.log(chalk.white("======================================================="));
    });

program
    .command('db:seed')
    .description('Seed default factory settings & values to the database.')
    .action(() => {
        require('./seedFactories')()
    });

program
    .command('build:assets')
    .description('Build JS & CSS for the frontend.')
    .action(() => {
        require('./buildAssets')()
    });

program
    .command('build:all')
    .description('Builds Tailwind CSS, CSS & JS.')
    .action(() => {
        require('./buildAll')()
    });

program
    .command('user:create')
    .description('Create a user.')
    .action(() => {
        require('./userCreate')();
    });

program
    .command('user:modify')
    .description("Modify an user's permission level.")
    .action(() => {
        require('./userModify')();
    });

program
    .command('reset:factory')
    .description('Reset application to factory settings.')
    .action(() => {
        require('./resetFactory')()
    });
    
program.parse(process.argv);