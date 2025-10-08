using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using BeautySalonAPI.Data;
using BeautySalonAPI.DTOs.Role;
using BeautySalonAPI.Entities;

namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")] // Sadece Admin erişebilir
    public class RolesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<RolesController> _logger;

        public RolesController(AppDbContext context, ILogger<RolesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/roles
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RoleResponseDto>>> GetRoles()
        {
            var roles = await _context.Roles
                .Include(r => r.UserRoles)
                .OrderBy(r => r.Name)
                .ToListAsync();

            var roleDtos = roles.Select(r => new RoleResponseDto
            {
                RoleId = r.RoleId,
                Name = r.Name,
                Description = r.Description,
                IsActive = r.IsActive,
                CreatedAt = r.CreatedAt,
                UserCount = r.UserRoles.Count
            }).ToList();

            return Ok(roleDtos);
        }

        // GET: api/roles/5
        [HttpGet("{id}")]
        public async Task<ActionResult<RoleResponseDto>> GetRole(int id)
        {
            var role = await _context.Roles
                .Include(r => r.UserRoles)
                .FirstOrDefaultAsync(r => r.RoleId == id);

            if (role == null)
            {
                return NotFound(new { message = "Rol bulunamadı" });
            }

            var roleDto = new RoleResponseDto
            {
                RoleId = role.RoleId,
                Name = role.Name,
                Description = role.Description,
                IsActive = role.IsActive,
                CreatedAt = role.CreatedAt,
                UserCount = role.UserRoles.Count
            };

            return Ok(roleDto);
        }

        // POST: api/roles
        [HttpPost]
        public async Task<ActionResult<RoleResponseDto>> CreateRole(CreateRoleDto createRoleDto)
        {
            // Rol adı kontrolü
            if (await _context.Roles.AnyAsync(r => r.Name.ToLower() == createRoleDto.Name.ToLower()))
            {
                return BadRequest(new { message = "Bu rol adı zaten kullanılıyor" });
            }

            var role = new Role
            {
                Name = createRoleDto.Name,
                Description = createRoleDto.Description,
                IsActive = createRoleDto.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _context.Roles.Add(role);
            await _context.SaveChangesAsync();

            var responseDto = new RoleResponseDto
            {
                RoleId = role.RoleId,
                Name = role.Name,
                Description = role.Description,
                IsActive = role.IsActive,
                CreatedAt = role.CreatedAt,
                UserCount = 0
            };

            _logger.LogInformation($"Role created: {role.Name} (ID: {role.RoleId})");
            return CreatedAtAction(nameof(GetRole), new { id = role.RoleId }, responseDto);
        }

        // PUT: api/roles/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRole(int id, UpdateRoleDto updateRoleDto)
        {
            var role = await _context.Roles.FindAsync(id);

            if (role == null)
            {
                return NotFound(new { message = "Rol bulunamadı" });
            }

            // Sistem rollerini koruma (Admin, Staff)
            var systemRoles = new[] { "Admin", "Staff" };
            if (systemRoles.Contains(role.Name) && role.Name != updateRoleDto.Name)
            {
                return BadRequest(new { message = "Sistem rolleri yeniden adlandırılamaz" });
            }

            // Rol adı değiştiyse ve başka biri kullanıyorsa hata ver
            if (role.Name != updateRoleDto.Name && 
                await _context.Roles.AnyAsync(r => r.Name.ToLower() == updateRoleDto.Name.ToLower()))
            {
                return BadRequest(new { message = "Bu rol adı zaten kullanılıyor" });
            }

            role.Name = updateRoleDto.Name;
            role.Description = updateRoleDto.Description;
            role.IsActive = updateRoleDto.IsActive;

            await _context.SaveChangesAsync();

            _logger.LogInformation($"Role updated: {role.Name} (ID: {role.RoleId})");
            return NoContent();
        }

        // DELETE: api/roles/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRole(int id)
        {
            var role = await _context.Roles
                .Include(r => r.UserRoles)
                .FirstOrDefaultAsync(r => r.RoleId == id);

            if (role == null)
            {
                return NotFound(new { message = "Rol bulunamadı" });
            }

            // Sistem rollerini silmeyi engelle (Admin, Staff)
            var systemRoles = new[] { "Admin", "Staff" };
            if (systemRoles.Contains(role.Name))
            {
                return BadRequest(new { message = "Sistem rolleri silinemez" });
            }

            // Kullanıcısı olan rolleri silmeyi engelle
            if (role.UserRoles.Any())
            {
                return BadRequest(new { message = $"Bu rolü kullanan {role.UserRoles.Count} kullanıcı var. Önce kullanıcıları başka role taşıyın." });
            }

            _context.Roles.Remove(role);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Role deleted: {role.Name} (ID: {role.RoleId})");
            return NoContent();
        }
    }
}
