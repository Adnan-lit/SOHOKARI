# Docker setup

## Quick start

```bash
docker compose up --build
```

## Expected logs (first run)

- `sohokari-mongo  | Waiting for connections`
- `sohokari-app    | Started SohokariBackendApplication`
- `sohokari-app    | Firebase initialized successfully`

Note: The Firebase line appears only if you provide valid credentials. If you do not have Firebase credentials yet, set `APP_FIREBASE_ENABLED=false` in `docker-compose.yml` or provide `FIREBASE_CREDENTIALS_JSON`.

## Test

```bash
curl http://localhost:8080/api/v1/auth/register/customer
```

## Stop

```bash
docker compose down
```

