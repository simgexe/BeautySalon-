using BeautySalonAPI.Data;
using BeautySalonAPI.Entities;
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

        // GET: api/servicecategories
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var categories = await _context.ServiceCategories.ToListAsync();
            return Ok(categories);
        }

        // POST: api/servicecategories
        [HttpPost]
        public async Task<IActionResult> Add(ServiceCategory category)
        {
            _context.ServiceCategories.Add(category);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll), new { id = category.CategoryId }, category);
        }

        // PUT: api/servicecategories/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, ServiceCategory updatedCategory)
        {
            var category = await _context.ServiceCategories.FindAsync(id);
            if (category == null) return NotFound();

            category.CategoryName = updatedCategory.CategoryName;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/servicecategories/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var category = await _context.ServiceCategories.FindAsync(id);
            if (category == null) return NotFound();

            _context.ServiceCategories.Remove(category);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
