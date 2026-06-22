using System.ComponentModel.DataAnnotations;

namespace WebNhaHangAPI.Models
{
    public class BanAn
    {
        [Key] // Khóa chính tự tăng
        public int Id { get; set; }

        [Required]
        public string TenBan { get; set; } 

        public int SoChoNgoi { get; set; } 

        public string TrangThai { get; set; } = "Trống";
        public int KhuVucId { get; set; } 

        [System.Text.Json.Serialization.JsonIgnore] 
        public KhuVuc? KhuVuc { get; set; }
    }
}