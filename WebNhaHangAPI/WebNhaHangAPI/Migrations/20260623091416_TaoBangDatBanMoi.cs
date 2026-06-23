using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebNhaHangAPI.Migrations
{
    /// <inheritdoc />
    public partial class TaoBangDatBanMoi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "danhsachdatban",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    TenKhachHang = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SoDienThoai = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NgayDat = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    SoLuongKhach = table.Column<int>(type: "int", nullable: false),
                    GhiChu = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TrangThai = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TienCoc = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    TrangThaiCoc = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PhuongThucThanhToan = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UserId = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    BanAnId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_danhsachdatban", x => x.Id);
                    table.ForeignKey(
                        name: "FK_danhsachdatban_danhsachbanan_BanAnId",
                        column: x => x.BanAnId,
                        principalTable: "danhsachbanan",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "chitietgoimonan",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    DatBanId = table.Column<int>(type: "int", nullable: false),
                    MonAnId = table.Column<int>(type: "int", nullable: false),
                    SoLuong = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chitietgoimonan", x => x.Id);
                    table.ForeignKey(
                        name: "FK_chitietgoimonan_danhsachdatban_DatBanId",
                        column: x => x.DatBanId,
                        principalTable: "danhsachdatban",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_chitietgoimonan_danhsachmonan_MonAnId",
                        column: x => x.MonAnId,
                        principalTable: "danhsachmonan",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_chitietgoimonan_DatBanId",
                table: "chitietgoimonan",
                column: "DatBanId");

            migrationBuilder.CreateIndex(
                name: "IX_chitietgoimonan_MonAnId",
                table: "chitietgoimonan",
                column: "MonAnId");

            migrationBuilder.CreateIndex(
                name: "IX_danhsachdatban_BanAnId",
                table: "danhsachdatban",
                column: "BanAnId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "chitietgoimonan");

            migrationBuilder.DropTable(
                name: "danhsachdatban");
        }
    }
}
