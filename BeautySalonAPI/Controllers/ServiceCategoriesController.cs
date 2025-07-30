using BeautySalonAPI.Data;
using BeautySalonAPI.Entities;
using BeautySalonAPI.DTOs.ServiceCategory;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ServiceCategoriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ServiceCategoriesController(AppDbContext context)
        {
            _context = context;
        }

        // Tüm kategorileri getir
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var categories = await _context.ServiceCategories
                .Include(c => c.Services)
                .ToListAsync();

            var categoryDtos = categories.Select(c => new ServiceCategoryResponseDto
            {
                CategoryId = c.CategoryId,
                CategoryName = c.CategoryName,
                ServiceCount = c.Services.Count
            }).ToList();

            return Ok(categoryDtos);
        }

        // Belirli kategoriyi getir
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var category = await _context.ServiceCategories
                .Include(c => c.Services)
                .FirstOrDefaultAsync(c => c.CategoryId == id);

            if (category == null) return NotFound();

            var categoryDto = new ServiceCategoryResponseDto
            {
                CategoryId = category.CategoryId,
                CategoryName = category.CategoryName,
                ServiceCount = category.Services.Count
            };

            return Ok(categoryDto);
        }

        // Kategori ve servislerini birlikte getir (dropdown için)
        [HttpGet("with-services")]
        public async Task<IActionResult> GetCategoriesWithServices()
        {
            var categories = await _context.ServiceCategories
                .Include(c => c.Services)
                .ToListAsync();

            var categoryDtos = categories.Select(c => new ServiceCategoryWithServicesDto
            {
                CategoryId = c.CategoryId,
                CategoryName = c.CategoryName,
                Services = c.Services.Select(s => new ServiceSummaryDto
                {
                    ServiceId = s.ServiceId,
                    ServiceName = s.ServiceName,
                    Price = s.Price
                }).ToList()
            }).ToList();

            return Ok(categoryDtos);
        }

        // Yeni kategori ekle
        [HttpPost]
        public async Task<IActionResult> Add(CreateServiceCategoryDto createDto)
        {
            // Aynı isimde kategori var mı kontrol et
            var existingCategory = await _context.ServiceCategories
                .FirstOrDefaultAsync(c => c.CategoryName == createDto.CategoryName);

            if (existingCategory != null)
            {
                return BadRequest("A category with this name already exists");
            }

            // Manual mapping: DTO → Entity
            var category = new ServiceCategory
            {
                CategoryName = createDto.CategoryName
            };

            _context.ServiceCategories.Add(category);
            await _context.SaveChangesAsync();

            // Manual mapping: Entity → Response DTO
            var responseDto = new ServiceCategoryResponseDto
            {
                CategoryId = category.CategoryId,
                CategoryName = category.CategoryName,
                ServiceCount = 0
            };

            return CreatedAtAction(nameof(GetById), new { id = category.CategoryId }, responseDto);
        }

        // Kategori güncelle
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateServiceCategoryDto updateDto)
        {
            var category = await _context.ServiceCategories.FindAsync(id);
            if (category == null) return NotFound();

            // Aynı isimde başka kategori var mı kontrol et
            var existingCategory = await _context.ServiceCategories
                .FirstOrDefaultAsync(c => c.CategoryName == updateDto.CategoryName && c.CategoryId != id);

            if (existingCategory != null)
            {
                return BadRequest("A category with this name already exists");
            }

            // Manual mapping: DTO → Entity
            category.CategoryName = updateDto.CategoryName;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Kategori sil
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var category = await _context.ServiceCategories.FindAsync(id);
            if (category == null) return NotFound();

            // Bu kategoriye ait servis var mı kontrol et
            var hasServices = await _context.Services.AnyAsync(s => s.CategoryId == id);

            if (hasServices)
            {
                return BadRequest("Cannot delete category with existing services");
            }

            _context.ServiceCategories.Remove(category);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Kategoriye ait servisleri getir
        [HttpGet("{id}/services")]
        public async Task<IActionResult> GetCategoryServices(int id)
        {
            var categoryExists = await _context.ServiceCategories.AnyAsync(c => c.CategoryId == id);
            if (!categoryExists) return NotFound("Category not found");

            var services = await _context.Services
                .Where(s => s.CategoryId == id)
                .ToListAsync();

            var serviceDtos = services.Select(s => new ServiceSummaryDto
            {
                ServiceId = s.ServiceId,
                ServiceName = s.ServiceName,
                Price = s.Price
            }).ToList();

            return Ok(serviceDtos);
        }
    }
}