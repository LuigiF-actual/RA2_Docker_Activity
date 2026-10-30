# WordPress activity

## Objective

Deploy WordPress in Debian WSL with Docker Compose, a persistent MySQL database, phpMyAdmin, and local HTTPS through HTTPS Portal.

## Architecture

```text
Browser -> HTTPS Portal -> WordPress -> MySQL
                         phpMyAdmin -> MySQL
```

| Service | Image | Host access | Purpose |
|---|---|---|---|
| `wordpress` | `bitnami/wordpress` | `http://localhost:8081` | WordPress application |
| `mysql` | `mysql:8` | Not exposed | Persistent database |
| `phpmyadmin` | `phpmyadmin/phpmyadmin` | `http://localhost:8082` | Database administration |
| `https-portal` | `steveltn/https-portal:1` | `https://wordpress.lvh.me:8443` | Local HTTPS reverse proxy |

The Compose file defines `frontend-network` and `backend-network`. MySQL has no host port. WordPress and phpMyAdmin join the backend network only to reach MySQL; HTTPS Portal stays on the frontend network.

## Configuration

1. Create the local environment file:

   ```bash
   cd /home/luigi/ra2-docker/wordpress
   cp .env.example .env
   ```

2. Edit `.env` with private passwords and site information.
3. Start the activity:

   ```bash
   docker compose up -d
   docker compose ps
   ```

MySQL uses a healthcheck. WordPress and phpMyAdmin use `depends_on` with `condition: service_healthy`, so they wait for MySQL. Named volumes `mysql_data`, `wordpress_data`, and `ssl_certs_data` preserve database files, WordPress files, and local certificates.

The services use a restart policy. WordPress is configured for a reverse proxy and uses the canonical HTTPS URL `https://wordpress.lvh.me:8443`.

## HTTPS and local ports

The original activity normally maps HTTPS Portal to host ports 80 and 443. This computer already runs a Windows Apache service on those ports, so this local deployment maps the portal to 8083 and 8443 instead:

- HTTP portal: `http://wordpress.lvh.me:8083`
- HTTPS portal: `https://wordpress.lvh.me:8443`

HTTPS Portal runs with `STAGE: local`, so the certificate is self-signed. Accept the browser warning for the local test certificate.

## Verification

```bash
docker compose ps
curl -kI https://wordpress.lvh.me:8443/
```

Expected result: all services are up, MySQL is healthy, and the HTTPS request returns `200 OK`.

## Troubleshooting

- **502 Bad Gateway:** wait until WordPress has completed its startup, then inspect `docker compose logs wordpress https-portal`.
- **Certificate warning:** expected with `STAGE: local`.
- **Port already in use:** use the configured 8083/8443 mappings, or stop the conflicting Windows web server before mapping the portal to 80/443.
- **Database connection failure:** confirm MySQL is healthy with `docker compose ps`.

## Stop and cleanup

```bash
docker compose down
# The following also deletes WordPress, database, and certificate data:
docker compose down -v
```
