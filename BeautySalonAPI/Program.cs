using Microsoft.EntityFrameworkCore;
using BeautySalonAPI.Data;
using System.Text.Json.Serialization;
using System.Text.Json;
using System.Diagnostics;
using Microsoft.Data.SqlClient;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000") 
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Services
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

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

// Development middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    
    // Development modunda tarayıcıyı otomatik aç
    Task.Run(async () =>
    {
        await Task.Delay(2000); 
        
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
        // İlk backup'ı 5 dakika sonra al (1 dakika yerine)
        await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await BackupDatabase();
                
                // 7 günde bir yedek al (24 saat yerine)
                await Task.Delay(TimeSpan.FromDays(7), stoppingToken);
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

            var backupFileName = $"BeautySalon_Backup_{DateTime.Now:yyyyMMdd_HHmmss}.bak";
            var backupFilePath = Path.Combine(_backupPath, backupFileName);

            // SQL Server backup komutu çalıştır
            var connectionBuilder = new SqlConnectionStringBuilder(connectionString);
            var databaseName = connectionBuilder.InitialCatalog;
            var serverName = connectionBuilder.DataSource;

            var backupCommand = $"BACKUP DATABASE [{databaseName}] TO DISK = '{backupFilePath}'";
            
            using (var connection = new SqlConnection(connectionString))
            {
                connection.Open();
                using (var command = new SqlCommand(backupCommand, connection))
                {
                    command.ExecuteNonQuery();
                }
            }
            
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
            var builder = new SqlConnectionStringBuilder(connectionString);
            
            var dataSource = builder.DataSource;
            var database = builder.InitialCatalog;
            
            // SQL Server için database adını döndür
            return $"{dataSource}\\{database}";
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
            var cutoffDate = DateTime.Now.AddDays(-30); // 30 günden eski olanları sil
            var backupFiles = Directory.GetFiles(_backupPath, "BeautySalon_Backup_*.bak");
            
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