# Technical Documentation - Docker RA2

> **GitHub repository URL:** Replace this line with the URL of this repository after it has been pushed to your own GitHub account.

## 1. Purpose and environment

This technical document describes the deployment of three web infrastructures with Docker Compose in Debian running on WSL 2:

1. WordPress with MySQL, phpMyAdmin, and HTTPS Portal.
2. PrestaShop with MySQL, phpMyAdmin, Nginx, and HTTPS Portal.
3. A three-tier application with Nginx, Node.js, and MySQL.

Docker Compose is used to define the services, networks, persistent volumes, environment variables, startup dependencies, and restart policies. Each activity is kept in a separate directory.

| Activity | Directory | Main URL |
|---|---|---|
| WordPress | `wordpress/` | `https://wordpress.lvh.me:8443` |
| PrestaShop | `prestashop/` | `https://prestashop.localhost:9443` |
| Node.js, MySQL, and Nginx | `node-mysql-nginx/` | `http://localhost:8084` |

## 2. General security and persistence decisions

- Credentials are stored in local `.env` files.
- Real `.env` files are ignored by Git. Each activity includes an `.env.example` template.
- MySQL is not exposed directly to the Windows host in any activity.
- Named Docker volumes preserve application and database data.
- All database services have health checks.
- Applications that depend on MySQL use `depends_on` with `condition: service_healthy`.
- Restart policies keep services running after unexpected failures.
- WSL was configured with `instanceIdleTimeout=-1` in `C:\Users\luigi\.wslconfig` so the Debian instance does not stop Docker when the terminal is closed.

## 3. WordPress deployment

### 3.1 Services and Compose configuration

| Service | Image | Function |
|---|---|---|
| `mysql` | `mysql:8` | WordPress database |
| `wordpress` | `bitnami/wordpress` | WordPress application |
| `phpmyadmin` | `phpmyadmin/phpmyadmin` | Web database management |
| `https-portal` | `steveltn/https-portal:1` | Local HTTPS reverse proxy |

The Compose file defines two networks:

- `frontend-network`: WordPress, phpMyAdmin, and HTTPS Portal.
- `backend-network`: MySQL plus the services that need to connect to it.

MySQL has no `ports` section, so it is inaccessible from the host. The `mysql_data`, `wordpress_data`, and `ssl_certs_data` named volumes persist the database, WordPress files, and local HTTPS certificates.

The MySQL healthcheck uses `mysqladmin ping`. WordPress and phpMyAdmin wait until that healthcheck is successful. WordPress is configured to trust the reverse proxy and its canonical URL is set to the HTTPS address.

### 3.2 Deployment actions

```bash
cd /home/luigi/ra2-docker/wordpress
cp .env.example .env
# Edit .env with private credentials and site information
docker compose up -d
docker compose ps
```

### 3.3 Access and verification

| Service | URL |
|---|---|
| WordPress through HTTPS Portal | `https://wordpress.lvh.me:8443` |
| WordPress direct access | `http://localhost:8081` |
| phpMyAdmin | `http://localhost:8082` |

Verification command:

```bash
curl -kI https://wordpress.lvh.me:8443/
```

The verified response is `HTTP/1.1 200 OK`.

## 4. PrestaShop deployment

### 4.1 Services and Compose configuration

| Service | Image | Function |
|---|---|---|
| `mysql` | `mysql:8` | PrestaShop database |
| `prestashop` | `prestashop/prestashop:8` | Store application |
| `nginx` | `nginx:alpine` | Reverse proxy to PrestaShop |
| `phpmyadmin` | `phpmyadmin/phpmyadmin` | Web database management |
| `https-portal` | `steveltn/https-portal:1` | Local HTTPS reverse proxy |

The traffic flow is:

```text
Browser -> HTTPS Portal -> Nginx -> PrestaShop -> MySQL
                                      phpMyAdmin -> MySQL
```

The services use `frontend-network` and `backend-network`. MySQL has no host port. The MySQL volume `mysql_data` stores the database, `prestashop_data` stores the application, and `ssl_certs_data` stores certificates.

