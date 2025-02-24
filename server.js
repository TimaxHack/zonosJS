#!/usr/bin/env node
import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

async function installPythonDependencies() {
    try {
        const projectRoot = process.cwd(); // Корень проекта, например, /workspace/zonosJS
        const venvPath = path.join(projectRoot, '.venv'); // Путь к виртуальному окружению
        const venvPython = path.join(venvPath, 'bin', 'python'); // Путь к Python в виртуальном окружении
        const zonosDir = path.join(projectRoot, 'zonos'); // Путь для клонирования Zonos

        // Создаём виртуальное окружение, если его нет
        if (!fs.existsSync(venvPath)) {
            console.log('Создаём виртуальное окружение...');
            execSync(`python3 -m venv ${venvPath}`, { stdio: 'inherit' });
        }

        // Обновляем pip
        console.log('Обновляем pip...');
        execSync(`${venvPython} -m pip install --upgrade pip`, { stdio: 'inherit' });

        // Клонируем репозиторий Zonos, если его нет
        if (!fs.existsSync(zonosDir)) {
            console.log('Клонируем репозиторий Zonos...');
            execSync(`git clone https://github.com/Zyphra/Zonos.git ${zonosDir}`, { stdio: 'inherit' });
        } else {
            console.log('Репозиторий Zonos уже существует, обновляем...');
            execSync(`git -C ${zonosDir} pull`, { stdio: 'inherit' });
        }

        // Устанавливаем Zonos в виртуальное окружение
        console.log('Устанавливаем Zonos...');
        execSync(`${venvPython} -m pip install -e ${zonosDir}`, { stdio: 'inherit' });

        // Устанавливаем остальные зависимости
        console.log('Устанавливаем зависимости...');
        execSync(`${venvPython} -m pip install torch torchaudio fastapi uvicorn langdetect numpy`, { stdio: 'inherit' });
        console.log('Все зависимости готовы');
    } catch (error) {
        console.error('Ошибка установки зависимостей:', error.message);
        throw error;
    }
}

async function serve() {
    try {
        const projectRoot = process.cwd(); // Корень проекта
        const venvPython = path.join(projectRoot, '.venv', 'bin', 'python'); // Путь к Python в виртуальном окружении
        const serverPath = path.join(projectRoot, 'node_modules', 'zonosjs', 'server.py'); // Динамический путь к server.py

        // Устанавливаем зависимости
        await installPythonDependencies();

        // Запускаем сервер
        console.log('Запускаем сервер...');
        const serverProcess = spawn(venvPython, [serverPath], { stdio: 'inherit' });

        serverProcess.on('error', (err) => {
            console.error('Ошибка запуска сервера:', err);
        });
        serverProcess.on('close', (code) => {
            console.log(`Сервер завершился с кодом ${code}`);
        });
    } catch (error) {
        console.error('Ошибка:', error.message);
    }
}

serve();