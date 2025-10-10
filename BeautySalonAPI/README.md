# Beauty Salon API

Bu proje, güzellik salonu yönetim sistemi için geliştirilmiş bir .NET 8 Web API'sidir.

## Özellikler

- **Müşteri Yönetimi**: Müşteri bilgileri, randevular ve seans takibi
- **Randevu Sistemi**: Randevu oluşturma, güncelleme ve takip
- **Ödeme Yönetimi**: Ödeme kayıtları ve takibi
- **Hizmet Yönetimi**: Hizmet kategorileri ve fiyatlandırma
- **Kullanıcı Yönetimi**: Rol tabanlı yetkilendirme sistemi
- **Raporlama**: Detaylı raporlar ve analizler
- **Lazer Seans Takibi**: Lazer epilasyon seansları
- **Bölgesel İncelme**: Bölgesel incelme seansları

## Teknolojiler

- **.NET 8**
- **Entity Framework Core**
- **PostgreSQL** (Production)
- **SQLite** (Development)
- **JWT Authentication**
- **Swagger/OpenAPI**

## Kurulum

### Gereksinimler

- .NET 8 SDK
- PostgreSQL (Production için)
- SQLite (Development için)

### Development Kurulumu

1. Projeyi klonlayın:
```bash
git clone <repository-url>
cd BeautySalonAPI
```

2. Bağımlılıkları yükleyin:
```bash
dotnet restore
```

3. Veritabanını oluşturun:
```bash
dotnet ef database update
```

4. Uygulamayı çalıştırın:
```bash
dotnet run
```

### Production Kurulumu (Railway)

1. Railway hesabınızda yeni proje oluşturun
2. PostgreSQL servisi ekleyin
3. GitHub repository'nizi bağlayın
4. Environment variables'ları ayarlayın:
   - `DATABASE_HOST`
   - `DATABASE_NAME`
   - `DATABASE_USER`
   - `DATABASE_PASSWORD`
   - `DATABASE_PORT`
   - `JWT_SECRET_KEY`

## API Dokümantasyonu

Development modunda Swagger UI: `http://localhost:5000/swagger`

## Environment Variables

### Production (Railway)

```env
DATABASE_HOST=your-postgres-host
DATABASE_NAME=your-database-name
DATABASE_USER=your-username
DATABASE_PASSWORD=your-password
DATABASE_PORT=5432
JWT_SECRET_KEY=your-secret-key
ASPNETCORE_ENVIRONMENT=Production
```

### Development

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=beautysalon;Username=postgres;Password=postgres"
  },
  "Jwt": {
    "SecretKey": "BeautySalon2024SecretKeyForJWTTokenGeneration12345"
  }
}
```

## Veritabanı Migrasyonları

Yeni migration oluşturma:
```bash
dotnet ef migrations add MigrationName
```

Migration'ları uygulama:
```bash
dotnet ef database update
```

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.
