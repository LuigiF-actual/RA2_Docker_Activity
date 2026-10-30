# Docker RA2 activities

This repository contains the three Docker Compose activities completed in Debian WSL:

| Activity | Directory | Browser entry point |
|---|---|---|
| WordPress, MySQL, phpMyAdmin and HTTPS portal | `wordpress/` | `https://wordpress.lvh.me:8443` |
| PrestaShop, MySQL, phpMyAdmin, Nginx and HTTPS portal | `prestashop/` | `https://prestashop.localhost:9443` |
| Nginx, Node.js and MySQL | `node-mysql-nginx/` | `http://localhost:8084` |

## Submission

Create an empty GitHub repository under your own account, add it as the `origin` remote, and push this directory. Replace this sentence with the repository URL before submitting.

Each activity has its own English `README.md` with architecture, configuration, deployment commands, checks, troubleshooting, and cleanup instructions.

## Safety

Real environment files are ignored by Git. Copy a provided `.env.example` to `.env` and use your own passwords. Never commit a real `.env` file.

## Global checks

From Debian WSL:

```bash
docker compose --project-directory wordpress -f wordpress/docker-compose.yml ps
docker compose --project-directory prestashop -f prestashop/docker-compose.yml ps
docker compose --project-directory node-mysql-nginx -f node-mysql-nginx/docker-compose.yml ps
```

All MySQL containers use named volumes, so `docker compose down` preserves data. Only `docker compose down -v` removes the activity data.
