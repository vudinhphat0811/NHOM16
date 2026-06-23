using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace WebNhaHangAPI.Models // Hoặc WebNhaHangAPI.DTOs nếu bạn để ở thư mục DTOs
{
    // 1. DTO cho cấp quyền tài khoản
    public class RequestGanQuyen
    {
        [Required]
        public string Email { get; set; } = string.Empty;
        [Required]
        public string TenQuyen { get; set; } = string.Empty;
    }

    // 2. DTO cho Danh mục món ăn
    public class RequestDanhMuc
    {
        [Required]
        public string TenDanhMuc { get; set; } = string.Empty;
    }

    // 3. DTO cho Món ăn (Hỗ trợ upload File ảnh qua Form)
    public class RequestMonAnForm
    {
        [Required]
        public string TenMonAn { get; set; } = string.Empty;
        [Required]
        public double GiaBan { get; set; }
        [Required]
        public int DanhMucId { get; set; }
        public IFormFile? HinhAnhFile { get; set; } // Nhận file từ client truyền lên
    }

    // 4. DTO cho Khu vực
    public class RequestKhuVuc
    {
        [Required]
        public string TenKhuVuc { get; set; } = string.Empty;
    }

    // 5. DTO cho Bàn ăn
    public class RequestBanAn
    {
        [Required]
        public string TenBan { get; set; } = string.Empty;
        public int SoChoNgoi { get; set; } = 4;
        public string TrangThai { get; set; } = "Trống";
        [Required]
        public int KhuVucId { get; set; }
        public int ViTriX { get; set; } = 20;
        public int ViTriY { get; set; } = 40;
        public bool IsChinhThuc { get; set; } = false;
    }

    // 6. DTO cập nhật nhanh tọa độ khi Admin kéo thả bàn ăn
    public class RequestUpdateCoordinates
    {
        [Required]
        public int ViTriX { get; set; }
        [Required]
        public int ViTriY { get; set; }
        [Required]
        public bool IsChinhThuc { get; set; }
    }
}