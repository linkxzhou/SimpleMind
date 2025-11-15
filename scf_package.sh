#!/usr/bin/env bash
set -euo pipefail

# 生成部署包：默认输出 scf_deploy.zip，可通过第一个参数自定义
WORKDIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT="${1:-scf_deploy.zip}"

echo "[SCF] Working dir: $WORKDIR"
cd "$WORKDIR"

# 构建前端产物
if command -v yarn >/dev/null 2>&1; then
  echo "[SCF] Installing deps with yarn..."
  yarn install --frozen-lockfile
  echo "[SCF] Building..."
  yarn build
elif command -v npm >/dev/null 2>&1; then
  echo "[SCF] Installing deps with npm..."
  (npm ci || npm install)
  echo "[SCF] Building..."
  npm run build
else
  echo "[SCF] Neither yarn nor npm found. Please build manually." >&2
  exit 1
fi

# 启动脚本赋权
chmod +x "./scf_bootstrap"

# 生成 zip（包含 dist 与 scf_bootstrap；剔除无用文件）
echo "[SCF] Creating ${OUTPUT} ..."
rm -f "${OUTPUT}"
zip -r "${OUTPUT}" dist scf_bootstrap \
  -x "*/node_modules/*" \
  -x "*.DS_Store" \
  -x "dist/**/*.map"

echo "[SCF] Done -> ${OUTPUT}"
echo "[SCF] Upload this zip to SCF Custom Runtime."