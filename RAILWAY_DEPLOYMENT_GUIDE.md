# 🚀 Railway Deployment Rehberi

## 📋 Ön Gereksinimler

1. **Railway hesabı** oluşturun: [railway.app](https://railway.app)
2. **PostgreSQL veritabanı** (Railway PostgreSQL addon)
3. **GitHub repository** bağlantısı

## 🔧 Railway'de Proje Kurulumu

### 1. Yeni Proje Oluşturma
```bash
# Railway CLI ile
railway login
railway init
railway up
```

### 2. PostgreSQL Veritabanı Ekleme
- Railway Dashboard'da "New" → "Database" → "PostgreSQL" seçin
- Veritabanı otomatik olarak oluşturulacak

### 3. Environment Variables Ayarlama

Railway Dashboard'da **Variables** sekmesinde şu değişkenleri ekleyin:

#### Database Variables (PostgreSQL addon'dan otomatik gelir):
```
DATABASE_HOST=xxx.railway.app
DATABASE_NAME=railway
DATABASE_USER=postgres
DATABASE_PASSWORD=xxx
DATABASE_PORT=5432
```

#### JWT Variables:
```
JWT_SECRET_KEY=your-super-secret-jwt-key-here-min-32-chars
JWT_ISSUER=BeautySalonAPI
JWT_AUDIENCE=BeautySalonUsers
```

#### ASP.NET Core Variables:
```
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:$PORT
```

## 🏗️ Build Süreci

Railway otomatik olarak şu adımları takip edecek:

1. **Node.js kurulumu** (frontend için)
2. **Frontend build** (`npm run build`)
3. **Frontend dosyalarını API'ye kopyalama**
4. **.NET restore ve build**
5. **Uygulamayı başlatma**

## 🌐 Uygulama Erişimi

Deployment tamamlandıktan sonra:

1. **Railway Dashboard**'da projenizi açın
2. **Deployments** sekmesinde son deployment'ı kontrol edin
3. **Settings** → **Domains**'den URL'inizi alın
4. URL'ye giderek uygulamanızı test edin

## 🔍 Sorun Giderme

### Yaygın Hatalar:

#### 1. **Database Connection Error**
```
Solution: PostgreSQL addon'un doğru bağlandığından emin olun
```

#### 2. **Build Failed - Frontend**
```
Solution: Node.js version'ını kontrol edin (20.x önerilir)
```

#### 3. **CORS Error**
```
Solution: Program.cs'te CORS ayarları güncellendi
```

#### 4. **Static Files Not Found**
```
Solution: wwwroot klasöründe frontend build dosyaları olduğundan emin olun
```

## 📊 Monitoring

- **Health Check**: `/health` endpoint'i
- **Logs**: Railway Dashboard → Deployments → Logs
- **Metrics**: Railway Dashboard → Metrics

## 🔄 Güncelleme Süreci

1. **GitHub'a push** yapın
2. **Railway otomatik deploy** edecek
3. **Build logs**'u takip edin
4. **Health check** ile test edin

## 💡 İpuçları

1. **İlk deployment** 5-10 dakika sürebilir
2. **Database migration**'lar otomatik çalışır
3. **Environment variables** değişiklikleri restart gerektirir
4. **Custom domain** ekleyebilirsiniz

## 🆘 Destek

Sorun yaşarsanız:
1. Railway Dashboard → Logs'u kontrol edin
2. Build sürecindeki hataları inceleyin
3. Environment variables'ları doğrulayın
4. Database connection'ı test edin
