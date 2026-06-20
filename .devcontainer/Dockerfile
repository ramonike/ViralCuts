FROM mcr.microsoft.com/devcontainers/javascript-node:20-bookworm

RUN curl -fsSL https://bun.sh/install | bash && \
    mv /root/.bun/bin/bun /usr/local/bin/bun && \
    chmod +x /usr/local/bin/bun

RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 3000 5173

WORKDIR /workspace
