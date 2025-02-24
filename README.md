# ZonosJS

**ZonosJS** — это NPM-пакет для запуска и взаимодействия с локальным сервером Zonos, реализующим text-to-speech (TTS) с клонированием голоса на базе модели zyphra/zonos. Пакет автоматически проверяет и устанавливает необходимые зависимости, предоставляя клиент для генерации речи.

## Описание

ZonosJS работает как локальный TTS-инструмент, аналогичный Ollama. Он использует модель zyphra/zonos для преобразования текста в речь с возможностью клонирования голоса из референсного аудиофайла. Сервер запускается на Python с FastAPI, а клиент написан на JavaScript и интегрируется как NPM-пакет.

### Как это работает
1. **Установка зависимостей**: Команда `zonosjs serve` проверяет и устанавливает Python-зависимости (FastAPI, torch, zyphra/zonos и др.), если они отсутствуют.
2. **Запуск сервера**: Сервер запускается в отдельном терминале на порту 5000 и показывает логи работы.
3. **Генерация речи**: Клиент отправляет HTTP-запросы к серверу, указывая текст, опциональный путь к аудиофайлу для клонирования и язык. Сервер возвращает аудиофайл в формате WAV.

## Установка

Установите пакет через npm:

```bash
npm install -g zonosjs
```

## Пример: 

```bash
npx zonosjs serve
```

```js
import ZonosJS from 'zonosjs';
import fs from 'fs';

const client = new ZonosJS();

async function run() {
    try {
        const audioBuffer = await client.generateSpeech(
            'Привет, мир!',
            './reference.wav', // Путь к WAV-файлу для клонирования
            'ru'              // Язык (опционально)
        );
        fs.writeFileSync('output.wav', audioBuffer);
        console.log('Аудио успешно сохранено в output.wav');
    } catch (error) {
        console.error('Ошибка:', error.message);
    }
}

run();
```

```bash
node example.js
```