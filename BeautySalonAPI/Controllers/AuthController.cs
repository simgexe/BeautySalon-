using BeautySalonAPI.DTOs.Auth;
using BeautySalonAPI.Services;
using Microsoft.AspNetCore.Mvc;
using BeautySalonAPI.Data;
using BeautySalonAPI.Entities;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;
        private readonly AppDbContext _context;

        public AuthController(IAuthService authService, ILogger<AuthController> logger, AppDbContext context)
        {
            _authService = authService;
            _logger = logger;
            _context = context;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            try
            {
                var result = await _authService.LoginAsync(loginDto);
                _logger.LogInformation($"User {loginDto.Username} logged in successfully");
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning($"Login failed for user {loginDto.Username}: {ex.Message}");
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error during login for user {loginDto.Username}");
                return StatusCode(500, new { message = "Giriş sırasında bir hata oluştu" });
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            try
            {
                var result = await _authService.RegisterAsync(registerDto);
                _logger.LogInformation($"User {registerDto.Username} registered successfully");
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning($"Registration failed for user {registerDto.Username}: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error during registration for user {registerDto.Username}");
                return StatusCode(500, new { message = "Kayıt sırasında bir hata oluştu" });
            }
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            try
            {
                var token = Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
                if (!string.IsNullOrEmpty(token))
                {
                    await _authService.LogoutAsync(token);
                }
                return Ok(new { message = "Başarıyla çıkış yapıldı" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during logout");
                return StatusCode(500, new { message = "Çıkış sırasında bir hata oluştu" });
            }
        }

        [HttpPost("validate")]
        public async Task<IActionResult> ValidateToken()
        {
            try
            {
                var token = Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
                if (string.IsNullOrEmpty(token))
                {
                    return Unauthorized(new { message = "Token bulunamadı" });
                }

                var isValid = await _authService.ValidateTokenAsync(token);
                return Ok(new { isValid });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during token validation");
                return StatusCode(500, new { message = "Token doğrulama sırasında bir hata oluştu" });
            }
        }

        [HttpPost("create-admin")]
        public async Task<IActionResult> CreateAdmin()
        {
            try
            {
                // Admin rolü var mı kontrol et
                var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Admin");
                if (adminRole == null)
                {
                    adminRole = new Role
                    {
                        Name = "Admin",
                        Description = "Sistem yöneticisi",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Roles.Add(adminRole);
                    await _context.SaveChangesAsync();
                }

                // Staff rolü var mı kontrol et
                var staffRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Staff");
                if (staffRole == null)
                {
                    staffRole = new Role
                    {
                        Name = "Staff",
                        Description = "Personel",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Roles.Add(staffRole);
                    await _context.SaveChangesAsync();
                }

                // Mevcut admin kullanıcısını sil
                var existingAdmin = await _context.Users.FirstOrDefaultAsync(u => u.Username == "admin");
                if (existingAdmin != null)
                {
                    _context.Users.Remove(existingAdmin);
                    await _context.SaveChangesAsync();
                }

                // Yeni admin kullanıcısı oluştur
                var adminUser = new User
                {
                    Username = "admin",
                    PasswordHash = "admin123", // GEÇİCİ: Düz metin
                    FirstName = "Admin",
                    LastName = "User",
                    PhoneNumber = "555-0001",
                    RoleId = adminRole.RoleId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Users.Add(adminUser);
                await _context.SaveChangesAsync();

                // UserRole ataması ekle (many-to-many ilişki)
                _context.UserRoles.Add(new UserRole
                {
                    UserId = adminUser.UserId,
                    RoleId = adminRole.RoleId,
                    AssignedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();

                return Ok(new { 
                    message = "Admin kullanıcısı oluşturuldu", 
                    username = "admin", 
                    password = "admin123",
                    role = "Admin"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating admin user");
                return StatusCode(500, new { message = "Admin kullanıcısı oluşturulurken hata oluştu: " + ex.Message });
            }
        }
    }
}
