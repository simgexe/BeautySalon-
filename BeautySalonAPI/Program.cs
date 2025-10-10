using Microsoft.EntityFrameworkCore;
using BeautySalonAPI.Data;
using System.Text.Json.Serialization;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using BeautySalonAPI.Services;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// ---------------- CONFIG ----------------
/*DIAG*/ Console.WriteLine("[BOOT] 1: Builder created");

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

builder.Services.AddEndpointsApiExplorer();

// Swagger sadece Development'ta
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddSwaggerGen();
}

// PostgreSQL bağlantısı (ENV veya appsettings)
var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection") ??
    Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    Console.Error.WriteLine("Configuration Error: Database connection string is missing (ConnectionStrings:DefaultConnection).");
    // Startup'ta patlatmak yerine anlamlı bir log verelim:
    // throw yerine çalışmayı durduralım ki Railway loglarında net görünsün
    Environment.ExitCode = 1;
    return;
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString,
        x => x.EnableRetryOnFailure(5, TimeSpan.FromSeconds(5), null)));

// JWT
var jwtSecret = builder.Configuration["Jwt:SecretKey"] ?? Environment.GetEnvironmentVariable("Jwt__SecretKey");
if (string.IsNullOrWhiteSpace(jwtSecret))
{
    Console.Error.WriteLine("Configuration Error: JWT secret is missing (Jwt:SecretKey).");
    Environment.ExitCode = 1;
    return;
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtSecret)),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// DI
builder.Services.AddScoped<IAuthService, AuthService>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.WithOrigins("http://localhost:3000")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
        else
        {
            // Production: wildcard + credentials yasak.
            // Eğer belirli domain(ler)in varsa WithOrigins(...) + AllowCredentials() kullan.
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
            // .AllowCredentials() YOK!
        }
    });
});


/*DIAG*/ Console.WriteLine("[BOOT] 2: Before builder.Build()");
try { var _tmp = builder.Configuration["Jwt:Issuer"]; } catch { /* ignore */ }
/*DIAG*/ Console.WriteLine("[BOOT] 2.1: Config probed");
var app = builder.Build();
/*DIAG*/ Console.WriteLine("[BOOT] 3: After builder.Build()");


// ---------------- GLOBAL ERROR LOGGERS ----------------
AppDomain.CurrentDomain.UnhandledException += (_, e) =>
{
    if (e.ExceptionObject is Exception ex)
    {
        Console.Error.WriteLine("UNHANDLED: " + ex.GetType().FullName);
        Console.Error.WriteLine("MSG: " + ex.Message);
        Console.Error.WriteLine("INNER: " + ex.InnerException?.Message);
        Console.Error.WriteLine(ex.StackTrace);
    }
};

TaskScheduler.UnobservedTaskException += (_, e) =>
{
    Console.Error.WriteLine("UNOBSERVED: " + e.Exception.Message);
    Console.Error.WriteLine(e.Exception.StackTrace);
    e.SetObserved();
};

// ---------------- PIPELINE ----------------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

// Static files (React build -> wwwroot)
var wwwrootPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
if (Directory.Exists(wwwrootPath))
{
    app.UseDefaultFiles();
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(wwwrootPath)
    });
}

// API endpoints

/*DIAG*/ Console.WriteLine("[BOOT] 4: Before MapControllers");
app.MapControllers();
/*DIAG*/ Console.WriteLine("[BOOT] 5: After MapControllers");


// SPA fallback sadece Production'da (React Router için)
if (!app.Environment.IsDevelopment())
{
    app.MapFallbackToFile("index.html");
}

// PORT binding (Railway)
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";

/*DIAG*/ Console.WriteLine("[BOOT] 6: URL bind -> " + port);
app.Urls.Add($"http://0.0.0.0:{port}");


app.Run();
