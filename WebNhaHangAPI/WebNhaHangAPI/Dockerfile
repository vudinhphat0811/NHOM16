
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy file .csproj và restore các gói NuGet
COPY *.csproj ./
RUN dotnet restore

# Copy toàn bộ code còn lại và build xuất bản
COPY . .
RUN dotnet publish -c Release -o /app


FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app .

# Lệnh khởi chạy ứng dụng
ENTRYPOINT ["dotnet", "WebNhaHangAPI.dll"]