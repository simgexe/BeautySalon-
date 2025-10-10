# ---------- 1) React build ----------
FROM node:20-alpine AS webbuild
WORKDIR /src
COPY beauty-salon-frontend/package*.json ./beauty-salon-frontend/
RUN cd beauty-salon-frontend && npm ci
COPY beauty-salon-frontend ./beauty-salon-frontend
RUN cd beauty-salon-frontend && npm run build

# ---------- 2) .NET publish ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY BeautySalonAPI/*.csproj ./BeautySalonAPI/
RUN dotnet restore BeautySalonAPI/BeautySalonAPI.csproj
COPY BeautySalonAPI ./BeautySalonAPI

# Copy React build into wwwroot
RUN mkdir -p BeautySalonAPI/wwwroot && rm -rf BeautySalonAPI/wwwroot/*
COPY --from=webbuild /src/beauty-salon-frontend/build/ ./BeautySalonAPI/wwwroot/

RUN dotnet publish BeautySalonAPI/BeautySalonAPI.csproj -c Release -o /app/out

# ---------- 3) Runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
ENV ASPNETCORE_ENVIRONMENT=Production
# Railway injects $PORT at runtime; Kestrel binds via ASPNETCORE_URLS
ENV ASPNETCORE_URLS=http://0.0.0.0:${PORT}

COPY /global.json /app/global.json
COPY --from=build /app/out ./

# Optional healthcheck if you expose /health
# HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:${PORT}/health || exit 1

EXPOSE 8080
ENTRYPOINT ["dotnet", "BeautySalonAPI.dll"]
