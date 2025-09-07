using Microsoft.AspNetCore.Mvc;

namespace BeautySalonAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { 
            message = "API çalışıyor!", 
            timestamp = DateTime.Now,
            environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
        });
    }
    
    [HttpGet("cors")]
    public IActionResult TestCors()
    {
        return Ok(new { 
            message = "CORS test başarılı!", 
            origin = Request.Headers["Origin"].ToString(),
            timestamp = DateTime.Now
        });
    }
}
