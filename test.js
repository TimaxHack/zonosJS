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