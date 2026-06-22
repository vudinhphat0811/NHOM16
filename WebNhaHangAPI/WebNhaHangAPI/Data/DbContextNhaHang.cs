using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace WebNhaHangAPI.Data 
{
    public class DbContextNhaHang : IdentityDbContext
    {
        public DbContextNhaHang(DbContextOptions<DbContextNhaHang> options) : base(options)
        {
        }
    }
}