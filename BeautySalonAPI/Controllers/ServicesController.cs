using BeautySalonAPI.Data;
using BeautySalonAPI.Entities;
using BeautySalonAPI.DTOs.Service;
using BeautySalonAPI.DTOs.ServiceCategory;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ServicesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ServicesController(AppDbContext context)
        {
            _context = context;
        }

        // Tüm servisleri getir
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var services = await _context.Services
                .Include(s => s.Category)
                .ToListAsync();

            var serviceDtos = services.Select(s => new ServiceResponseDto
            {
                ServiceId = s.ServiceId,
                ServiceName = s.ServiceName,
                Price = s.Price,
                CategoryId = s.CategoryId,
                CategoryName = s.Category.CategoryName
            }).ToList();

            return Ok(serviceDtos);
        }

        // Belirli servisi getir
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var service = await _context.Services
                .Include(s => s.Category)
                .FirstOrDefaultAsync(s => s.ServiceId == id);

            if (service == null) return NotFound();

            var serviceDto = new ServiceResponseDto
            {
                ServiceId = service.ServiceId,
                ServiceName = service.ServiceName,
                Price = service.Price,
                CategoryId = service.CategoryId,
                CategoryName = service.Category.CategoryName
            };

            return Ok(serviceDto);
        }

        // Kategoriye göre servisleri getir
        [HttpGet("by-category/{categoryId}")]
        public async Task<IActionResult> GetByCategory(int categoryId)
        {
            var categoryExists = await _context.ServiceCategories.AnyAsync(c => c.CategoryId == categoryId);
            if (!categoryExists) return NotFound("Category not found");

            var services = await _context.Services
                .Include(s => s.Category)
                .Where(s => s.CategoryId == categoryId)
                .ToListAsync();

            var serviceDtos = services.Select(s => new ServiceResponseDto
            {
                ServiceId = s.ServiceId,
                ServiceName = s.ServiceName,
                Price = s.Price,
                CategoryId = s.CategoryId,
                CategoryName = s.Category.CategoryName
            }).ToList();

            return Ok(serviceDtos);
        }

        // Servis arama (isim ile)
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
                return BadRequest("Search query cannot be empty");

            var services = await _context.Services
                .Include(s => s.Category)
                .Where(s => s.ServiceName.Contains(query))
                .ToListAsync();

            var serviceDtos = services.Select(s => new ServiceResponseDto
            {
                ServiceId = s.ServiceId,
                ServiceName = s.ServiceName,
                Price = s.Price,
                CategoryId = s.CategoryId,
                CategoryName = s.Category.CategoryName
            }).ToList();

            return Ok(serviceDtos);
        }

        // Fiyat aralığına göre servisleri getir
        [HttpGet("by-price-range")]
        public async Task<IActionResult> GetByPriceRange([FromQuery] decimal minPrice = 0, [FromQuery] decimal maxPrice = decimal.MaxValue)
        {
            var services = await _context.Services
                .Include(s => s.Category)
                .Where(s => s.Price >= minPrice && s.Price <= maxPrice)
                .OrderBy(s => s.Price)
                .ToListAsync();

            var serviceDtos = services.Select(s => new ServiceResponseDto
            {
                ServiceId = s.ServiceId,
                ServiceName = s.ServiceName,
                Price = s.Price,
                CategoryId = s.CategoryId,
                CategoryName = s.Category.CategoryName
            }).ToList();

            return Ok(serviceDtos);
        }

        // Yeni servis ekle
        [HttpPost]
        public async Task<IActionResult> Add(CreateServiceDto createDto)
        {
            // Kategori var mı kontrol et
            var categoryExists = await _context.ServiceCategories.AnyAsync(c => c.CategoryId == createDto.CategoryId);
            if (!categoryExists)
            {
                return BadRequest("Category not found");
            }

            // Aynı isimde servis var mı kontrol et
            var existingService = await _context.Services
                .FirstOrDefaultAsync(s => s.ServiceName == createDto.ServiceName);

            if (existingService != null)
            {
                return BadRequest("A service with this name already exists");
            }

            // Manual mapping: DTO → Entity
            var service = new Service
            {
                ServiceName = createDto.ServiceName,
                Price = createDto.Price,
                CategoryId = createDto.CategoryId
            };

            _context.Services.Add(service);
            await _context.SaveChangesAsync();

            // Category bilgisini al response için
            var category = await _context.ServiceCategories.FindAsync(createDto.CategoryId);

            // Manual mapping: Entity → Response DTO
            var responseDto = new ServiceResponseDto
            {
                ServiceId = service.ServiceId,
                ServiceName = service.ServiceName,
                Price = service.Price,
                CategoryId = service.CategoryId,
                CategoryName = category.CategoryName
            };

            return CreatedAtAction(nameof(GetById), new { id = service.ServiceId }, responseDto);
        }

        // Servis güncelle
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateServiceDto updateDto)
        {
            var service = await _context.Services.FindAsync(id);
            if (service == null) return NotFound();

            // Kategori var mı kontrol et
            var categoryExists = await _context.ServiceCategories.AnyAsync(c => c.CategoryId == updateDto.CategoryId);
            if (!categoryExists)
            {
                return BadRequest("Category not found");
            }

            // Aynı isimde başka servis var mı kontrol et
            var existingService = await _context.Services
                .FirstOrDefaultAsync(s => s.ServiceName == updateDto.ServiceName && s.ServiceId != id);

            if (existingService != null)
            {
                return BadRequest("A service with this name already exists");
            }

            // Manual mapping: DTO → Entity
            service.ServiceName = updateDto.ServiceName;
            service.Price = updateDto.Price;
            service.CategoryId = updateDto.CategoryId;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Servis sil
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var service = await _context.Services.FindAsync(id);
            if (service == null) return NotFound();

            // Bu servisle ilgili randevu var mı kontrol et
            var hasAppointments = await _context.Appointments.AnyAsync(a => a.ServiceId == id);

            if (hasAppointments)
            {
                return BadRequest("Cannot delete service with existing appointments");
            }

            _context.Services.Remove(service);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}