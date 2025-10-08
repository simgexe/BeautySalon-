using System.ComponentModel.DataAnnotations;

namespace BeautySalonAPI.DTOs.Auth
{
    public class LoginDto
    {
        [Required(ErrorMessage = "Kullanıcı adı gereklidir")]
        [MaxLength(100, ErrorMessage = "Kullanıcı adı en fazla 100 karakter olabilir")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Şifre gereklidir")]
        [MinLength(6, ErrorMessage = "Şifre en az 6 karakter olmalıdır")]
        public string Password { get; set; } = string.Empty;
    }
}
