import io
import logging
import torch
import torchaudio
from zonos.model import Zonos
from zonos.conditioning import make_cond_dict
from fastapi import FastAPI, Form
from fastapi.responses import StreamingResponse
from functools import lru_cache
from langdetect import detect, DetectorFactory
from typing import Optional

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

DetectorFactory.seed = 0
app = FastAPI()
DEVICE = "cpu"
MODEL = Zonos.from_pretrained("Zyphra/Zonos-v0.1-transformer", device=DEVICE)
logger.info("Модель загружена на устройство: %s", DEVICE)

@lru_cache(maxsize=100)
def generate_speech_cached(text: str, language: str, speaker_embedding: Optional[torch.Tensor] = None):
    return generate_speech(text, language, speaker_embedding)

def generate_speech(text: str, language: str, speaker_embedding: Optional[torch.Tensor] = None):
    logger.info(f"Генерация речи: текст='{text}', язык='{language}', спикер={speaker_embedding is not None}")
    try:
        cond_dict = make_cond_dict(text=text, speaker=speaker_embedding, language=language)
        conditioning = MODEL.prepare_conditioning(cond_dict)
        with torch.no_grad():
            codes = MODEL.generate(conditioning)
            wavs = MODEL.autoencoder.decode(codes).cpu()
        audio_buffer = io.BytesIO()
        torchaudio.save(audio_buffer, wavs[0], MODEL.autoencoder.sampling_rate, format="wav")
        audio_buffer.seek(0)
        logger.info("Речь успешно сгенерирована")
        return audio_buffer
    except Exception as e:
        logger.error(f"Ошибка генерации речи: {e}")
        raise

@app.post("/tts")
async def tts_endpoint(
    text: str = Form(...),
    reference_audio_path: Optional[str] = Form(None),
    language: Optional[str] = Form(None)
):
    logger.info(f"Получен запрос: текст='{text}', реф. аудио='{reference_audio_path}', язык='{language}'")
    if not language:
        try:
            language = detect(text)
            logger.info(f"Определён язык: {language}")
        except Exception as e:
            logger.warning(f"Ошибка определения языка: {e}")
            language = "en-us"
    
    speaker_embedding = None
    if reference_audio_path:
        try:
            wav, sr = torchaudio.load(reference_audio_path, normalize=True)
            speaker_embedding = MODEL.make_speaker_embedding(wav, sr)
            logger.info(f"Сгенерирован эмбеддинг спикера из {reference_audio_path}")
        except Exception as e:
            logger.error(f"Ошибка загрузки референсного аудио: {e}")
            return {"error": "Ошибка загрузки референсного аудио"}
    
    try:
        audio_buffer = generate_speech_cached(text, language, speaker_embedding)
        return StreamingResponse(audio_buffer, media_type="audio/wav", 
                                 headers={"Content-Disposition": "attachment; filename=output.wav"})
    except Exception as e:
        logger.error(f"Ошибка генерации речи: {e}")
        return {"error": f"Ошибка генерации речи: {str(e)}"}

@app.get("/")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)