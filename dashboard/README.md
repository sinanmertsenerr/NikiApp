# NikiTheCat Analytics Dashboard

<p align="center">
  <img src="https://img.shields.io/badge/React-18-blue" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-7-purple" alt="Vite" />
  <img src="https://img.shields.io/badge/Chakra%20UI-3-teal" alt="Chakra UI" />
</p>

NikiTheCat mobil uygulaması için **VIEW-ONLY** analytics ve raporlama portalı.

## 🚀 Hızlı Başlangıç

```bash
# Dependencies yükle
cd dashboard
npm install

# Development server başlat
npm run dev

# Production build
npm run build
```

## 📂 Proje Yapısı

```
dashboard/
├── src/
│   ├── api/          # Backend API modülleri
│   │   ├── client.ts     # Axios + JWT interceptor
│   │   ├── auth.ts       # Login, logout
│   │   ├── wallet.ts     # Wallet stats, transactions
│   │   ├── dashboard.ts  # Overview, campaigns
│   │   ├── users.ts      # User list
│   │   └── raffles.ts    # Raffles
│   ├── components/
│   │   ├── layout/       # Sidebar, Header, Layout
│   │   ├── cards/        # StatCard, WalletCard
│   │   ├── charts/       # (Yakında)
│   │   └── tables/       # (Yakında)
│   ├── pages/
│   │   ├── Login.tsx     # Admin giriş
│   │   ├── Overview.tsx  # Ana dashboard
│   │   └── Placeholder.tsx # Diğer sayfalar (altyapı hazır)
│   ├── store/            # Zustand auth store
│   ├── theme/            # Chakra UI tema (IEU/NIKI renkleri)
│   ├── types/            # TypeScript types
│   └── utils/            # Formatters, export (CSV/Excel/PDF)
├── .env                  # API URL config
└── package.json
```

## 💳 Kart Sistemi

| Kart | Renk | İndirim | Durum |
|------|------|---------|-------|
| **IEU Card** | 🟢 Emerald | %15 | Admin aktivasyon gerekli |
| **NIKI Card** | 🟠 Amber | %10 | Otomatik aktif |

## 📊 Dashboard Sayfaları

| Sayfa | Durum | Açıklama |
|-------|-------|----------|
| 🏠 Overview | ✅ Hazır | Ana istatistikler, kart özeti |
| 💳 Cüzdan | 🔨 Altyapı | IEU/NIKI tab yapısı |
| 👥 Kullanıcılar | 🔨 Altyapı | Kullanıcı listesi |
| 🎁 Kampanyalar | 🔨 Altyapı | Kampanya performansı |
| 🎰 Çekiliş | 🔨 Altyapı | Çekiliş & şans çarkı |
| 📊 Raporlar | 🔨 Altyapı | Export araçları |

## 🔧 Konfigürasyon

### Environment Variables

```env
# .env
VITE_API_URL=http://localhost:3000
```

### Backend Bağlantısı

Dashboard backend'e şu endpoint'ler üzerinden bağlanır:

| Endpoint | Kullanım |
|----------|----------|
| `POST /auth/login` | Admin girişi |
| `GET /admin/wallet/stats` | Cüzdan istatistikleri |
| `GET /admin/campaigns/overview` | Dashboard özeti |
| `GET /admin/users` | Kullanıcı listesi |
| `GET /admin/raffles` | Çekiliş listesi |

## 📦 Export Özellikleri

Hazır export fonksiyonları (`src/utils/export.ts`):

- `exportToCsv()` - CSV dosyası
- `exportToExcel()` - Excel (.xlsx)
- `exportToPdf()` - PDF raporu

## 🎨 Tema

NikiTheCat renk paleti (`src/theme/index.ts`):

- **Brand**: Indigo (#6366F1)
- **IEU**: Emerald (#10B981)
- **NIKI**: Amber (#F59E0B)

## 📱 Responsive

- Desktop: Full sidebar
- Tablet: Collapsed sidebar (yakında)
- Mobile: Bottom nav (yakında)

## 🔐 Authentication

- JWT Access Token (memory + localStorage)
- Refresh Token (localStorage)
- Admin-only access check
- Protected routes

---

## 🗺️ Yol Haritası

### Faz 1 ✅ (Tamamlandı)
- [x] Proje kurulumu
- [x] Chakra UI tema
- [x] API client + JWT
- [x] Auth store (Zustand)
- [x] Layout (Sidebar, Header)
- [x] Overview sayfası
- [x] StatCard, WalletCard
- [x] Export utilities

### Faz 2 (Sıradaki)
- [ ] Cüzdan sayfası (IEU/NIKI tabs)
- [ ] İşlem tablosu
- [ ] Kullanıcı listesi
- [ ] Grafikler (Recharts)

### Faz 3 (Gelecek)
- [ ] Kampanya detayları
- [ ] Çekiliş istatistikleri
- [ ] Özel raporlar
- [ ] Dark mode

---

**Not**: Bu dashboard SADECE görüntüleme içindir. Tüm CRUD işlemleri mobil admin panelden yapılmaktadır.
