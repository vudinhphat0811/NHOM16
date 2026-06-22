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
            var danhSach = await _context.DanhSachBanAn.ToListAsync();
            return Ok(danhSach);
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var banAn = await _context.DanhSachBanAn.FindAsync(id);
            if (banAn == null) return NotFound(new { message = "Không tìm thấy bàn này!" });
            return Ok(banAn);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] BanAn model)
        {
            _context.DanhSachBanAn.Add(model);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Thêm bàn ăn thành công!", data = model });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] BanAn model)
        {
            var banAn = await _context.DanhSachBanAn.FindAsync(id);
            if (banAn == null) return NotFound(new { message = "Không tìm thấy bàn!" });

            banAn.TenBan = model.TenBan;
            banAn.SoChoNgoi = model.SoChoNgoi;
            banAn.TrangThai = model.TrangThai;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật bàn ăn thành công!" });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var banAn = await _context.DanhSachBanAn.FindAsync(id);
            if (banAn == null) return NotFound(new { message = "Không tìm thấy bàn để xóa!" });

            _context.DanhSachBanAn.Remove(banAn);
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

            var danhSachLoc = await _context.DanhSachBanAn
                .Where(b => b.TrangThai.ToLower() == trangThai.ToLower())
                .ToListAsync();

            return Ok(danhSachLoc);
        }
    }
}