import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

class ZonosJS {
    constructor(serverUrl = 'http://localhost:5000') {
        this.serverUrl = serverUrl;
    }

    async checkServer() {
        try {
            await axios.get(this.serverUrl);
            return true;
        } catch (error) {
            return false;
        }
    }

    async generateSpeech(text, referenceAudioPath = null, language = null) {
        if (!(await this.checkServer())) {
            throw new Error('Сервер ZonosJS не запущен. Запустите его с помощью "npx zonosjs serve" в отдельном терминале.');
        }

        const form = new FormData();
        form.append('text', text);
        if (referenceAudioPath) form.append('reference_audio_path', referenceAudioPath);
        if (language) form.append('language', language);

        try {
            const response = await axios.post(`${this.serverUrl}/tts`, form, {
                headers: form.getHeaders(),
                responseType: 'arraybuffer'
            });
            return response.data;
        } catch (error) {
            throw new Error(`Ошибка генерации речи: ${error.message}`);
        }
    }
}

export default ZonosJS;