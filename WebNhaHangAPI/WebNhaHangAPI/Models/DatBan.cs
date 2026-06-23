using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebNhaHangAPI.Models
{
    [Table("danhsachdatban")]
    public class DatBan
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string TenKhachHang { get; set; } = string.Empty;

        [Required]
        public string SoDienThoai { get; set; } = string.Empty;

        public DateTime NgayDat { get; set; } = DateTime.Now;

        public int SoLuongKhach { get; set; } = 1;

        public string? GhiChu { get; set; }

        // Trạng thái đơn: Chờ xác nhận, Đã xác nhận, Đang ăn, Đã thanh toán, Đã hủy
        public string TrangThai { get; set; } = "Chờ xác nhận";

        public decimal TienCoc { get; set; } = 0;

        // Trạng thái cọc: Chưa cọc, Đã cọc
        public string TrangThaiCoc { get; set; } = "Chưa cọc";

        public string? PhuongThucThanhToan { get; set; }

        // Liên kết với Identity User (Tài khoản khách hàng đăng nhập)
        public string? UserId { get; set; }

        // Khóa ngoại liên kết tới Bàn ăn
        public int BanAnId { get; set; }

        [System.Text.Json.Serialization.JsonIgnore]
        public BanAn? BanAn { get; set; }

        // Mối quan hệ 1 - Nhiều với bảng chi tiết gọi món
        public List<ChiTietGoiMon> ChiTietGoiMons { get; set; } = new List<ChiTietGoiMon>();
    }
}