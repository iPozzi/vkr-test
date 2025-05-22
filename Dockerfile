FROM node:20-alpine AS base

# Установка зависимостей для Prisma и bcrypt
RUN apk add --no-cache python3 make g++ openssl-dev

# Создание директории приложения
WORKDIR /app

# Только копируем и устанавливаем зависимости для кэширования
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Этап сборки
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Генерация Prisma клиента и сборка приложения
RUN npx prisma generate
RUN npm run build

# Рабочий этап
FROM base AS runner
ENV NODE_ENV production

# Добавляем пользователя с ограниченными правами для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Копируем необходимые файлы из этапа сборки
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Устанавливаем переменные среды
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["node", "server.js"] 