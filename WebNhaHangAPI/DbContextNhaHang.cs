using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace RestaurantBooking.Data
{
    public class DbContextNhaHang : IdentityDbContext
    {
        public DbContextNhaHang(DbContextOptions<DbContextNhaHang> options) : base(options)
        {
        }
    }
}