The MySQL service includes `security_opt: seccomp:unconfined` to avoid the documented MySQL 8 `mbind` error in WSL. Its healthcheck controls the startup of PrestaShop and phpMyAdmin. Nginx forwards the canonical host and HTTPS protocol to PrestaShop, preventing redirect loops.

> **Image note:** The assignment names `bitnami/prestashop`; however, Docker Hub denied access to that image from this Debian Docker daemon. The current deployment uses `prestashop/prestashop:8`, the official image also shown in the assignment example. This substitution should be confirmed with the teacher.

### 4.2 Deployment actions

```bash
cd /home/luigi/ra2-docker/prestashop
cp .env.example .env
# Edit .env with private credentials
docker compose up -d
docker compose ps
docker compose exec nginx nginx -t
```

### 4.3 Access and verification

| Service | URL |
|---|---|
| PrestaShop through HTTPS Portal | `https://prestashop.localhost:9443` |
| phpMyAdmin | `http://localhost:9081` |

Verification command:

```bash
curl -kI https://prestashop.localhost:9443/
```

The verified response is `HTTP/1.1 200 OK`.

## 5. Nginx, Node.js, and MySQL deployment

### 5.1 Services and Compose configuration

| Service | Image or build source | Function |
|---|---|---|
| `mysql` | `mysql:8` | Persistent database |
| `node` | `node/Dockerfile` | Express API |
| `nginx` | `nginx:alpine` | Static frontend and API reverse proxy |

The traffic flow is:

```text
Browser -> Nginx -> Node.js API -> MySQL
```

MySQL initializes a `products` table from `mysql/init.sql`. The Node.js API exposes `/api/products`. Nginx serves `index.html` and proxies `/api/` requests to the Node.js container. The web page displays the MySQL rows in a table.

The database has a healthcheck and named volume `mysql_data`. Node.js waits for MySQL to be healthy. MySQL and Node.js use `backend-network`; Node.js and Nginx use `frontend-network`.

### 5.2 Deployment actions

```bash
cd /home/luigi/ra2-docker/node-mysql-nginx
cp .env.example .env
# Edit .env with private credentials
docker compose up -d --build
docker compose ps
```

### 5.3 Access and verification

| Service | URL |
|---|---|
| Web application | `http://localhost:8084` |
| Products API through Nginx | `http://localhost:8084/api/products` |

Verification commands:

```bash
curl http://localhost:8084/api/products
docker compose exec nginx nginx -t
```

The API returns three database records: Docker Handbook, Nginx Sticker, and Node.js Mug.

## 6. HTTPS implementation

HTTPS Portal runs with `STAGE: local`, which creates self-signed certificates. Browser certificate warnings are normal for these local addresses and must be accepted for testing.

Windows Apache was already occupying host ports 80 and 443. To avoid changing that unrelated service, each HTTPS Portal uses separate local ports:

| Activity | HTTP port | HTTPS port |
|---|---:|---:|
| WordPress | 8083 | 8443 |
| PrestaShop | 9080 | 9443 |

The proxy containers themselves still listen on ports 80 and 443 internally.

## 7. Final validation

The following checks were completed successfully:

```bash
docker compose --project-directory wordpress -f wordpress/docker-compose.yml ps
docker compose --project-directory prestashop -f prestashop/docker-compose.yml ps
docker compose --project-directory node-mysql-nginx -f node-mysql-nginx/docker-compose.yml ps
```

Results:

- Both WordPress and PrestaShop MySQL containers are healthy.
- Both HTTPS Portal containers are healthy.
- Both HTTPS addresses return `200 OK`.
- The Nginx configuration is valid in the PrestaShop and Node.js activities.
- The Node.js API returns records stored in MySQL.
- Git ignores all real `.env` files.

## 8. Stop and cleanup

For any activity:

```bash
docker compose down
```

This stops and removes containers but preserves named volumes. The following command permanently removes the activity data and should only be used when a full reset is intended:

```bash
docker compose down -v
```
