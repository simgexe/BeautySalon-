# CSS Dosya Yapısı

## 📁 Dosya Organizasyonu

```
src/styles/
├── index.css          # Ana CSS dosyası - tüm stilleri import eder
├── simple.css         # Temel stiller (buttons, forms, tables, etc.)
├── README.md          # Bu dosya
└── components/        # Bileşen özel stilleri
    ├── table.module.css
    ├── modal.module.css
    └── pageHeader.module.css
```

## 🎯 Kullanım

### 1. Ana CSS'i Import Et
```javascript
// App.js veya index.js'de
import './styles/index.css';
```

### 2. Bileşenlerde Kullan
```javascript
// Basit CSS sınıfları
<div className="card">
  <h2 className="card-title">Başlık</h2>
  <button className="btn btn-primary">Kaydet</button>
</div>

// Form bileşenleri
<div className="form-group">
  <label className="form-label required">Ad Soyad</label>
  <input className="form-input" type="text" />
</div>
```

## 🎨 Mevcut CSS Sınıfları

### Buttons
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-success`, `.btn-danger`, `.btn-outline`

### Forms
- `.form-group`, `.form-label`, `.form-input`, `.form-select`, `.form-textarea`
- `.form-row`, `.form-col`, `.form-col-6`, `.form-actions`

### Layout
- `.container`, `.flex`, `.flex-col`, `.items-center`, `.justify-center`
- `.gap-1`, `.gap-2`, `.gap-3`, `.gap-4`

### Cards & Tables
- `.card`, `.card-header`, `.card-title`
- `.table`, `.table th`, `.table td`

### Utilities
- `.text-center`, `.text-sm`, `.font-bold`
- `.bg-white`, `.rounded`, `.shadow`
- `.hidden`, `.block`, `.w-full`

## 📱 Responsive
Tüm bileşenler mobil uyumludur. 768px altında otomatik olarak düzenlenir.

## 🔧 Yeni Stil Ekleme
1. `simple.css` dosyasına ekleyin (genel stiller için)
2. Bileşen klasörüne ekleyin (özel stiller için)
3. `index.css`'e import edin 