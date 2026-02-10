set ignore-comments := true

PROJECT_NAME := shell("basename $1", justfile_directory())
DOCKER_COMPOSE := "docker compose --file ./docker/compose.yaml --env-file .env --project-name " + PROJECT_NAME
export MY_UID := `id -u`
export MY_GID := `id -g`
export PORT := "8888"

run:
    bun run --watch --no-clear-screen index.ts | bunx pino-pretty --translateTime "SYS:standard"

up:
    {{ DOCKER_COMPOSE }} up --build --remove-orphans --detach

logs:
    {{ DOCKER_COMPOSE }} logs

down:
    {{ DOCKER_COMPOSE }} down
