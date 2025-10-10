using BeautySalonAPI.Data;
using BeautySalonAPI.DTOs.Auth;
using BeautySalonAPI.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;

namespace BeautySalonAPI.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthService> _logger;

        public AuthService(AppDbContext context, IConfiguration configuration, ILogger<AuthService> logger)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
        {
            _logger.LogInformation($"Login attempt for user: {loginDto.Username}");
            
            // Önce kullanıcıyı Role olmadan bul
            var userWithoutRole = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == loginDto.Username);
            
            _logger.LogInformation($"User without role found: {userWithoutRole != null}");
            if (userWithoutRole != null)
            {
                _logger.LogInformation($"User IsActive: {userWithoutRole.IsActive}");
                _logger.LogInformation($"User RoleId: {userWithoutRole.RoleId}");
            }

            // Sonra Role ve UserRoles ile birlikte bul
            var user = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .Include(u => u.UserServiceCategories)
                    .ThenInclude(usc => usc.ServiceCategory)
                .FirstOrDefaultAsync(u => u.Username == loginDto.Username && u.IsActive);

            _logger.LogInformation($"User with role found: {user != null}");
            if (user != null)
            {
                _logger.LogInformation($"User IsActive: {user.IsActive}");
                _logger.LogInformation($"User Role: {user.Role?.Name}");
                _logger.LogInformation($"Password hash: {user.PasswordHash}");
            }

            if (user == null)
            {
                _logger.LogWarning($"User not found or inactive: {loginDto.Username}");
                throw new UnauthorizedAccessException("Kullanıcı adı veya şifre hatalı");
            }

            // BCrypt ile şifre doğrulama
            bool passwordValid = BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash);

            _logger.LogInformation($"Password verification (hash/plain): {passwordValid}");

            if (!passwordValid)
            {
                _logger.LogWarning($"Password verification failed for user: {loginDto.Username}");
                throw new UnauthorizedAccessException("Kullanıcı adı veya şifre hatalı");
            }

            // Son giriş tarihini güncelle
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();

            return new AuthResponseDto
            {
                Token = token,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                User = new UserInfoDto
                {
                    UserId = user.UserId,
                    Username = user.Username,
                    PhoneNumber = user.PhoneNumber,
                    FirstName = user.FirstName ?? string.Empty,
                    LastName = user.LastName ?? string.Empty,
                    RoleName = user.Role?.Name ?? string.Empty,
                    IsActive = user.IsActive,
                    ServiceCategories = user.UserServiceCategories?.Select(usc => new ServiceCategoryInfoDto
                    {
                        CategoryId = usc.ServiceCategory.CategoryId,
                        CategoryName = usc.ServiceCategory.CategoryName
                    }).ToList() ?? new List<ServiceCategoryInfoDto>()
                }
            };
        }

        public async Task<bool> ResetPasswordAsync(string username, string newPassword)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == username && u.IsActive);

            if (user == null)
            {
                return false;
            }

            // Yeni şifreyi hash'le ve kaydet
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
        {
            // Kullanıcı adı ve e-posta kontrolü
            if (await _context.Users.AnyAsync(u => u.Username == registerDto.Username))
            {
                throw new InvalidOperationException("Bu kullanıcı adı zaten kullanılıyor");
            }

            if (await _context.Users.AnyAsync(u => u.PhoneNumber == registerDto.PhoneNumber))
            {
                throw new InvalidOperationException("Bu telefon numarası zaten kullanılıyor");
            }

            // Rol kontrolü
            var role = await _context.Roles.FindAsync(registerDto.RoleId);
            if (role == null)
            {
                throw new InvalidOperationException("Geçersiz rol");
            }

            var user = new User
            {
                Username = registerDto.Username,
                PhoneNumber = registerDto.PhoneNumber,
                // Şifreyi BCrypt ile hash'le
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                RoleId = registerDto.RoleId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // UserRoles tablosuna rol ata
            _context.UserRoles.Add(new UserRole
            {
                UserId = user.UserId,
                RoleId = registerDto.RoleId,
                AssignedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            // Kullanıcıyı tekrar yükle (Role ile birlikte)
            user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == user.UserId);
            if (user == null)
            {
                throw new InvalidOperationException("Kullanıcı oluşturuldu fakat tekrar yüklenemedi");
            }

            var token = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();

            return new AuthResponseDto
            {
                Token = token,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                User = new UserInfoDto
                {
                    UserId = user.UserId,
                    Username = user.Username,
                    PhoneNumber = user.PhoneNumber,
                    FirstName = user.FirstName ?? string.Empty,
                    LastName = user.LastName ?? string.Empty,
                    RoleName = user.Role?.Name ?? string.Empty,
                    IsActive = user.IsActive,
                    ServiceCategories = user.UserServiceCategories?.Select(usc => new ServiceCategoryInfoDto
                    {
                        CategoryId = usc.ServiceCategory.CategoryId,
                        CategoryName = usc.ServiceCategory.CategoryName
                    }).ToList() ?? new List<ServiceCategoryInfoDto>()
                }
            };
        }

        public async Task<bool> ValidateTokenAsync(string token)
        {
            try
            {
            var tokenHandler = new JwtSecurityTokenHandler();
            var secret = _configuration["Jwt:SecretKey"] ?? string.Empty;
            var key = Encoding.ASCII.GetBytes(secret);

                tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _configuration["Jwt:Issuer"],
                    ValidateAudience = true,
                    ValidAudience = _configuration["Jwt:Audience"],
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                await Task.CompletedTask; // Async method için await ekle
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken)
        {
            // Refresh token implementasyonu (şimdilik basit)
            await Task.CompletedTask; // Async method için await ekle
            throw new NotImplementedException("Refresh token henüz implement edilmedi");
        }

        public async Task LogoutAsync(string token)
        {
            // Token'ı blacklist'e ekleme (şimdilik basit)
            _logger.LogInformation($"User logged out: {token}");
            await Task.CompletedTask; // Async method için await ekle
        }

        private string GenerateJwtToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var secret = _configuration["Jwt:SecretKey"] ?? string.Empty;
            var key = Encoding.ASCII.GetBytes(secret);
            
            // Tüm rolleri al (UserRoles tablosundan)
            var roles = user.UserRoles?.Select(ur => ur.Role?.Name).Where(name => !string.IsNullOrEmpty(name)).ToList() ?? new List<string?>();
            
            // Eski Role tablosundan da rol ekle (geriye uyumluluk için)
            if (user.Role != null && !roles.Contains(user.Role.Name))
            {
                roles.Add(user.Role.Name);
            }
            
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.MobilePhone, user.PhoneNumber),
                new Claim("FirstName", user.FirstName ?? ""),
                new Claim("LastName", user.LastName ?? "")
            };
            
            // Tüm rolleri ekle
            foreach (var role in roles)
            {
                if (!string.IsNullOrEmpty(role))
                {
                    claims.Add(new Claim(ClaimTypes.Role, role));
                }
            }
            
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(24),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        private string GenerateRefreshToken()
        {
            return Guid.NewGuid().ToString();
        }
    }
}
