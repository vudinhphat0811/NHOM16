using System.ComponentModel.DataAnnotations;

namespace WebNhaHangAPI.Models
{
    public class DanhMuc
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string TenDanhMuc { get; set; } 

        public ICollection<MonAn> MonAns { get; set; } = new List<MonAn>();
    }
}