using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebNhaHangAPI.Data;
using WebNhaHangAPI.Models;

namespace WebNhaHangAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BanAnController : ControllerBase
    {
        private readonly DbContextNhaHang _context;

        public BanAnController(DbContextNhaHang context)
        {
            _context = context;
        }

        // 1. LẤY TẤT CẢ BÀN ĂN
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var danhSach = await _context.Set<BanAn>().ToListAsync();
            return Ok(danhSach);
        }

        // 2. LẤY BÀN ĂN THEO ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var banAn = await _context.Set<BanAn>().FindAsync(id);
            if (banAn == null) return NotFound(new { message = "Không tìm thấy bàn này!" });
            return Ok(banAn);
        }

        // 3. THÊM BÀN ĂN MỚI (SỬA ĐỔI THAM SỐ THÀNH RequestBanAn THAY VÌ BanAn)
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] RequestBanAn model)
        {
            if (model == null || string.IsNullOrEmpty(model.TenBan))
            {
                return BadRequest(new { message = "Tên bàn ăn không được để trống!" });
            }

            // Tạo thực thể mới để lưu xuống DB
            var banMoi = new BanAn
            {
                TenBan = model.TenBan.Trim(),
                SoChoNgoi = model.SoChoNgoi > 0 ? model.SoChoNgoi : 4,
                TrangThai = string.IsNullOrEmpty(model.TrangThai) ? "Trống" : model.TrangThai.Trim(),
                KhuVucId = model.KhuVucId,
                ViTriX = 20,         // Tọa độ mặc định ở kho bàn chờ bên trái
                ViTriY = 40,
                IsChinhThuc = false   // Mặc định tạo mới sẽ nằm ở kho lưu trữ chờ kéo thả
            };

            _context.Set<BanAn>().Add(banMoi);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Thêm bàn ăn vào kho lưu trữ thành công!", data = banMoi });
        }

        // 4. CẬP NHẬT THÔNG TIN BÀN ĂN (SỬA ĐỔI THAM SỐ THÀNH RequestBanAn)
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] RequestBanAn model)
        {
            var banAn = await _context.Set<BanAn>().FindAsync(id);
            if (banAn == null) return NotFound(new { message = "Không tìm thấy bàn!" });

            if (model == null || string.IsNullOrEmpty(model.TenBan))
            {
                return BadRequest(new { message = "Tên bàn ăn không được để trống!" });
            }

            // Gán dữ liệu thay đổi
            banAn.TenBan = model.TenBan.Trim();
            banAn.SoChoNgoi = model.SoChoNgoi;
            banAn.TrangThai = string.IsNullOrEmpty(model.TrangThai) ? "Trống" : model.TrangThai.Trim();
            banAn.KhuVucId = model.KhuVucId;
            banAn.ViTriX = model.ViTriX;
            banAn.ViTriY = model.ViTriY;
            banAn.IsChinhThuc = model.IsChinhThuc;

            _context.Set<BanAn>().Update(banAn);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thông tin bàn ăn thành công!" });
        }

        // 5. XÓA BÀN ĂN
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var banAn = await _context.Set<BanAn>().FindAsync(id);
            if (banAn == null) return NotFound(new { message = "Không tìm thấy bàn để xóa!" });

            _context.Set<BanAn>().Remove(banAn);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa bàn ăn thành công!" });
        }

        // 6. LỌC BÀN ĂN THEO TRẠNG THÁI
        [HttpGet("loc-trang-thai")]
        public async Task<IActionResult> GetByStatus([FromQuery] string trangThai)
        {
            if (string.IsNullOrEmpty(trangThai))
            {
                return BadRequest(new { message = "Vui lòng cung cấp trạng thái cần lọc!" });
            }

            var danhSachLoc = await _context.Set<BanAn>()
                .Where(b => b.TrangThai.ToLower() == trangThai.ToLower())
                .ToListAsync();

            return Ok(danhSachLoc);
        }
    }
}