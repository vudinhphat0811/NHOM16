using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebNhaHangAPI.Models
{
    public class MonAn
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string TenMon { get; set; }

        public string MoTa { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Gia { get; set; }

        public string HinhAnh { get; set; }

        public int DanhMucId { get; set; } 

        [System.Text.Json.Serialization.JsonIgnore]
        public DanhMuc? DanhMuc { get; set; } 
    }
}