using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebNhaHangAPI.Models
{
    [Table("chitietgoimonan")]
    public class ChiTietGoiMon
    {
        [Key]
        public int Id { get; set; }

        public int DatBanId { get; set; }

        [System.Text.Json.Serialization.JsonIgnore]
        public DatBan? DatBan { get; set; }

        public int MonAnId { get; set; }

        public MonAn? MonAn { get; set; }

        public int SoLuong { get; set; } = 1;
    }
}