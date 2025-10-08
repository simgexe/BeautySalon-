using System.ComponentModel.DataAnnotations;

namespace BeautySalonAPI.DTOs.Role
{
    public class CreateRoleDto
    {
        [Required(ErrorMessage = "Rol adı gereklidir")]
        [MaxLength(50, ErrorMessage = "Rol adı en fazla 50 karakter olabilir")]
        public string Name { get; set; } = string.Empty;

        [MaxLength(200, ErrorMessage = "Açıklama en fazla 200 karakter olabilir")]
        public string Description { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
    }
}
