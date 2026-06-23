using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using WebNhaHangAPI.Data;
using WebNhaHangAPI.Models;

namespace WebNhaHangAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class MenuAdminController : ControllerBase
    {
        private readonly DbContextNhaHang _context;
        public MenuAdminController(DbContextNhaHang context) { _context = context; }

        [HttpGet("get-all-categories")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCats() => Ok(await _context.Set<DanhMuc>().ToListAsync());

        [HttpGet("get-all-dishes")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDishes()
        {
            // Fix lỗi CS0117 và ToListAsync bằng cách đảm bảo namespace EFCore đã được thêm
            var dsMonAn = await _context.Set<MonAn>().ToListAsync();
            return Ok(dsMonAn);
        }

        [HttpPost("add-dish")]
        public async Task<IActionResult> AddDish([FromForm] string tenMonAn, [FromForm] int danhMucId, [FromForm] decimal giaBan, [FromForm] string trangThai, IFormFile hinhAnhFile)
        {
            var mon = new MonAn
            {
                TenMon = tenMonAn,
                DanhMucId = danhMucId,
                Gia = giaBan,
                TrangThai = trangThai ?? "Đang phục vụ"
            };

            if (hinhAnhFile != null)
            {
                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(hinhAnhFile.FileName);
                var path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", fileName);

                if (!Directory.Exists(Path.GetDirectoryName(path))) Directory.CreateDirectory(Path.GetDirectoryName(path));

                using (var stream = new FileStream(path, FileMode.Create)) { await hinhAnhFile.CopyToAsync(stream); }
                mon.HinhAnh = "/images/" + fileName;
            }

            _context.Set<MonAn>().Add(mon);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Thêm thành công!" });
        }

        [HttpDelete("delete-dish/{id}")]
        public async Task<IActionResult> DeleteDish(int id)
        {
            var mon = await _context.Set<MonAn>().FindAsync(id);
            if (mon == null) return NotFound();
            _context.Set<MonAn>().Remove(mon);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa thành công!" });
        }
    }
}