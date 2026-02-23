# Load Testing

Load tests for Clean Shop using [k6](https://k6.io/).

## Install k6

```bash
# Ubuntu/Debian
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D68
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# macOS
brew install k6

# Docker
docker run --rm -i grafana/k6 run - <load-tests/smoke.js
```

## Available tests

| Script | Purpose | VUs | Duration |
|--------|---------|-----|----------|
| `smoke.js` | Quick health check | 1 | 10s |
| `load.js` | Normal traffic simulation | 20-50 | ~4min |
| `stress.js` | Find breaking point | 50-300 | ~8min |

## Usage

```bash
# Smoke test (fast check)
k6 run load-tests/smoke.js

# Load test (normal traffic)
k6 run load-tests/load.js

# Stress test (find limits)
k6 run load-tests/stress.js

# Custom base URL
k6 run -e BASE_URL=https://staging.cleanshop.ua load-tests/load.js

# With JSON output
k6 run --out json=results.json load-tests/load.js
```

## Thresholds

- **Smoke**: <1% errors, p95 < 2s
- **Load**: <5% errors, p95 < 3s, p99 < 5s
- **Stress**: <10% errors, p95 < 5s
