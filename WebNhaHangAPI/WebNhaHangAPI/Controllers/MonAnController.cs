using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Threading.Tasks;
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
            var danhSach = await _context.Set<MonAn>().ToListAsync();
            return Ok(danhSach);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var monAn = await _context.Set<MonAn>().FindAsync(id);
            if (monAn == null) return NotFound(new { message = "Không tìm thấy món ăn này!" });
            return Ok(monAn);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromForm] RequestMonAnForm model)
        {
            if (string.IsNullOrEmpty(model.TenMonAn) || model.GiaBan <= 0)
            {
                return BadRequest(new { message = "Tên món ăn hoặc giá bán không hợp lệ!" });
            }

            if (model.HinhAnhFile == null || model.HinhAnhFile.Length == 0)
            {
                return BadRequest(new { message = "Vui lòng upload hình ảnh món ăn!" });
            }
            var danhMucDb = await _context.Set<DanhMuc>().FindAsync(model.DanhMucId);
            if (danhMucDb == null)
            {
                return BadRequest(new { message = "Danh mục món ăn được chọn không hợp lệ hoặc không tồn tại!" });
            }

            string urlHinhAnhCloudinary = string.Empty;

            try
            {
                var uploadParams = new ImageUploadParams()
                {
                    File = new FileDescription(model.HinhAnhFile.FileName, model.HinhAnhFile.OpenReadStream()),
                    DisplayName = model.TenMonAn,
                    Folder = "WebNhaHang/MonAn"
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);
                urlHinhAnhCloudinary = uploadResult.SecureUrl.ToString();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi xảy ra khi upload hình ảnh lên hệ thống Cloudinary!", detail = ex.Message });
            }

            var monAnMoi = new MonAn
            {
                TenMon = model.TenMonAn.Trim(),
                Gia = (decimal)model.GiaBan,
                MoTa = model.TenMonAn.Trim(), 
                HinhAnh = urlHinhAnhCloudinary,
                DanhMucId = model.DanhMucId
            };

            _context.Set<MonAn>().Add(monAnMoi);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Thêm món ăn mới thành công!", data = monAnMoi });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromForm] RequestMonAnForm model)
        {
            var monAn = await _context.Set<MonAn>().FindAsync(id);
            if (monAn == null) return NotFound(new { message = "Không tìm thấy món ăn cần chỉnh sửa!" });

            var danhMucDb = await _context.Set<DanhMuc>().FindAsync(model.DanhMucId);
            if (danhMucDb == null) return BadRequest(new { message = "Danh mục món ăn lựa chọn không hợp lệ!" });


            if (model.HinhAnhFile != null && model.HinhAnhFile.Length > 0)
            {
                var uploadParams = new ImageUploadParams()
                {
                    File = new FileDescription(model.HinhAnhFile.FileName, model.HinhAnhFile.OpenReadStream()),
                    DisplayName = model.TenMonAn,
                    Folder = "WebNhaHang/MonAn"
                };
                var uploadResult = await _cloudinary.UploadAsync(uploadParams);
                monAn.HinhAnh = uploadResult.SecureUrl.ToString();
            }

            monAn.TenMon = model.TenMonAn.Trim();
            monAn.Gia = (decimal)model.GiaBan;
            monAn.DanhMucId = model.DanhMucId;

            _context.Set<MonAn>().Update(monAn);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật món ăn thành công!", data = monAn });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var monAn = await _context.Set<MonAn>().FindAsync(id);
            if (monAn == null) return NotFound(new { message = "Không tìm thấy món để xóa!" });

            _context.Set<MonAn>().Remove(monAn);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa món ăn thành công!" });
        }
    }
}