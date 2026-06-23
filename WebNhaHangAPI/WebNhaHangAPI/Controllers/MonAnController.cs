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

            // Đọc cấu hình từ appsettings.json
            var account = new Account(
                config["CloudinarySettings:CloudName"],
                config["CloudinarySettings:ApiKey"],
                config["CloudinarySettings:ApiSecret"]
            );
            _cloudinary = new Cloudinary(account);
        }

        // 1. LẤY TẤT CẢ MÓN ĂN
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var danhSach = await _context.Set<MonAn>().ToListAsync();
            return Ok(danhSach);
        }

        // 2. LẤY MÓN ĂN THEO ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var monAn = await _context.Set<MonAn>().FindAsync(id);
            if (monAn == null) return NotFound(new { message = "Không tìm thấy món ăn này!" });
            return Ok(monAn);
        }

        // 3. CẬP NHẬT: THÊM MÓN ĂN MỚI QUA API (ĐỒNG BỘ DTO CHUẨN)
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromForm] RequestMonAnForm model)
        {
            // Kiểm tra dữ liệu đầu vào cơ bản
            if (string.IsNullOrEmpty(model.TenMonAn) || model.GiaBan <= 0)
            {
                return BadRequest(new { message = "Tên món ăn hoặc giá bán không hợp lệ!" });
            }

            // Kiểm tra file ảnh truyền lên
            if (model.HinhAnhFile == null || model.HinhAnhFile.Length == 0)
            {
                return BadRequest(new { message = "Vui lòng upload hình ảnh món ăn!" });
            }

            // Kiểm tra xem danh mục được chọn có tồn tại thực sự dưới DB không
            var danhMucDb = await _context.Set<DanhMuc>().FindAsync(model.DanhMucId);
            if (danhMucDb == null)
            {
                return BadRequest(new { message = "Danh mục món ăn được chọn không hợp lệ hoặc không tồn tại!" });
            }

            string urlHinhAnhCloudinary = string.Empty;

            try
            {
                // 1. Thực hiện Upload ảnh lên Cloudinary
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

            // 2. Tạo thực thể dữ liệu thực tế để lưu vào bảng trong MySQL
            var monAnMoi = new MonAn
            {
                TenMon = model.TenMonAn.Trim(),
                Gia = (decimal)model.GiaBan,
                MoTa = model.TenMonAn.Trim(), // Hoặc bổ sung thuộc tính MoTa riêng nếu muốn
                HinhAnh = urlHinhAnhCloudinary,
                DanhMucId = model.DanhMucId
            };

            _context.Set<MonAn>().Add(monAnMoi);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Thêm món ăn mới thành công!", data = monAnMoi });
        }

        // 4. CẬP NHẬT MÓN ĂN THEO ID
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromForm] RequestMonAnForm model)
        {
            var monAn = await _context.Set<MonAn>().FindAsync(id);
            if (monAn == null) return NotFound(new { message = "Không tìm thấy món ăn cần chỉnh sửa!" });

            var danhMucDb = await _context.Set<DanhMuc>().FindAsync(model.DanhMucId);
            if (danhMucDb == null) return BadRequest(new { message = "Danh mục món ăn lựa chọn không hợp lệ!" });

            // Nếu người dùng có upload ảnh mới, tiến hành thay thế trên Cloudinary
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

        // 5. XÓA MÓN ĂN THEO ID
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