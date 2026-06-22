using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebNhaHangAPI.Data;
using WebNhaHangAPI.Models;

namespace WebNhaHangAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MonAnController : ControllerBase
    {
        private readonly DbContextNhaHang _context;
        private readonly Cloudinary _cloudinary;

        public MonAnController(DbContextNhaHang context, IConfiguration config)
        {
            _context = context;

            // Đọc cấu hình từ appsettings.json
            var account = new Account(
                config["CloudinarySettings:CloudName"],
                config["CloudinarySettings:ApiKey"],
                config["CloudinarySettings:ApiSecret"]
            );
            _cloudinary = new Cloudinary(account);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var danhSach = await _context.DanhSachMonAn.ToListAsync();
            return Ok(danhSach);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var monAn = await _context.DanhSachMonAn.FindAsync(id);
            if (monAn == null) return NotFound(new { message = "Không tìm thấy món ăn này!" });
            return Ok(monAn);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromForm] IFormFile hinhAnhFile, [FromForm] MonAn model)
        {
            if (hinhAnhFile == null || hinhAnhFile.Length == 0)
            {
                return BadRequest(new { message = "Vui lòng upload hình ảnh món ăn!" });
            }

            // 1. Upload ảnh lên Cloudinary
            var uploadParams = new ImageUploadParams()
            {
                File = new FileDescription(hinhAnhFile.FileName, hinhAnhFile.OpenReadStream()),
                DisplayName = model.TenMon, 
                Folder = "WebNhaHang/MonAn" 
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);

            model.HinhAnh = uploadResult.SecureUrl.ToString(); 

            _context.DanhSachMonAn.Add(model);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Thêm món ăn thành công!", data = model });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromForm] IFormFile hinhAnhFile, [FromForm] MonAn model)
        {
            var monAn = await _context.DanhSachMonAn.FindAsync(id);
            if (monAn == null) return NotFound(new { message = "Không tìm thấy món ăn!" });

            if (hinhAnhFile != null && hinhAnhFile.Length > 0)
            {
                var uploadParams = new ImageUploadParams()
                {
                    File = new FileDescription(hinhAnhFile.FileName, hinhAnhFile.OpenReadStream()),
                    DisplayName = model.TenMon,
                    Folder = "WebNhaHang/MonAn"
                };
                var uploadResult = await _cloudinary.UploadAsync(uploadParams);
                monAn.HinhAnh = uploadResult.SecureUrl.ToString(); 
            }

            monAn.TenMon = model.TenMon;
            monAn.MoTa = model.MoTa;
            monAn.Gia = model.Gia;
            monAn.DanhMucId = model.DanhMucId;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật món ăn thành công!", data = monAn });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var monAn = await _context.DanhSachMonAn.FindAsync(id);
            if (monAn == null) return NotFound(new { message = "Không tìm thấy món để xóa!" });

            _context.DanhSachMonAn.Remove(monAn);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa món ăn thành công!" });
        }
    }
}