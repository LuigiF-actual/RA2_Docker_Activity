# Node.js, MySQL and Nginx activity

## Objective

Deploy three separate Docker containers with Docker Compose:

1. MySQL stores a `products` table.
2. Node.js exposes the table through a JSON API.
3. Nginx serves a web page and proxies API requests to Node.js.

The page at `http://localhost:8084` displays the records read from MySQL.

## Architecture

```text
Browser -> Nginx -> Node.js API -> MySQL
```

| Service | Build/image | Host access | Purpose |
|---|---|---|---|
| `mysql` | `mysql:8` | Not exposed | Persistent database and seed table |
| `node` | `./node/Dockerfile` | Internal only | Express API at `/api/products` |
| `nginx` | `nginx:alpine` | `http://localhost:8084` | Static frontend and reverse proxy |

## Files

```text
node-mysql-nginx/
├── docker-compose.yml
├── .env.example
├── mysql/
│   └── init.sql
├── node/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
└── nginx/
    ├── default.conf
    └── index.html
```

## Configuration

Create the private environment file:

```bash
cd /home/luigi/ra2-docker/node-mysql-nginx
cp .env.example .env
```

Set strong database passwords in `.env`. It is ignored by Git.

The Compose file defines two networks:

- `backend-network`: MySQL and Node.js.
- `frontend-network`: Node.js and Nginx.

MySQL is not published to the host. It has a healthcheck, named volume `mysql_data`, and the WSL-compatible `seccomp:unconfined` setting. Node.js waits for MySQL to become healthy. Nginx publishes only the web page port.

## Deployment

```bash
docker compose up -d --build
docker compose ps
```

The first startup creates the database and runs `mysql/init.sql`, which creates and seeds the `products` table.

## Verification

Open:

```text
http://localhost:8084
```

The page displays three products from MySQL. You can also verify the API and Nginx:

```bash
curl http://localhost:8084/api/products
docker compose exec nginx nginx -t
docker compose logs node
```

Expected API response: an array containing `Docker Handbook`, `Nginx Sticker`, and `Node.js Mug`.

## Troubleshooting

- **The table is empty:** initialization SQL runs only when MySQL creates a new data volume. To recreate the sample data, run `docker compose down -v` and start the stack again.
- **502 or API errors:** confirm that `mysql` is healthy and inspect `docker compose logs node mysql`.
- **Port conflict:** change `NODE_NGINX_PORT` in `.env` and restart with `docker compose up -d`.

## Stop and cleanup

```bash
docker compose down
# The following also deletes the MySQL data volume:
docker compose down -v
```
