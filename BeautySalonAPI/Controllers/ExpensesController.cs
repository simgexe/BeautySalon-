using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeautySalonAPI.Data;
using BeautySalonAPI.DTOs.Expense;
using BeautySalonAPI.Entities;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace BeautySalonAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ExpensesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ExpensesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/expenses
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ExpenseResponseDto>>> GetExpenses(
            [FromQuery] string? category = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var query = _context.Expenses
                .Include(e => e.CreatedByUser)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(e => e.Category != null && e.Category.Contains(category));
            }

            if (startDate.HasValue)
            {
                query = query.Where(e => e.ExpenseDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(e => e.ExpenseDate <= endDate.Value);
            }

            // Apply pagination
            var expenses = await query
                .OrderByDescending(e => e.ExpenseDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new ExpenseResponseDto
                {
                    ExpenseId = e.ExpenseId,
                    Description = e.Description,
                    Amount = e.Amount,
                    ExpenseDate = e.ExpenseDate,
                    Category = e.Category,
                    Notes = e.Notes,
                    CreatedAt = e.CreatedAt,
                    UpdatedAt = e.UpdatedAt,
                    CreatedByUserName = e.CreatedByUser != null ? 
                        $"{e.CreatedByUser.FirstName} {e.CreatedByUser.LastName}".Trim() : 
                        (e.CreatedByUser != null ? e.CreatedByUser.Username : "Bilinmeyen")
                })
                .ToListAsync();

            return Ok(expenses);
        }

        // GET: api/expenses/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ExpenseResponseDto>> GetExpense(int id)
        {
            var expense = await _context.Expenses
                .Include(e => e.CreatedByUser)
                .FirstOrDefaultAsync(e => e.ExpenseId == id);

            if (expense == null)
            {
                return NotFound("Gider bulunamadı");
            }

            var expenseDto = new ExpenseResponseDto
            {
                ExpenseId = expense.ExpenseId,
                Description = expense.Description,
                Amount = expense.Amount,
                ExpenseDate = expense.ExpenseDate,
                Category = expense.Category,
                Notes = expense.Notes,
                CreatedAt = expense.CreatedAt,
                UpdatedAt = expense.UpdatedAt,
                CreatedByUserName = expense.CreatedByUser != null ? 
                    $"{expense.CreatedByUser.FirstName} {expense.CreatedByUser.LastName}".Trim() : 
                    expense.CreatedByUser?.Username ?? "Bilinmeyen"
            };

            return Ok(expenseDto);
        }

        // POST: api/expenses (any authorized user; CreatedByUserId optional)
        [HttpPost]
        public async Task<ActionResult<ExpenseResponseDto>> CreateExpense(CreateExpenseDto createExpenseDto)
        {
            // Try to get current user ID from claims (support both NameIdentifier and legacy "UserId")
            int? userId = null;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("UserId");
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var parsed))
            {
                userId = parsed;
            }

            var expense = new Expense
            {
                Description = createExpenseDto.Description,
                Amount = createExpenseDto.Amount,
                ExpenseDate = createExpenseDto.ExpenseDate,
                Category = createExpenseDto.Category,
                Notes = createExpenseDto.Notes,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Expenses.Add(expense);
            await _context.SaveChangesAsync();

            var expenseDto = new ExpenseResponseDto
            {
                ExpenseId = expense.ExpenseId,
                Description = expense.Description,
                Amount = expense.Amount,
                ExpenseDate = expense.ExpenseDate,
                Category = expense.Category,
                Notes = expense.Notes,
                CreatedAt = expense.CreatedAt,
                UpdatedAt = expense.UpdatedAt,
                CreatedByUserName = "Mevcut Kullanıcı"
            };

            return CreatedAtAction(nameof(GetExpense), new { id = expense.ExpenseId }, expenseDto);
        }

        // PUT: api/expenses/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateExpense(int id, UpdateExpenseDto updateExpenseDto)
        {
            var expense = await _context.Expenses.FindAsync(id);
            if (expense == null)
            {
                return NotFound("Gider bulunamadı");
            }

            expense.Description = updateExpenseDto.Description;
            expense.Amount = updateExpenseDto.Amount;
            expense.ExpenseDate = updateExpenseDto.ExpenseDate;
            expense.Category = updateExpenseDto.Category;
            expense.Notes = updateExpenseDto.Notes;
            expense.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ExpenseExists(id))
                {
                    return NotFound("Gider bulunamadı");
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/expenses/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteExpense(int id)
        {
            var expense = await _context.Expenses.FindAsync(id);
            if (expense == null)
            {
                return NotFound("Gider bulunamadı");
            }

            _context.Expenses.Remove(expense);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/expenses/summary
        [HttpGet("summary")]
        public async Task<ActionResult<object>> GetExpenseSummary(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            var query = _context.Expenses.AsQueryable();

            if (startDate.HasValue)
            {
                query = query.Where(e => e.ExpenseDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(e => e.ExpenseDate <= endDate.Value);
            }

            var totalExpenses = await query.SumAsync(e => e.Amount);
            var expenseCount = await query.CountAsync();

            // Category breakdown
            var categoryBreakdown = await query
                .Where(e => e.Category != null)
                .GroupBy(e => e.Category)
                .Select(g => new
                {
                    Category = g.Key,
                    TotalAmount = g.Sum(e => e.Amount),
                    Count = g.Count()
                })
                .OrderByDescending(x => x.TotalAmount)
                .ToListAsync();

            // Monthly breakdown
            var monthlyData = await query
                .GroupBy(e => new { e.ExpenseDate.Year, e.ExpenseDate.Month })
                .Select(g => new
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    TotalAmount = g.Sum(e => e.Amount),
                    Count = g.Count()
                })
                .OrderBy(x => x.Year)
                .ThenBy(x => x.Month)
                .ToListAsync();

            var monthlyBreakdown = monthlyData.Select(x => new
            {
                x.Year,
                x.Month,
                MonthName = x.Month switch
                {
                    1 => "Ocak", 2 => "Şubat", 3 => "Mart", 4 => "Nisan",
                    5 => "Mayıs", 6 => "Haziran", 7 => "Temmuz", 8 => "Ağustos",
                    9 => "Eylül", 10 => "Ekim", 11 => "Kasım", 12 => "Aralık",
                    _ => "Bilinmeyen"
                },
                x.TotalAmount,
                x.Count
            }).ToList();

            return Ok(new
            {
                TotalExpenses = totalExpenses,
                ExpenseCount = expenseCount,
                AverageExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0,
                CategoryBreakdown = categoryBreakdown,
                MonthlyBreakdown = monthlyBreakdown
            });
        }

        private bool ExpenseExists(int id)
        {
            return _context.Expenses.Any(e => e.ExpenseId == id);
        }
    }
}
