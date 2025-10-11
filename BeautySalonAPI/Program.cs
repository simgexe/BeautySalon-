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

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// PostgreSQL bağlantısı
var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection") ??
    Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("Database connection string is missing (ConnectionStrings:DefaultConnection).");
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString, x => x.EnableRetryOnFailure(5, TimeSpan.FromSeconds(5), null)));

// JWT
var jwtSecret = builder.Configuration["Jwt:SecretKey"] ?? Environment.GetEnvironmentVariable("Jwt__SecretKey");
if (string.IsNullOrWhiteSpace(jwtSecret))
    throw new InvalidOperationException("JWT secret is missing (Jwt:SecretKey).");

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
builder.Services.AddScoped<IAuthService, AuthService>();

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
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
    });
});

var app = builder.Build();

// --- Auto Migrate ---
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

// --- Swagger toggle ---
var enableSwagger =
    app.Environment.IsDevelopment() ||
    Environment.GetEnvironmentVariable("SWAGGER_ENABLED") == "1";

if (enableSwagger)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "BeautySalon API v1");
        // c.RoutePrefix = string.Empty; // kökten açmak istersen
    });
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

// API
app.MapControllers();

// SPA fallback (Production)
if (!app.Environment.IsDevelopment())
{
    app.MapFallbackToFile("index.html");
}

// Railway port
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
app.Urls.Add($"http://0.0.0.0:{port}");

app.Run();
