using Microsoft.EntityFrameworkCore;
using BeautySalonAPI.Data;
using System.Text.Json.Serialization;
using System.Text.Json;
using System.Diagnostics;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using BeautySalonAPI.Services;

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
            // Production'da Railway domain'inden gelen isteklere izin ver
            policy.WithOrigins("*") 
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
    });
});

// Services
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(builder.Configuration["Jwt:SecretKey"] ?? string.Empty)),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// Services
builder.Services.AddScoped<IAuthService, AuthService>();

// Development modunda Swagger ekle
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddSwaggerGen();
}

var app = builder.Build();

        // Global exception handler
        app.UseExceptionHandler("/Error");

        // Detailed logging
        Console.WriteLine("=== APPLICATION STARTING ===");
        Console.WriteLine($"Environment: {app.Environment.EnvironmentName}");
        Console.WriteLine($"Content Root: {app.Environment.ContentRootPath}");
        Console.WriteLine($"Web Root: {app.Environment.WebRootPath}");

        // Database ensure - sadece development'da
        if (app.Environment.IsDevelopment())
        {
            try
            {
                using (var scope = app.Services.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    context.Database.EnsureCreated();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Database ensure failed: {ex.Message}");
            }
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
app.UseAuthentication();
app.UseAuthorization();

// Health check endpoint - removed
// app.MapHealthChecks("/health");

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