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

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var danhSach = await _context.Set<BanAn>().ToListAsync();
            return Ok(danhSach);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var banAn = await _context.Set<BanAn>().FindAsync(id);
            if (banAn == null) return NotFound(new { message = "Không tìm thấy bàn này!" });
            return Ok(banAn);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] RequestBanAn model)
        {
            if (model == null || string.IsNullOrEmpty(model.TenBan))
            {
                return BadRequest(new { message = "Tên bàn ăn không được để trống!" });
            }

            var banMoi = new BanAn
            {
                TenBan = model.TenBan.Trim(),
                SoChoNgoi = model.SoChoNgoi > 0 ? model.SoChoNgoi : 4,
                TrangThai = string.IsNullOrEmpty(model.TrangThai) ? "Trống" : model.TrangThai.Trim(),
                KhuVucId = model.KhuVucId,
                ViTriX = 20,    
                ViTriY = 40,
                IsChinhThuc = false   
            };

            _context.Set<BanAn>().Add(banMoi);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Thêm bàn ăn vào kho lưu trữ thành công!", data = banMoi });
        }

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