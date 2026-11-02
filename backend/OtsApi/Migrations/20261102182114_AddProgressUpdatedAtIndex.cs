using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OtsApi.Migrations
{
    /// <inheritdoc />
    public partial class AddProgressUpdatedAtIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Progresses_UpdatedAt",
                table: "Progresses",
                column: "UpdatedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Progresses_UpdatedAt",
                table: "Progresses");
        }
    }
}
