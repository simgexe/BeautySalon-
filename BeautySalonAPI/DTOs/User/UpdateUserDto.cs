using System.ComponentModel.DataAnnotations;

namespace BeautySalonAPI.DTOs.User
{
    public class UpdateUserDto
    {
        [Required(ErrorMessage = "Kullanıcı adı gereklidir")]
        [MaxLength(100, ErrorMessage = "Kullanıcı adı en fazla 100 karakter olabilir")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Telefon numarası gereklidir")]
        [Phone(ErrorMessage = "Geçerli bir telefon numarası giriniz")]
        [MaxLength(20, ErrorMessage = "Telefon numarası en fazla 20 karakter olabilir")]
        public string PhoneNumber { get; set; } = string.Empty;

        // Şifre opsiyonel - sadece değiştirilmek istenirse gönderilir
        [MinLength(6, ErrorMessage = "Şifre en az 6 karakter olmalıdır")]
        public string? Password { get; set; }

        [Required(ErrorMessage = "Ad gereklidir")]
        [MaxLength(100, ErrorMessage = "Ad en fazla 100 karakter olabilir")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Soyad gereklidir")]
        [MaxLength(100, ErrorMessage = "Soyad en fazla 100 karakter olabilir")]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "En az bir rol seçilmelidir")]
        [MinLength(1, ErrorMessage = "En az bir rol seçilmelidir")]
        public List<int> RoleIds { get; set; } = new List<int>();

        // Specialist rolündeki kullanıcılar için uzmanlık kategorileri (opsiyonel)
        public List<int>? ServiceCategoryIds { get; set; }

        public bool IsActive { get; set; }
    }
}
