using Microsoft.EntityFrameworkCore;
using BeautySalonAPI.Data;
using System.Text.Json.Serialization;
using System.Text.Json;
using System.Diagnostics;
using Microsoft.Data.Sqlite;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.WithOrigins("http://localhost:3000") 
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
        else
        {
            // Production'da kendi domain'imizden gelen isteklere izin ver
            policy.WithOrigins("http://localhost:5000", "https://localhost:5001") 
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
    });
});

// Services
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

// Development modunda backup servisi ekle
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddHostedService<DatabaseBackupService>();
    builder.Services.AddSwaggerGen();
}

var app = builder.Build();

// Database ensure
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    context.Database.EnsureCreated();
}

// CORS middleware'i ekle - UseRouting'den önce
app.UseCors("AllowFrontend");

// Static files serving - Sadece production modunda React build dosyalarını serve et
if (!app.Environment.IsDevelopment())
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

// Development middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    
    Console.WriteLine("Development modu aktif - Swagger UI: http://localhost:5000/swagger");
}
else
{
    // Production modunda da tarayıcıyı otomatik aç
    _ = Task.Run(async () =>
    {
        await Task.Delay(3000); // Production'da biraz daha bekle
        
        try
        {
            var urls = builder.Configuration["urls"] ?? "http://localhost:5000";
            var url = urls.Split(';')[0];
            
            Process.Start(new ProcessStartInfo
            {
                FileName = url,
                UseShellExecute = true
            });
            
            Console.WriteLine($"Tarayıcı açıldı: {url}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Tarayıcı açılamadı: {ex.Message}");
        }
    });
}

app.UseRouting();
app.UseAuthorization();

// API routes
app.MapControllers();

// SPA fallback - Sadece production modunda React Router için
if (!app.Environment.IsDevelopment())
{
    app.MapFallbackToFile("index.html");
}

Console.WriteLine("Uygulama başlatılıyor...");
Console.WriteLine($"Çalışma dizini: {Directory.GetCurrentDirectory()}");
Console.WriteLine($"Port: {builder.Configuration["urls"] ?? "http://localhost:5000"}");
Console.WriteLine($"Environment: {builder.Environment.EnvironmentName}");

Console.CancelKeyPress += (sender, e) => {
    Console.WriteLine("Uygulama kapatılıyor...");
    Environment.Exit(0);
};

app.Run();

// Development modunda sadece debug build'de bekle
#if DEBUG
if (builder.Environment.IsDevelopment())
{
    Console.WriteLine("Program sonlandı. Devam etmek için bir tuşa basın...");
    Console.ReadKey();
}
#endif

// Database Backup Service
public class DatabaseBackupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IConfiguration _configuration;
    private readonly string _backupPath;

    public DatabaseBackupService(IServiceProvider serviceProvider, IConfiguration configuration)
    {
        _serviceProvider = serviceProvider;
        _configuration = configuration;
        
        // OneDrive yolunu bul
        var oneDrivePath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
            "OneDrive"
        );
        
        // Eğer OneDrive yoksa, Documents kullan
        if (!Directory.Exists(oneDrivePath))
        {
            oneDrivePath = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
        }
        
        _backupPath = Path.Combine(oneDrivePath, "BeautySalonBackups");
        Directory.CreateDirectory(_backupPath);
        
        Console.WriteLine($"Backup klasörü: {_backupPath}");
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // İlk backup'ı 2 dakika sonra al
        await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);
        
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await BackupDatabase();
                
                // Her gün yedek al
                await Task.Delay(TimeSpan.FromDays(1), stoppingToken);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Backup hatası: {ex.Message}");
                // Hata durumunda 1 saat bekle
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }
    }

    private async Task BackupDatabase()
    {
        try
        {
            var connectionString = _configuration.GetConnectionString("DefaultConnection");
            
            // SQLite connection string'den dosya yolunu çıkar
            var connectionBuilder = new SqliteConnectionStringBuilder(connectionString);
            var sourceDbPath = connectionBuilder.DataSource;
            
            // Eğer relative path ise, uygulama dizinine göre absolute path yap
            if (!Path.IsPathRooted(sourceDbPath))
            {
                sourceDbPath = Path.Combine(Directory.GetCurrentDirectory(), sourceDbPath);
            }
            
            if (!File.Exists(sourceDbPath))
            {
                Console.WriteLine($"Veritabanı dosyası bulunamadı: {sourceDbPath}");
                return;
            }

            var backupFileName = $"BeautySalon_Backup_{DateTime.Now:yyyyMMdd_HHmmss}.db";
            var backupFilePath = Path.Combine(_backupPath, backupFileName);

            // SQLite dosyasını kopyala
            File.Copy(sourceDbPath, backupFilePath, true);
            
            Console.WriteLine($"Database yedeklendi: {backupFilePath}");
            
            // Eski yedekleri temizle
            CleanOldBackups();
            
            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Backup işlemi başarısız: {ex.Message}");
        }
    }

    private string ExtractDatabasePath(string connectionString)
    {
        try
        {
            var builder = new SqliteConnectionStringBuilder(connectionString);
            return builder.DataSource;
        }
        catch
        {
            return string.Empty;
        }
    }

    private void CleanOldBackups()
    {
        try
        {
            var cutoffDate = DateTime.Now.AddDays(-15); // 15 günden eski olanları sil
            var backupFiles = Directory.GetFiles(_backupPath, "BeautySalon_Backup_*.db");
            
            foreach (var file in backupFiles)
            {
                var fileInfo = new FileInfo(file);
                if (fileInfo.CreationTime < cutoffDate)
                {
                    fileInfo.Delete();
                    Console.WriteLine($"Eski backup silindi: {Path.GetFileName(file)}");
                }
            }
            
            Console.WriteLine($"Toplam {backupFiles.Length} backup dosyası kontrol edildi");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Eski backup temizleme hatası: {ex.Message}");
        }
    }
}