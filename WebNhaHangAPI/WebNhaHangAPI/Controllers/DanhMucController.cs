using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebNhaHangAPI.Data;
using WebNhaHangAPI.Models;

namespace WebNhaHangAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DanhMucController : ControllerBase
    {
        private readonly DbContextNhaHang _context;

        public DanhMucController(DbContextNhaHang context)
        {
            _context = context;
        }

 
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var danhSach = await _context.DanhSachDanhMuc.Include(d => d.MonAns).ToListAsync();
            return Ok(danhSach);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] DanhMuc model)
        {
            _context.DanhSachDanhMuc.Add(model);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Thêm danh mục thành công!", data = model });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var danhMuc = await _context.DanhSachDanhMuc.FindAsync(id);
            if (danhMuc == null) return NotFound(new { message = "Không tìm thấy danh mục!" });

            _context.DanhSachDanhMuc.Remove(danhMuc);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa danh mục thành công!" });
        }
    }
}