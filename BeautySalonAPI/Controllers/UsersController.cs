using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using BeautySalonAPI.Data;
using BeautySalonAPI.DTOs.User;
using BeautySalonAPI.Entities;

namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")] // Sadece Admin erişebilir
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<UsersController> _logger;

        public UsersController(AppDbContext context, ILogger<UsersController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetUsers()
        {
            var users = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .Include(u => u.UserServiceCategories)
                    .ThenInclude(usc => usc.ServiceCategory)
                .Where(u => u.IsActive)
                .OrderBy(u => u.Username)
                .ToListAsync();

            var userDtos = users.Select(u => new UserResponseDto
            {
                UserId = u.UserId,
                Username = u.Username,
                PhoneNumber = u.PhoneNumber,
                FirstName = u.FirstName ?? string.Empty,
                LastName = u.LastName ?? string.Empty,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt,
                LastLoginAt = u.LastLoginAt,
                Roles = u.UserRoles.Select(ur => new RoleInfoDto
                {
                    RoleId = ur.Role.RoleId,
                    Name = ur.Role.Name,
                    Description = ur.Role.Description
                }).ToList(),
                ServiceCategories = u.UserServiceCategories.Select(usc => new ServiceCategoryInfoDto
                {
                    CategoryId = usc.ServiceCategory.CategoryId,
                    CategoryName = usc.ServiceCategory.CategoryName
                }).ToList()
            }).ToList();

            return Ok(userDtos);
        }

        // GET: api/users/5
        [HttpGet("{id}")]
        public async Task<ActionResult<UserResponseDto>> GetUser(int id)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .Include(u => u.UserServiceCategories)
                    .ThenInclude(usc => usc.ServiceCategory)
                .FirstOrDefaultAsync(u => u.UserId == id);

            if (user == null)
            {
                return NotFound(new { message = "Kullanıcı bulunamadı" });
            }

            var userDto = new UserResponseDto
            {
                UserId = user.UserId,
                Username = user.Username,
                PhoneNumber = user.PhoneNumber,
                FirstName = user.FirstName ?? string.Empty,
                LastName = user.LastName ?? string.Empty,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                Roles = user.UserRoles.Select(ur => new RoleInfoDto
                {
                    RoleId = ur.Role.RoleId,
                    Name = ur.Role.Name,
                    Description = ur.Role.Description
                }).ToList(),
                ServiceCategories = user.UserServiceCategories.Select(usc => new ServiceCategoryInfoDto
                {
                    CategoryId = usc.ServiceCategory.CategoryId,
                    CategoryName = usc.ServiceCategory.CategoryName
                }).ToList()
            };

            return Ok(userDto);
        }

        // POST: api/users
        [HttpPost]
        public async Task<ActionResult<UserResponseDto>> CreateUser(CreateUserDto createUserDto)
        {
            // Kullanıcı adı kontrolü
            if (await _context.Users.AnyAsync(u => u.Username == createUserDto.Username))
            {
                return BadRequest(new { message = "Bu kullanıcı adı zaten kullanılıyor" });
            }

            // Telefon numarası kontrolü
            if (await _context.Users.AnyAsync(u => u.PhoneNumber == createUserDto.PhoneNumber))
            {
                return BadRequest(new { message = "Bu telefon numarası zaten kullanılıyor" });
            }

            // Rollerin geçerli olup olmadığını kontrol et
            var validRoles = await _context.Roles
                .Where(r => createUserDto.RoleIds.Contains(r.RoleId) && r.IsActive)
                .ToListAsync();

            if (validRoles.Count != createUserDto.RoleIds.Count)
            {
                return BadRequest(new { message = "Geçersiz rol seçimi" });
            }

            var user = new User
            {
                Username = createUserDto.Username,
                PhoneNumber = createUserDto.PhoneNumber,
                PasswordHash = createUserDto.Password, // GEÇİCİ: Düz metin (üretimde hash'le)
                FirstName = createUserDto.FirstName,
                LastName = createUserDto.LastName,
                IsActive = createUserDto.IsActive,
                CreatedAt = DateTime.UtcNow,
                RoleId = createUserDto.RoleIds.First() // Geriye uyumluluk için ilk rolü ana rol yap
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Rolleri ata
            foreach (var roleId in createUserDto.RoleIds)
            {
                _context.UserRoles.Add(new UserRole
                {
                    UserId = user.UserId,
                    RoleId = roleId,
                    AssignedAt = DateTime.UtcNow
                });
            }

            // ServiceCategory atama (eğer varsa)
            if (createUserDto.ServiceCategoryIds != null && createUserDto.ServiceCategoryIds.Any())
            {
                // Kategorilerin geçerli olup olmadığını kontrol et
                var validCategories = await _context.ServiceCategories
                    .Where(sc => createUserDto.ServiceCategoryIds.Contains(sc.CategoryId))
                    .Select(sc => sc.CategoryId)
                    .ToListAsync();

                foreach (var categoryId in validCategories)
                {
                    _context.UserServiceCategories.Add(new UserServiceCategory
                    {
                        UserId = user.UserId,
                        ServiceCategoryId = categoryId,
                        AssignedAt = DateTime.UtcNow
                    });
                }
            }

            await _context.SaveChangesAsync();

            // Kullanıcıyı rollerle ve kategorilerle birlikte tekrar yükle
            var createdUser = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .Include(u => u.UserServiceCategories)
                    .ThenInclude(usc => usc.ServiceCategory)
                .FirstAsync(u => u.UserId == user.UserId);

            var responseDto = new UserResponseDto
            {
                UserId = createdUser.UserId,
                Username = createdUser.Username,
                PhoneNumber = createdUser.PhoneNumber,
                FirstName = createdUser.FirstName ?? string.Empty,
                LastName = createdUser.LastName ?? string.Empty,
                IsActive = createdUser.IsActive,
                CreatedAt = createdUser.CreatedAt,
                LastLoginAt = createdUser.LastLoginAt,
                Roles = createdUser.UserRoles.Select(ur => new RoleInfoDto
                {
                    RoleId = ur.Role.RoleId,
                    Name = ur.Role.Name,
                    Description = ur.Role.Description
                }).ToList(),
                ServiceCategories = createdUser.UserServiceCategories.Select(usc => new ServiceCategoryInfoDto
                {
                    CategoryId = usc.ServiceCategory.CategoryId,
                    CategoryName = usc.ServiceCategory.CategoryName
                }).ToList()
            };

            _logger.LogInformation($"User created: {user.Username} (ID: {user.UserId})");
            return CreatedAtAction(nameof(GetUser), new { id = user.UserId }, responseDto);
        }

        // PUT: api/users/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, UpdateUserDto updateUserDto)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                .Include(u => u.UserServiceCategories)
                .FirstOrDefaultAsync(u => u.UserId == id);

            if (user == null)
            {
                return NotFound(new { message = "Kullanıcı bulunamadı" });
            }

            // Kullanıcı adı değiştiyse ve başka biri kullanıyorsa hata ver
            if (user.Username != updateUserDto.Username && 
                await _context.Users.AnyAsync(u => u.Username == updateUserDto.Username))
            {
                return BadRequest(new { message = "Bu kullanıcı adı zaten kullanılıyor" });
            }

            // Telefon numarası değiştiyse ve başka biri kullanıyorsa hata ver
            if (user.PhoneNumber != updateUserDto.PhoneNumber && 
                await _context.Users.AnyAsync(u => u.PhoneNumber == updateUserDto.PhoneNumber))
            {
                return BadRequest(new { message = "Bu telefon numarası zaten kullanılıyor" });
            }

            // Rollerin geçerli olup olmadığını kontrol et
            var validRoles = await _context.Roles
                .Where(r => updateUserDto.RoleIds.Contains(r.RoleId) && r.IsActive)
                .ToListAsync();

            if (validRoles.Count != updateUserDto.RoleIds.Count)
            {
                return BadRequest(new { message = "Geçersiz rol seçimi" });
            }

            // Kullanıcı bilgilerini güncelle
            user.Username = updateUserDto.Username;
            user.PhoneNumber = updateUserDto.PhoneNumber;
            user.FirstName = updateUserDto.FirstName;
            user.LastName = updateUserDto.LastName;
            user.IsActive = updateUserDto.IsActive;
            user.RoleId = updateUserDto.RoleIds.First(); // Geriye uyumluluk için

            // Şifre değiştirilmişse güncelle
            if (!string.IsNullOrEmpty(updateUserDto.Password))
            {
                user.PasswordHash = updateUserDto.Password; // GEÇİCİ: Düz metin (üretimde hash'le)
            }

            // Mevcut rolleri temizle
            _context.UserRoles.RemoveRange(user.UserRoles);

            // Yeni rolleri ekle
            foreach (var roleId in updateUserDto.RoleIds)
            {
                _context.UserRoles.Add(new UserRole
                {
                    UserId = user.UserId,
                    RoleId = roleId,
                    AssignedAt = DateTime.UtcNow
                });
            }

            // Mevcut ServiceCategory atamalarını temizle
            _context.UserServiceCategories.RemoveRange(user.UserServiceCategories);

            // Yeni ServiceCategory atamaları ekle (eğer varsa)
            if (updateUserDto.ServiceCategoryIds != null && updateUserDto.ServiceCategoryIds.Any())
            {
                var validCategories = await _context.ServiceCategories
                    .Where(sc => updateUserDto.ServiceCategoryIds.Contains(sc.CategoryId))
                    .Select(sc => sc.CategoryId)
                    .ToListAsync();

                foreach (var categoryId in validCategories)
                {
                    _context.UserServiceCategories.Add(new UserServiceCategory
                    {
                        UserId = user.UserId,
                        ServiceCategoryId = categoryId,
                        AssignedAt = DateTime.UtcNow
                    });
                }
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation($"User updated: {user.Username} (ID: {user.UserId})");
            return NoContent();
        }

        // DELETE: api/users/5 (soft delete)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound(new { message = "Kullanıcı bulunamadı" });
            }

            // Admin kullanıcısını silmeyi engelle
            if (user.Username == "admin")
            {
                return BadRequest(new { message = "Admin kullanıcısı silinemez" });
            }

            // Soft delete
            user.IsActive = false;
            await _context.SaveChangesAsync();

            _logger.LogInformation($"User deleted (soft): {user.Username} (ID: {user.UserId})");
            return NoContent();
        }

        // GET: api/users/roles (Tüm rolleri listele)
        [HttpGet("roles")]
        public async Task<ActionResult<IEnumerable<RoleInfoDto>>> GetRoles()
        {
            var roles = await _context.Roles
                .Where(r => r.IsActive)
                .OrderBy(r => r.Name)
                .Select(r => new RoleInfoDto
                {
                    RoleId = r.RoleId,
                    Name = r.Name,
                    Description = r.Description
                })
                .ToListAsync();

            return Ok(roles);
        }

        // GET: api/users/specialists/by-category/{categoryId} (Kategoriye göre uzmanları getir)
        [HttpGet("specialists/by-category/{categoryId}")]
        [AllowAnonymous] // Frontend'den erişim için authentication'ı kaldır
        public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetSpecialistsByCategory(int categoryId)
        {
            // Kategori var mı kontrol et
            var categoryExists = await _context.ServiceCategories.AnyAsync(c => c.CategoryId == categoryId);
            if (!categoryExists)
            {
                return NotFound(new { message = "Kategori bulunamadı" });
            }

            // Bu kategoriye atanmış uzmanları getir
            var specialists = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .Include(u => u.UserServiceCategories)
                    .ThenInclude(usc => usc.ServiceCategory)
                .Where(u => u.IsActive && 
                           u.UserRoles.Any(ur => ur.Role.Name == "Specialist") &&
                           u.UserServiceCategories.Any(usc => usc.ServiceCategoryId == categoryId))
                .OrderBy(u => u.FirstName)
                .ThenBy(u => u.LastName)
                .ToListAsync();

            var specialistDtos = specialists.Select(u => new UserResponseDto
            {
                UserId = u.UserId,
                Username = u.Username,
                PhoneNumber = u.PhoneNumber,
                FirstName = u.FirstName ?? string.Empty,
                LastName = u.LastName ?? string.Empty,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt,
                LastLoginAt = u.LastLoginAt,
                Roles = u.UserRoles.Select(ur => new RoleInfoDto
                {
                    RoleId = ur.Role.RoleId,
                    Name = ur.Role.Name,
                    Description = ur.Role.Description
                }).ToList(),
                ServiceCategories = u.UserServiceCategories.Select(usc => new ServiceCategoryInfoDto
                {
                    CategoryId = usc.ServiceCategory.CategoryId,
                    CategoryName = usc.ServiceCategory.CategoryName
                }).ToList()
            }).ToList();

            return Ok(specialistDtos);
        }

    }
}
