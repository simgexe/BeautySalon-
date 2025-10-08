using BeautySalonAPI.Data;
using BeautySalonAPI.DTOs.Report;
using BeautySalonAPI.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")] // Sadece Admin gelir raporlarını görebilir
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReportsController(AppDbContext context)
        {
            _context = context;
        }

        // Genel gelir raporu - tarih aralığı ile
        [HttpGet("revenue")]
        public async Task<IActionResult> GetRevenueReport(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int? specialistId = null,
            [FromQuery] int? categoryId = null,
            [FromQuery] bool includePending = false)
        {
            // Varsayılan tarih aralığı: Son 30 gün
            var start = startDate ?? DateTime.Now.AddDays(-30);
            var end = endDate ?? DateTime.Now;

            var paymentsQuery = _context.Payments
                .Include(p => p.Customer)
                .Include(p => p.Appointment)
                    .ThenInclude(a => a!.Service)
                        .ThenInclude(s => s.Category)
                .Include(p => p.Appointment)
                    .ThenInclude(a => a!.Specialist)
                .Where(p => p.PaymentDate >= start && p.PaymentDate <= end)
                .AsNoTracking()
                .AsQueryable();

            if (specialistId.HasValue)
            {
                paymentsQuery = paymentsQuery.Where(p => p.Appointment != null && p.Appointment.SpecialistId == specialistId.Value);
            }

            if (categoryId.HasValue)
            {
                paymentsQuery = paymentsQuery.Where(p => p.Appointment != null && p.Appointment.Service != null && p.Appointment.Service.CategoryId == categoryId.Value);
            }

            // Materialize then aggregate on client to avoid SQLite decimal aggregate limitations
            var payments = await paymentsQuery.ToListAsync();

            // Genel istatistikler
            var paidPayments = payments.Where(p => p.Status == PaymentStatus.Paid).ToList();
            var totalRevenue = paidPayments.Sum(p => p.AmountPaid);
            var pendingAmount = payments.Where(p => p.Status == PaymentStatus.Pending).Sum(p => p.AmountPaid);
            var refundedAmount = payments.Where(p => p.Status == PaymentStatus.Refunded).Sum(p => p.AmountPaid);
            var cancelledAmount = payments.Where(p => p.Status == PaymentStatus.Cancelled).Sum(p => p.AmountPaid);

            // Ödeme yöntemi dağılımı
            var paymentMethodDistribution = paidPayments
                .GroupBy(p => p.PaymentMethod)
                .Select(g => new PaymentMethodDistributionDto
                {
                    PaymentMethod = GetPaymentMethodDisplay(g.Key),
                    PaymentMethodValue = (int)g.Key,
                    TotalAmount = g.Sum(p => p.AmountPaid),
                    Count = g.Count(),
                    Percentage = totalRevenue > 0 ? (g.Sum(p => p.AmountPaid) / totalRevenue * 100) : 0
                })
                .OrderByDescending(x => x.TotalAmount)
                .ToList();

            // Kategori bazlı gelirler
            var baseForCategory = includePending ? payments.Where(p => p.Status == PaymentStatus.Paid || p.Status == PaymentStatus.Pending).ToList() : paidPayments;
            var categoryRevenue = baseForCategory
                .Where(p => p.Appointment != null && p.Appointment.Service != null)
                .GroupBy(p => new { 
                    CategoryId = p.Appointment!.Service!.CategoryId, 
                    CategoryName = p.Appointment!.Service!.Category != null ? p.Appointment.Service.Category.CategoryName : "Genel"
                })
                .Select(g => new CategoryRevenueDto
                {
                    CategoryId = g.Key.CategoryId,
                    CategoryName = g.Key.CategoryName,
                    TotalRevenue = g.Sum(p => p.AmountPaid),
                    PaymentCount = g.Count(),
                    Percentage = (totalRevenue > 0 ? (g.Sum(p => p.AmountPaid) / totalRevenue * 100) : 0)
                })
                .OrderByDescending(x => x.TotalRevenue)
                .ToList();

            // Genel ödemeleri de ekle (randevusuz)
            var generalPayments = paidPayments.Where(p => p.Appointment == null).ToList();
            if (generalPayments.Any())
            {
                categoryRevenue.Add(new CategoryRevenueDto
                {
                    CategoryId = null,
                    CategoryName = "Genel Ödemeler",
                    TotalRevenue = generalPayments.Sum(p => p.AmountPaid),
                    PaymentCount = generalPayments.Count,
                    Percentage = totalRevenue > 0 ? (generalPayments.Sum(p => p.AmountPaid) / totalRevenue * 100) : 0
                });
            }

            // Hizmet bazlı gelirler
            var baseForService = includePending ? payments.Where(p => p.Status == PaymentStatus.Paid || p.Status == PaymentStatus.Pending).ToList() : paidPayments;
            var serviceRevenue = baseForService
                .Where(p => p.Appointment != null && p.Appointment.Service != null)
                .GroupBy(p => new {
                    ServiceId = p.Appointment!.Service!.ServiceId,
                    ServiceName = p.Appointment!.Service!.ServiceName,
                    CategoryName = p.Appointment!.Service!.Category != null ? p.Appointment.Service.Category.CategoryName : null
                })
                .Select(g => new ServiceRevenueDto
                {
                    ServiceId = g.Key.ServiceId,
                    ServiceName = g.Key.ServiceName,
                    CategoryName = g.Key.CategoryName,
                    TotalRevenue = g.Sum(p => p.AmountPaid),
                    PaymentCount = g.Count(),
                    Percentage = (totalRevenue > 0 ? (g.Sum(p => p.AmountPaid) / totalRevenue * 100) : 0)
                })
                .OrderByDescending(x => x.TotalRevenue)
                .Take(10) // En çok gelir getiren 10 hizmet
                .ToList();

            // En iyi müşteriler
            var topCustomers = paidPayments
                .GroupBy(p => new { p.CustomerId, p.Customer.FullName })
                .Select(g => new TopCustomerDto
                {
                    CustomerId = g.Key.CustomerId,
                    CustomerName = g.Key.FullName,
                    TotalPaid = g.Sum(p => p.AmountPaid),
                    PaymentCount = g.Count(),
                    LastPaymentDate = g.Max(p => p.PaymentDate)
                })
                .OrderByDescending(x => x.TotalPaid)
                .Take(10) // En çok ödeme yapan 10 müşteri
                .ToList();

            // Uzman bazlı gelirler
            var baseForSpecialist = includePending ? payments.Where(p => p.Status == PaymentStatus.Paid || p.Status == PaymentStatus.Pending).ToList() : paidPayments;
            var specialistRevenue = baseForSpecialist
                .Where(p => p.Appointment != null && p.Appointment.SpecialistId != null)
                .GroupBy(p => new {
                    p.Appointment!.SpecialistId,
                    SpecialistName = p.Appointment!.Specialist != null 
                        ? ($"{p.Appointment.Specialist.FirstName} {p.Appointment.Specialist.LastName}").Trim()
                        : "Bilinmeyen"
                })
                .Select(g => new SpecialistRevenueDto
                {
                    SpecialistId = g.Key.SpecialistId,
                    SpecialistName = g.Key.SpecialistName,
                    TotalRevenue = g.Sum(p => p.AmountPaid),
                    AppointmentCount = g.Count(),
                    AveragePerAppointment = g.Count() > 0 ? g.Sum(p => p.AmountPaid) / g.Count() : 0
                })
                .OrderByDescending(x => x.TotalRevenue)
                .ToList();

            var report = new RevenueReportDto
            {
                TotalRevenue = totalRevenue,
                PendingAmount = pendingAmount,
                RefundedAmount = refundedAmount,
                CancelledAmount = cancelledAmount,
                TotalPaymentsCount = payments.Count,
                PaidPaymentsCount = paidPayments.Count,
                PendingPaymentsCount = payments.Count(p => p.Status == PaymentStatus.Pending),
                AveragePaymentAmount = paidPayments.Any() ? totalRevenue / paidPayments.Count : 0,
                PaymentMethodDistribution = paymentMethodDistribution,
                CategoryRevenue = categoryRevenue,
                ServiceRevenue = serviceRevenue,
                TopCustomers = topCustomers,
                SpecialistRevenue = specialistRevenue
            };

            return Ok(report);
        }

        // Günlük gelir raporu
        [HttpGet("daily")]
        public async Task<IActionResult> GetDailyRevenue([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
        {
            var start = startDate ?? DateTime.Now.AddDays(-30);
            var end = endDate ?? DateTime.Now;

            // SQLite decimal aggregate limitation workaround: materialize then group in-memory
            var items = await _context.Payments
                .Where(p => p.Status == PaymentStatus.Paid && p.PaymentDate >= start && p.PaymentDate <= end)
                .AsNoTracking()
                .ToListAsync();

            var dailyRevenue = items
                .GroupBy(p => p.PaymentDate.Date)
                .Select(g => new DailyRevenueDto
                {
                    Date = g.Key,
                    TotalRevenue = g.Sum(p => p.AmountPaid),
                    PaymentCount = g.Count(),
                    AverageAmount = g.Count() > 0 ? g.Sum(p => p.AmountPaid) / g.Count() : 0
                })
                .OrderBy(x => x.Date)
                .ToList();

            return Ok(dailyRevenue);
        }

        // Aylık gelir raporu
        [HttpGet("monthly")]
        public async Task<IActionResult> GetMonthlyRevenue([FromQuery] int? year = null)
        {
            var targetYear = year ?? DateTime.Now.Year;

            var monthItems = await _context.Payments
                .Where(p => p.Status == PaymentStatus.Paid && p.PaymentDate.Year == targetYear)
                .AsNoTracking()
                .ToListAsync();

            var monthlyRevenue = monthItems
                .GroupBy(p => p.PaymentDate.Month)
                .Select(g => new MonthlyRevenueDto
                {
                    Year = targetYear,
                    Month = g.Key,
                    MonthName = CultureInfo.GetCultureInfo("tr-TR").DateTimeFormat.GetMonthName(g.Key),
                    TotalRevenue = g.Sum(p => p.AmountPaid),
                    PaymentCount = g.Count(),
                    AverageAmount = g.Count() > 0 ? g.Sum(p => p.AmountPaid) / g.Count() : 0
                })
                .OrderBy(x => x.Month)
                .ToList();

            return Ok(monthlyRevenue);
        }

        // Yıllık gelir raporu
        [HttpGet("yearly")]
        public async Task<IActionResult> GetYearlyRevenue()
        {
            var yearItems = await _context.Payments
                .Where(p => p.Status == PaymentStatus.Paid)
                .AsNoTracking()
                .ToListAsync();

            var yearlyRevenue = yearItems
                .GroupBy(p => p.PaymentDate.Year)
                .Select(g => new YearlyRevenueDto
                {
                    Year = g.Key,
                    TotalRevenue = g.Sum(p => p.AmountPaid),
                    PaymentCount = g.Count(),
                    AverageAmount = g.Count() > 0 ? g.Sum(p => p.AmountPaid) / g.Count() : 0
                })
                .OrderByDescending(x => x.Year)
                .ToList();

            return Ok(yearlyRevenue);
        }

        // Bugünün geliri
        [HttpGet("today")]
        public async Task<IActionResult> GetTodayRevenue()
        {
            var today = DateTime.Now.Date;
            var tomorrow = today.AddDays(1);

            var payments = await _context.Payments
                .Where(p => p.Status == PaymentStatus.Paid && p.PaymentDate >= today && p.PaymentDate < tomorrow)
                .ToListAsync();

            var totalRevenue = payments.Sum(p => p.AmountPaid);
            var paymentCount = payments.Count;

            return Ok(new
            {
                Date = today,
                TotalRevenue = totalRevenue,
                PaymentCount = paymentCount,
                AverageAmount = paymentCount > 0 ? totalRevenue / paymentCount : 0
            });
        }

        // Bu ayın geliri
        [HttpGet("this-month")]
        public async Task<IActionResult> GetThisMonthRevenue()
        {
            var now = DateTime.Now;
            var firstDayOfMonth = new DateTime(now.Year, now.Month, 1);
            var firstDayOfNextMonth = firstDayOfMonth.AddMonths(1);

            var payments = await _context.Payments
                .Where(p => p.Status == PaymentStatus.Paid && p.PaymentDate >= firstDayOfMonth && p.PaymentDate < firstDayOfNextMonth)
                .ToListAsync();

            var totalRevenue = payments.Sum(p => p.AmountPaid);
            var paymentCount = payments.Count;

            return Ok(new
            {
                Month = now.Month,
                Year = now.Year,
                MonthName = CultureInfo.GetCultureInfo("tr-TR").DateTimeFormat.GetMonthName(now.Month),
                TotalRevenue = totalRevenue,
                PaymentCount = paymentCount,
                AverageAmount = paymentCount > 0 ? totalRevenue / paymentCount : 0
            });
        }

        // Bu yılın geliri
        [HttpGet("this-year")]
        public async Task<IActionResult> GetThisYearRevenue()
        {
            var year = DateTime.Now.Year;
            var firstDayOfYear = new DateTime(year, 1, 1);
            var firstDayOfNextYear = firstDayOfYear.AddYears(1);

            var payments = await _context.Payments
                .Where(p => p.Status == PaymentStatus.Paid && p.PaymentDate >= firstDayOfYear && p.PaymentDate < firstDayOfNextYear)
                .ToListAsync();

            var totalRevenue = payments.Sum(p => p.AmountPaid);
            var paymentCount = payments.Count;

            return Ok(new
            {
                Year = year,
                TotalRevenue = totalRevenue,
                PaymentCount = paymentCount,
                AverageAmount = paymentCount > 0 ? totalRevenue / paymentCount : 0
            });
        }

        // Helper method
        private string GetPaymentMethodDisplay(PaymentMethodType method)
        {
            return method switch
            {
                PaymentMethodType.Cash => "Nakit",
                PaymentMethodType.CreditCard => "Kredi Kartı",
                PaymentMethodType.DebitCard => "Banka Kartı",
                PaymentMethodType.BankTransfer => "Havale",
                _ => method.ToString()
            };
        }
    }
}


