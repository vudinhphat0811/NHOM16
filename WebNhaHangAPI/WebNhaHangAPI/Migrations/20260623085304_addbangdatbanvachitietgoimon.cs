using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebNhaHangAPI.Migrations
{
    /// <inheritdoc />
    public partial class addbangdatbanvachitietgoimon : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DanhSachBanAn_DanhSachKhuVuc_KhuVucId",
                table: "DanhSachBanAn");

            migrationBuilder.DropForeignKey(
                name: "FK_DanhSachMonAn_DanhSachDanhMuc_DanhMucId",
                table: "DanhSachMonAn");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DanhSachMonAn",
                table: "DanhSachMonAn");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DanhSachBanAn",
                table: "DanhSachBanAn");

            migrationBuilder.RenameTable(
                name: "DanhSachMonAn",
                newName: "danhsachmonan");

            migrationBuilder.RenameTable(
                name: "DanhSachBanAn",
                newName: "danhsachbanan");

            migrationBuilder.RenameIndex(
                name: "IX_DanhSachMonAn_DanhMucId",
                table: "danhsachmonan",
                newName: "IX_danhsachmonan_DanhMucId");

            migrationBuilder.RenameIndex(
                name: "IX_DanhSachBanAn_KhuVucId",
                table: "danhsachbanan",
                newName: "IX_danhsachbanan_KhuVucId");

            migrationBuilder.AlterColumn<string>(
                name: "MoTa",
                table: "danhsachmonan",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "HinhAnh",
                table: "danhsachmonan",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<decimal>(
                name: "Gia",
                table: "danhsachmonan",
                type: "decimal(65,30)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AddColumn<bool>(
                name: "IsChinhThuc",
                table: "danhsachbanan",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ViTriX",
                table: "danhsachbanan",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ViTriY",
                table: "danhsachbanan",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddPrimaryKey(
                name: "PK_danhsachmonan",
                table: "danhsachmonan",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_danhsachbanan",
                table: "danhsachbanan",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_danhsachbanan_DanhSachKhuVuc_KhuVucId",
                table: "danhsachbanan",
                column: "KhuVucId",
                principalTable: "DanhSachKhuVuc",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_danhsachmonan_DanhSachDanhMuc_DanhMucId",
                table: "danhsachmonan",
                column: "DanhMucId",
                principalTable: "DanhSachDanhMuc",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_danhsachbanan_DanhSachKhuVuc_KhuVucId",
                table: "danhsachbanan");

            migrationBuilder.DropForeignKey(
                name: "FK_danhsachmonan_DanhSachDanhMuc_DanhMucId",
                table: "danhsachmonan");

            migrationBuilder.DropPrimaryKey(
                name: "PK_danhsachmonan",
                table: "danhsachmonan");

            migrationBuilder.DropPrimaryKey(
                name: "PK_danhsachbanan",
                table: "danhsachbanan");

            migrationBuilder.DropColumn(
                name: "IsChinhThuc",
                table: "danhsachbanan");

            migrationBuilder.DropColumn(
                name: "ViTriX",
                table: "danhsachbanan");

            migrationBuilder.DropColumn(
                name: "ViTriY",
                table: "danhsachbanan");

            migrationBuilder.RenameTable(
                name: "danhsachmonan",
                newName: "DanhSachMonAn");

            migrationBuilder.RenameTable(
                name: "danhsachbanan",
                newName: "DanhSachBanAn");

            migrationBuilder.RenameIndex(
                name: "IX_danhsachmonan_DanhMucId",
                table: "DanhSachMonAn",
                newName: "IX_DanhSachMonAn_DanhMucId");

            migrationBuilder.RenameIndex(
                name: "IX_danhsachbanan_KhuVucId",
                table: "DanhSachBanAn",
                newName: "IX_DanhSachBanAn_KhuVucId");

            migrationBuilder.UpdateData(
                table: "DanhSachMonAn",
                keyColumn: "MoTa",
                keyValue: null,
                column: "MoTa",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "MoTa",
                table: "DanhSachMonAn",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "DanhSachMonAn",
                keyColumn: "HinhAnh",
                keyValue: null,
                column: "HinhAnh",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "HinhAnh",
                table: "DanhSachMonAn",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<decimal>(
                name: "Gia",
                table: "DanhSachMonAn",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(65,30)");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DanhSachMonAn",
                table: "DanhSachMonAn",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DanhSachBanAn",
                table: "DanhSachBanAn",
                column: "Id");

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
    }
}
