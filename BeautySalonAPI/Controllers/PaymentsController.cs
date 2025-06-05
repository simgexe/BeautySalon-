using BeautySalonAPI.Data;
using BeautySalonAPI.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PaymentsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var payments = await _context.Payments
                .Include(p => p.Customer)
                .Include(p => p.Appointment)
                .ToListAsync();

            return Ok(payments);
        }

        [HttpPost]
        public async Task<IActionResult> Add(Payment payment)
        {
            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll), new { id = payment.PaymentId }, payment);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Payment updatedPayment)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null) return NotFound();

            payment.CustomerId = updatedPayment.CustomerId;
            payment.AppointmentId = updatedPayment.AppointmentId;
            payment.AmountPaid = updatedPayment.AmountPaid;
            payment.PaymentDate = updatedPayment.PaymentDate;
            payment.PaymentMethod = updatedPayment.PaymentMethod;
            payment.Status = updatedPayment.Status;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null) return NotFound();

            _context.Payments.Remove(payment);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
