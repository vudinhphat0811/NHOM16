using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema; 
namespace WebNhaHangAPI.Models
{
    
    [Table("danhsachmonan")]
    public class MonAn
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string TenMon { get; set; } = string.Empty;

        public decimal Gia { get; set; }

        public string? MoTa { get; set; }

        public string? HinhAnh { get; set; }

        public int DanhMucId { get; set; }

        // Nếu bạn có thiết lập mối quan hệ khóa ngoại với bảng DanhMuc
        [System.Text.Json.Serialization.JsonIgnore]
        public DanhMuc? DanhMuc { get; set; }
    }
}