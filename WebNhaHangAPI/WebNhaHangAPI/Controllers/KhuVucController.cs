using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebNhaHangAPI.Data;
using WebNhaHangAPI.Models;

namespace WebNhaHangAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class KhuVucController : ControllerBase
    {
        private readonly DbContextNhaHang _context;

        public KhuVucController(DbContextNhaHang context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var danhSach = await _context.DanhSachKhuVuc.Include(k => k.BanAns).ToListAsync();
            return Ok(danhSach);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] KhuVuc model)
        {
            _context.DanhSachKhuVuc.Add(model);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Thêm khu vực thành công!", data = model });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var khuVuc = await _context.DanhSachKhuVuc.FindAsync(id);
            if (khuVuc == null) return NotFound(new { message = "Không tìm thấy khu vực!" });

            _context.DanhSachKhuVuc.Remove(khuVuc);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa khu vực thành công!" });
        }
    }
}