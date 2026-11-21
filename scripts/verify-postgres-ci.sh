#!/usr/bin/env bash
# Disposable local PostgreSQL 16 TLS + role verification. Never connects to production.
set -euo pipefail
tmp="$(mktemp -d)"
name="ayure-pg-ci-${GITHUB_RUN_ID:-$}"
bad_name="${name}-wrong-cert"
cleanup() {
  docker rm -f "$name" >/dev/null 2>&1 || true
  docker rm -f "$bad_name" >/dev/null 2>&1 || true
  sudo rm -rf "$tmp"
}
trap cleanup EXIT
openssl req -x509 -newkey rsa:2048 -sha256 -nodes -days 1 \
  -keyout "$tmp/server.key" -out "$tmp/server.crt" \
  -subj "/CN=ayure-ci-postgres" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" >/dev/null 2>&1
# Trusted, separate certificate that must FAIL hostname validation at localhost.
openssl req -x509 -newkey rsa:2048 -sha256 -nodes -days 1 \
  -keyout "$tmp/wrong.key" -out "$tmp/wrong.crt" \
  -subj "/CN=wrong.ayure.example" -addext "subjectAltName=DNS:wrong.ayure.example" >/dev/null 2>&1
cat "$tmp/server.crt" "$tmp/wrong.crt" > "$tmp/trusted-test-certs.crt"
chmod 755 "$tmp"
chmod 644 "$tmp/server.crt" "$tmp/wrong.crt" "$tmp/trusted-test-certs.crt"
sudo chown 999:999 "$tmp/server.key" "$tmp/wrong.key"
sudo chmod 600 "$tmp/server.key" "$tmp/wrong.key"
docker run --rm --name "$name" -d \
  -e POSTGRES_PASSWORD=ayure-local-ci-admin-only \
  -e POSTGRES_DB=ayure_ci \
  -p 127.0.0.1:5432:5432 \
  -v "$tmp:/certs:ro" postgres:16 \
  -c ssl=on -c ssl_cert_file=/certs/server.crt -c ssl_key_file=/certs/server.key >/dev/null
docker run --rm --name "$bad_name" -d \
  -e POSTGRES_PASSWORD=ayure-local-ci-admin-only \
  -e POSTGRES_DB=ayure_tls_negative \
  -p 127.0.0.1:5433:5432 \
  -v "$tmp:/certs:ro" postgres:16 \
  -c ssl=on -c ssl_cert_file=/certs/wrong.crt -c ssl_key_file=/certs/wrong.key >/dev/null

ready=0
for _ in {1..40}; do
  if docker exec "$name" psql -X -tA -U postgres -d ayure_ci -c "SELECT 1" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done
if [ "$ready" != "1" ]; then
  docker logs "$name"
  echo "Disposable PostgreSQL failed to start" >&2
  exit 1
fi
# Require both containers to accept SQL before asserting TLS rejection.
bad_ready=0
for _ in {1..40}; do
  if docker exec "$bad_name" psql -X -tA -U postgres -d ayure_tls_negative -c "SELECT 1" >/dev/null 2>&1; then
    bad_ready=1
    break
  fi
  sleep 1
done
if [ "$bad_ready" != "1" ]; then
  docker logs "$bad_name"
  echo "Negative-TLS PostgreSQL failed to start" >&2
  exit 1
fi
docker exec -i "$name" psql -X -v ON_ERROR_STOP=1 -U postgres -d ayure_ci < db/postgres/0000_bootstrap.sql
docker exec "$name" psql -X -v ON_ERROR_STOP=1 -U postgres -d ayure_ci \
  -c "ALTER ROLE ayure_app PASSWORD 'ayure-local-ci-app-only'"
pgversion="$(docker exec "$name" psql -X -tA -U ayure_migrator -d ayure_ci -c 'SHOW server_version_num')"
if [ "$pgversion" -lt 160000 ]; then
  echo "PostgreSQL version is below policy minimum 16" >&2
  exit 1
fi
docker exec "$name" psql -X -v ON_ERROR_STOP=1 -U ayure_migrator -d ayure_ci \
  -c 'SELECT current_user, version(), gen_random_uuid()'
docker exec -i "$name" psql -X -v ON_ERROR_STOP=1 -U ayure_migrator -d ayure_ci < db/postgres/0001_create_ayure_leads.sql
export NODE_EXTRA_CA_CERTS="$tmp/trusted-test-certs.crt"
export AYURE_PG_TEST_DATABASE_URL="postgresql://ayure_app:ayure-local-ci-app-only@127.0.0.1:5432/ayure_ci?sslmode=disable"
# Wrong-cert endpoint is reachable and its certificate is in the trusted CI
# bundle. Only hostname checking should cause ERR_TLS_CERT_ALTNAME_INVALID.
export AYURE_PG_CI_HOSTNAME_MISMATCH_URL="postgresql://postgres:ayure-local-ci-admin-only@localhost:5433/ayure_tls_negative?sslmode=disable"
npx playwright test tests/pg-leads.integration.spec.ts --project=desktop-chromium
