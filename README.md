This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Локальная разработка

Для запуска в режиме разработки:

```bash
npm run dev
# или
yarn dev
# или
pnpm dev
# или
bun dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере для просмотра результата.

### Настройка переменных окружения

Создайте файл `.env` в корне проекта со следующими переменными:

```
# Database connection
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vkr?schema=public

# Next Auth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

### Запуск с использованием Docker

Проект поддерживает запуск через Docker Compose:

```bash
# Сборка образов
docker-compose build

# Запуск контейнеров в фоновом режиме
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка контейнеров
docker-compose down
```

### База данных

Проект использует PostgreSQL через Prisma ORM. При запуске через Docker, база данных создается автоматически.

Для применения миграций:

```bash
# Локально
npx prisma migrate dev

# В запущенном Docker-контейнере
docker-compose exec app npx prisma migrate deploy
```

## Структура проекта

- `app/` - исходный код React компонентов и страниц (Next.js App Router)
- `components/` - переиспользуемые UI компоненты
- `lib/` - вспомогательные функции и утилиты
- `prisma/` - схема базы данных и миграции
- `public/` - статические ресурсы
- `styles/` - CSS стили

## Дополнительные ресурсы

- [Next.js Documentation](https://nextjs.org/docs) - документация Next.js
- [Prisma Documentation](https://www.prisma.io/docs) - документация Prisma
- [Docker Documentation](https://docs.docker.com) - документация Docker

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
