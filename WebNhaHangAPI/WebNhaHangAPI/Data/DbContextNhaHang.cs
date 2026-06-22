using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using WebNhaHangAPI.Models;

namespace WebNhaHangAPI.Data 
{
    public class DbContextNhaHang : IdentityDbContext
    {
        public DbContextNhaHang(DbContextOptions<DbContextNhaHang> options) : base(options)
        {

        }
        public DbSet<BanAn> DanhSachBanAn { get; set; }
        public DbSet<MonAn> DanhSachMonAn { get; set; }
        public DbSet<DanhMuc> DanhSachDanhMuc { get; set; }
        public DbSet<KhuVuc> DanhSachKhuVuc { get; set; }
    }
}