using System.ComponentModel.DataAnnotations;

namespace WebNhaHangAPI.Models
{
    public class KhuVuc
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string TenKhuVuc { get; set; } 

        public ICollection<BanAn> BanAns { get; set; } = new List<BanAn>();
    }
}