using BeautySalonAPI.Data;
using BeautySalonAPI.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AppointmentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AppointmentsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var appointments = await _context.Appointments
                .Include(a => a.Customer)
                .Include(a => a.Service)
                .ToListAsync();

            return Ok(appointments);
        }

        [HttpPost]
        public async Task<IActionResult> Add(Appointment appointment)
        {
            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll), new { id = appointment.AppointmentId }, appointment);
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Appointment updatedAppointment)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();

            appointment.ServiceId = updatedAppointment.ServiceId;
            appointment.CustomerId = updatedAppointment.CustomerId;
            appointment.AgreedPrice = updatedAppointment.AgreedPrice;
            appointment.PaidAmount = updatedAppointment.PaidAmount;
            appointment.TotalSessions = updatedAppointment.TotalSessions;
            appointment.RemainingSessions = updatedAppointment.RemainingSessions;
            appointment.PaymentMethod = updatedAppointment.PaymentMethod;
            appointment.InstallmentCount = updatedAppointment.InstallmentCount;
            appointment.AppointmentDate = updatedAppointment.AppointmentDate;
            appointment.NextAppointmentDate = updatedAppointment.NextAppointmentDate;
            appointment.Status = updatedAppointment.Status;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();

            _context.Appointments.Remove(appointment);
            await _context.SaveChangesAsync();
            return NoContent();
        }

    }
}
