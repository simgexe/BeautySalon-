# Beauty Salon - Deployment Guide

## İlk Admin Kullanıcısı Oluşturma

### Yöntem 1: API Endpoint ile (Önerilen)

1. **Backend'i başlatın:**
   ```bash
   cd BeautySalonAPI
   dotnet run
   ```

2. **İlk admin kullanıcısını oluşturun:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/create-admin
   ```

   Bu komut:
   - Admin ve Staff rollerini oluşturur
   - `admin` kullanıcısını oluşturur (şifre: `admin123`)
   - Şifre BCrypt ile hash'lenir

3. **Giriş bilgileri:**
   - Kullanıcı adı: `admin`
   - Şifre: `admin123`

### Yöntem 2: Database'de Manuel Oluşturma

Eğer API endpoint çalışmazsa:

1. **SQLite veritabanını açın:**
   ```bash
   sqlite3 BeautySalonAPI/BeautySalonDB_Dev.db
   ```

2. **Rolleri oluşturun:**
   ```sql
   INSERT INTO Roles (Name, Description, IsActive, CreatedAt) VALUES 
   ('Admin', 'Sistem yöneticisi', 1, datetime('now')),
   ('Staff', 'Personel', 1, datetime('now')),
   ('Specialist', 'Uzman', 1, datetime('now')),
   ('Customer', 'Müşteri', 1, datetime('now'));
   ```

3. **Admin kullanıcısını oluşturun:**
   ```sql
   INSERT INTO Users (Username, PasswordHash, FirstName, LastName, PhoneNumber, RoleId, IsActive, CreatedAt) 
   VALUES ('admin', '$2a$11$example_hash_here', 'Admin', 'User', '555-0001', 1, 1, datetime('now'));
   ```

   **Not:** PasswordHash için BCrypt hash kullanın. Online BCrypt generator kullanabilirsiniz.

## Şifre Sıfırlama

### Admin Üzerinden Şifre Sıfırlama

1. **Admin olarak giriş yapın**
2. **Kullanıcılar sayfasına gidin**
3. **Sıfırlamak istediğiniz kullanıcının yanındaki "🔑 Sıfırla" butonuna tıklayın**
4. **Yeni şifreyi girin ve "Şifreyi Sıfırla" butonuna tıklayın**

### API ile Şifre Sıfırlama

```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"username": "kullanici_adi", "newPassword": "yeni_sifre"}'
```

## Güvenlik Notları

### ✅ Yapılan İyileştirmeler

1. **Şifre Hashleme:** Tüm şifreler BCrypt ile hash'lenir
2. **Güvenli Giriş:** Sadece hash'lenmiş şifreler kabul edilir
3. **Admin Şifre Sıfırlama:** Admin kullanıcıların şifrelerini sıfırlayabilir
4. **İlk Kurulum:** Otomatik admin kullanıcısı oluşturma

### 🔒 Güvenlik Önerileri

1. **İlk girişten sonra admin şifresini değiştirin**
2. **Üretim ortamında güçlü şifreler kullanın**
3. **HTTPS kullanın (üretimde)**
4. **Düzenli olarak şifreleri güncelleyin**

## Sorun Giderme

### Admin Giriş Yapamıyorum

1. **Backend çalışıyor mu kontrol edin:**
   ```bash
   curl http://localhost:5000/api/auth/create-admin
   ```

2. **Database bağlantısını kontrol edin:**
   - `BeautySalonDB_Dev.db` dosyası var mı?
   - Dosya izinleri doğru mu?

3. **Log'ları kontrol edin:**
   - Backend console'da hata mesajları var mı?
   - Frontend browser console'da hata var mı?

### Şifre Sıfırlama Çalışmıyor

1. **Admin yetkilerinizi kontrol edin**
2. **Kullanıcı aktif mi kontrol edin**
3. **API endpoint'lerinin çalıştığını kontrol edin**

## Üretim Ortamı

### Environment Variables

```bash
# appsettings.Production.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=BeautySalonDB.db"
  },
  "Jwt": {
    "Key": "your-super-secret-key-here",
    "Issuer": "BeautySalonAPI",
    "Audience": "BeautySalonClient"
  }
}
```

### Database Migration

```bash
cd BeautySalonAPI
dotnet ef database update
```

### İlk Admin Oluşturma (Üretim)

```bash
# Üretim sunucusunda
curl -X POST https://your-domain.com/api/auth/create-admin
```

## Destek

Sorun yaşarsanız:
1. Backend log'larını kontrol edin
2. Database dosyasının varlığını kontrol edin
3. API endpoint'lerinin çalıştığını test edin
4. Browser console'da JavaScript hatalarını kontrol edin
