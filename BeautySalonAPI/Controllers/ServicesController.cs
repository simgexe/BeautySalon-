using BeautySalonAPI.Data;
using BeautySalonAPI.Entities;
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

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var services = await _context.Services
                .Include(s => s.Category)
                .ToListAsync();
            return Ok(services);
        }

        [HttpPost]
        public async Task<IActionResult> Add(Service service)
        {
            _context.Services.Add(service);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll), new { id = service.ServiceId }, service);
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Service updatedService)
        {
            var service = await _context.Services.FindAsync(id);
            if (service == null) return NotFound();

            service.ServiceName = updatedService.ServiceName;
            service.Price = updatedService.Price;
            service.CategoryId = updatedService.CategoryId;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var service = await _context.Services.FindAsync(id);
            if (service == null) return NotFound();

            _context.Services.Remove(service);
            await _context.SaveChangesAsync();
            return NoContent();
        }

    }
}
