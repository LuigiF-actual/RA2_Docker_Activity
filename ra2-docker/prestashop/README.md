# PrestaShop activity

## Objective

Deploy PrestaShop in Debian WSL with Docker Compose, MySQL, phpMyAdmin, an explicit Nginx reverse proxy, and local HTTPS through HTTPS Portal.

## Architecture

```text
Browser -> HTTPS Portal -> Nginx -> PrestaShop -> MySQL
                                      phpMyAdmin -> MySQL
```

| Service | Image | Host access | Purpose |
|---|---|---|---|
| `prestashop` | `prestashop/prestashop:8` | Internal only | Store application |
| `mysql` | `mysql:8` | Not exposed | Persistent database |
| `phpmyadmin` | `phpmyadmin/phpmyadmin` | `http://localhost:9081` | Database administration |
| `nginx` | `nginx:alpine` | Internal only | Reverse proxy to PrestaShop |
| `https-portal` | `steveltn/https-portal:1` | `https://prestashop.localhost:9443` | Local HTTPS reverse proxy |

The activity uses `frontend-network` and `backend-network`. MySQL has no host port. PrestaShop and phpMyAdmin join the backend network only to connect to MySQL. HTTPS Portal and Nginx handle incoming traffic on the frontend network.

## Image note

The assignment names `bitnami/prestashop` as the required image. Docker Hub currently denies access to that image. This deployment therefore uses the official `prestashop/prestashop:8` image included in the assignment's example configuration. Confirm this substitution with the teacher before submitting.

## Configuration

1. Create the local environment file:

   ```bash
   cd /home/luigi/ra2-docker/prestashop
   cp .env.example .env
   ```

2. Set private credentials in `.env`.
3. Start and inspect the stack:

   ```bash
   docker compose up -d
   docker compose ps
   ```

MySQL has a healthcheck and `security_opt: seccomp:unconfined`, which avoids the documented MySQL 8 `mbind` error in WSL. PrestaShop and phpMyAdmin wait for a healthy database. Named volumes preserve MySQL data, PrestaShop files, and local certificates.

Nginx sends the original HTTPS host and protocol to PrestaShop. This prevents a canonical-domain redirect loop.

## HTTPS and local ports

HTTPS Portal uses `STAGE: local`, so the certificate is self-signed.

- HTTP portal: `http://prestashop.localhost:9080`
- Store: `https://prestashop.localhost:9443`
- phpMyAdmin: `http://localhost:9081`

Ports 80 and 443 are occupied by a Windows Apache service on this computer, so the portal uses 9080 and 9443 for the local test.

## Verification

```bash
docker compose ps
curl -kI https://prestashop.localhost:9443/
docker compose exec nginx nginx -t
```

Expected result: MySQL is healthy, Nginx configuration is valid, and the HTTPS request returns `200 OK`.

## Troubleshooting

- **502 Bad Gateway:** wait for PrestaShop to finish starting, then run `docker compose logs prestashop nginx https-portal`.
- **Too many redirects:** verify that `PS_DOMAIN`, the saved shop URL, the Nginx host header, and the browser URL all use `prestashop.localhost:9443`.
- **Certificate warning:** expected for a local self-signed certificate.
- **MySQL mbind error:** keep `security_opt: seccomp:unconfined` on the MySQL service.

## Stop and cleanup

```bash
docker compose down
# The following also deletes the store, database, and certificate data:
docker compose down -v
```
