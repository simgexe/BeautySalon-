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
System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
/*TRACE*/ Console.WriteLine("[BOOT] encodings + npgsql switches set");

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

try
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(connectionString,
            x => x.EnableRetryOnFailure(5, TimeSpan.FromSeconds(5), null)));
    /*TRACE*/ Console.WriteLine("[BOOT] DbContext configured");
// ---- Deep diagnostics for TypeLoad/Assembly load ----
try
{
    AppDomain.CurrentDomain.FirstChanceException += (_, e) =>
    {
        var t = e.Exception?.GetType();
        if (t != null && t.FullName == "System.TypeLoadException")
        {
            try
            {
                var typeNameProp = t.GetProperty("TypeName");
                var typeName = typeNameProp?.GetValue(e.Exception) as string;
                Console.Error.WriteLine("[TYPELOAD] TypeName=" + (typeName ?? "<null>"));
            }
            catch {}
        }
    };
}
catch {}
try
{
    Console.WriteLine("[RUNTIME] " + System.Runtime.InteropServices.RuntimeInformation.FrameworkDescription);
    Console.WriteLine("[RUNTIME] " + System.Runtime.InteropServices.RuntimeInformation.OSDescription);
    Console.WriteLine("[RUNTIME] TFM: " + (typeof(object).Assembly.GetCustomAttributes(false).Length));
}
catch {}

}
catch (Exception ex)
{
    try { Console.Error.WriteLine("[BOOT][ERR] DbContext reg TYPE: " + (ex?.GetType()?.FullName ?? "null")); } catch {}
    try { Console.Error.WriteLine("[BOOT][ERR] DbContext reg INNER: " + (ex?.InnerException?.GetType()?.FullName ?? "null")); } catch {}
    throw;
}

// JWT
var jwtSecret = builder.Configuration["Jwt:SecretKey"] ?? Environment.GetEnvironmentVariable("Jwt__SecretKey");
if (string.IsNullOrWhiteSpace(jwtSecret))
{
    Console.Error.WriteLine("Configuration Error: JWT secret is missing (Jwt:SecretKey).");
    Environment.ExitCode = 1;
    return;
}

if (Environment.GetEnvironmentVariable("DISABLE_JWT") == "1")
{
    Console.WriteLine("[BOOT] JWT disabled via env");
}
else
{
    try
    {
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
        /*TRACE*/ Console.WriteLine("[BOOT] JWT configured");
    }
    catch (Exception ex)
    {
        try { Console.Error.WriteLine("[BOOT][ERR] JWT reg TYPE: " + (ex?.GetType()?.FullName ?? "null")); } catch {}
        try { Console.Error.WriteLine("[BOOT][ERR] JWT reg INNER: " + (ex?.InnerException?.GetType()?.FullName ?? "null")); } catch {}
        throw;
    }
}

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
WebApplication app;
try
{
    Console.WriteLine("[BOOT] 2.9: about to Build()");
    app = builder.Build();
    Console.WriteLine("[BOOT] 3: After builder.Build()");
}
catch (Exception ex)
{
    try { Console.Error.WriteLine("[BOOT][ERR] BUILD TYPE: " + (ex?.GetType()?.FullName ?? "null")); } catch {}
    try { Console.Error.WriteLine("[BOOT][ERR] BUILD BASE: " + (ex?.GetBaseException()?.GetType()?.FullName ?? "null")); } catch {}
    try { Console.Error.WriteLine("[BOOT][ERR] BUILD INNER: " + (ex?.InnerException?.GetType()?.FullName ?? "null")); } catch {}
    throw;
}
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
