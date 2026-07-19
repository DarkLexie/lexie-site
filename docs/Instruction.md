# Как добавить новую работу на сайт

1. Подготовь картинку:
   - Положи оригинал в `images/source/light/` или `images/source/dark/`
   - Сконвертируй в WebP два размера:
     - preview (для сетки): `images/preview/<light|dark>/slug.webp`
     - full (для лайтбокса): `images/full/<light|dark>/slug.webp`

2. Открой `data/works.json` и добавь новую запись:
   ```json
   {
     "slug": "slug-работы",
     "title": "Название",
     "universe": "light",
     "tags": ["vintage"],
     "featured": false,
     "dateAdded": "ГГГГ-ММ-ДД",
     "w": 800,
     "h": 1000
   }
   ```

3. Сохрани и обнови страницу — работа появится в галерее автоматически.

## Как добавить видео-работу (Reels)

Reels — это фильтр-чип внутри галереи (рядом с Vintage/Horror и т.д.), а не отдельная страница. Видео показываются в той же сетке (постер + иконка play), при клике проигрываются в лайтбоксе.

1. Положи видео (h264, mp4, со сжатием под веб) в `images/videos/<light|dark>/slug.mp4`.
2. Вырежи кадр-постер и сохрани как `images/preview/<light|dark>/slug.webp` (тот же путь, что и у обычных превью).
3. Добавь запись в `data/works.json`, добавив `"type": "video"`, `"poster"` и `"src"` вместо обычного `"src"`/`"thumb"`:
   ```json
   {
     "slug": "slug-видео",
     "title": "Название",
     "universe": "dark",
     "tags": ["Reels", "Horror"],
     "type": "video",
     "featured": false,
     "dateAdded": "ГГГГ-ММ-ДД",
     "poster": "images/preview/dark/slug.webp",
     "src": "images/videos/dark/slug.mp4",
     "w": 800,
     "h": 1000
   }
   ```
   Для обычных (не-video) работ поле `type` не указывается вовсе — по умолчанию это `"image"`, старые записи менять не нужно.
4. Тег `"Reels"` обязателен — по нему видео попадает во вкладку Reels. Остальные теги — по смыслу, как у обычных работ.
