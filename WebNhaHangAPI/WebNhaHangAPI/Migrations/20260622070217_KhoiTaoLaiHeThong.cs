using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebNhaHangAPI.Migrations
{
    /// <inheritdoc />
    public partial class KhoiTaoLaiHeThong : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DanhMuc",
                table: "DanhSachMonAn");

            migrationBuilder.AddColumn<int>(
                name: "DanhMucId",
                table: "DanhSachMonAn",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "KhuVucId",
                table: "DanhSachBanAn",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "DanhSachDanhMuc",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    TenDanhMuc = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DanhSachDanhMuc", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "DanhSachKhuVuc",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    TenKhuVuc = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DanhSachKhuVuc", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_DanhSachMonAn_DanhMucId",
                table: "DanhSachMonAn",
                column: "DanhMucId");

            migrationBuilder.CreateIndex(
                name: "IX_DanhSachBanAn_KhuVucId",
                table: "DanhSachBanAn",
                column: "KhuVucId");

            migrationBuilder.AddForeignKey(
                name: "FK_DanhSachBanAn_DanhSachKhuVuc_KhuVucId",
                table: "DanhSachBanAn",
                column: "KhuVucId",
                principalTable: "DanhSachKhuVuc",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DanhSachMonAn_DanhSachDanhMuc_DanhMucId",
                table: "DanhSachMonAn",
                column: "DanhMucId",
                principalTable: "DanhSachDanhMuc",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DanhSachBanAn_DanhSachKhuVuc_KhuVucId",
                table: "DanhSachBanAn");

            migrationBuilder.DropForeignKey(
                name: "FK_DanhSachMonAn_DanhSachDanhMuc_DanhMucId",
                table: "DanhSachMonAn");

            migrationBuilder.DropTable(
                name: "DanhSachDanhMuc");

            migrationBuilder.DropTable(
                name: "DanhSachKhuVuc");

            migrationBuilder.DropIndex(
                name: "IX_DanhSachMonAn_DanhMucId",
                table: "DanhSachMonAn");

            migrationBuilder.DropIndex(
                name: "IX_DanhSachBanAn_KhuVucId",
                table: "DanhSachBanAn");

            migrationBuilder.DropColumn(
                name: "DanhMucId",
                table: "DanhSachMonAn");

            migrationBuilder.DropColumn(
                name: "KhuVucId",
                table: "DanhSachBanAn");

            migrationBuilder.AddColumn<string>(
                name: "DanhMuc",
                table: "DanhSachMonAn",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");
        }
    }
}
