using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema; // Bắt buộc phải có dòng này để dùng thuộc tính [Table]

namespace WebNhaHangAPI.Models
{
    [Table("danhsachbanan")] // ĐẢM BẢO CHÍNH XÁC DÒNG NÀY ĐỂ EF KHÔNG TỰ TÌM BẢNG "banans"
    public class BanAn
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string TenBan { get; set; } = string.Empty;

        public int SoChoNgoi { get; set; } = 4;

        public string TrangThai { get; set; } = "Trống";

        public int KhuVucId { get; set; }

        public int ViTriX { get; set; } = 20;

        public int ViTriY { get; set; } = 40;

        public bool IsChinhThuc { get; set; } = false;

        [System.Text.Json.Serialization.JsonIgnore]
        public KhuVuc? KhuVuc { get; set; }
    }
}