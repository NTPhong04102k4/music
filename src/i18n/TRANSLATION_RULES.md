# i18n Rules (EN/VN) – Quy ước dịch trong dự án

Dự án đang dùng `i18next` + `react-i18next` (xem `src/i18n/index.js`) và lưu bản dịch tại:

- `src/i18n/locales/en/translation.json`
- `src/i18n/locales/vi/translation.json`

Mục tiêu: **không để text cứng trong UI** (trừ dữ liệu từ API), mọi chữ hiển thị ra màn hình phải đi qua `t('...')`.

---

## 1) Quy ước đặt key

- **Dùng namespace theo khu vực/chức năng**: `header.*`, `sidebar.*`, `settings.*`, `userMenu.*`, `player.*`, `playlist.*`, `admin.*`, ...
- **Key dùng `camelCase`**, không dấu, không khoảng trắng, không tiếng Việt trong key.
- **Không nhét nhiều ý vào 1 key** (một key = một câu/nhãn).
- **Tránh key theo “text”** (vd `welcomeToAppText`) nếu có thể; ưu tiên theo ngữ nghĩa (vd `auth.welcomeTitle`).

Ví dụ tốt:

- `settings.language`
- `player.shuffle`
- `playlist.addToPlaylist`
- `admin.songManager.title`

Ví dụ không tốt:

- `NgonNgu`
- `settings_language_text`
- `text1`

---

## 2) Cách dùng trong component React

### Import và dùng `t`

```js
import { useTranslation } from "react-i18next";

const { t } = useTranslation();
```

Thay text cứng:

```js
<span>{t("settings.language")}</span>
```

---

## 3) Text nào KHÔNG đưa vào i18n?

- **Dữ liệu từ API**: tên bài hát, nghệ sĩ, album, lyrics… (đây là content).
- `alt`/`title` nếu lấy từ API (vd `alt={song.title}`) thì giữ nguyên.

---

## 4) Interpolation (chèn biến vào câu)

Trong code:

```js
t("common.helloUser", { name: user.name })
```

Trong JSON:

```json
{
  "common": {
    "helloUser": "Hello, {{name}}"
  }
}
```

VI:

```json
{
  "common": {
    "helloUser": "Xin chào, {{name}}"
  }
}
```

---

## 5) Plural (đếm số lượng)

Trong code:

```js
t("common.songCount", { count })
```

Trong JSON (EN):

```json
{
  "common": {
    "songCount_one": "{{count}} song",
    "songCount_other": "{{count}} songs"
  }
}
```

Trong JSON (VI):

```json
{
  "common": {
    "songCount_one": "{{count}} bài hát",
    "songCount_other": "{{count}} bài hát"
  }
}
```

---

## 6) Workflow thêm bản dịch

1. **Tìm text cứng** trong component.
2. **Quyết định namespace** phù hợp (vd `settings.*`).
3. Thêm key mới vào **cả 2 file**:
   - `src/i18n/locales/en/translation.json`
   - `src/i18n/locales/vi/translation.json`
4. Thay text trong component bằng `t("namespace.key")`.
5. Chạy app và click qua các màn hình để đảm bảo **không thiếu key**.

---

## 7) Checklist PR

- Không còn text cứng trong UI cho phần vừa sửa.
- Key đặt theo namespace đúng, `camelCase`.
- Key mới có mặt trong cả EN và VI.
- Không trùng key với nghĩa khác.


