# Restaurant Service POS — Checklist pre-lanzamiento online

## Estado actual

- POS SaaS multi-restaurante operativo.
- Registro cliente online operativo.
- Trial 7 días operativo.
- Configuración completa operativa.
- POS escritorio operativo.
- POS móvil camarero operativo.
- Panel Creador operativo.
- Stripe test configurado.
- Resend configurado.
- Dominio previsto: https://restaurantservicepos.com

## Antes de publicar online

### Servidor

Elegir un VPS simple para la primera versión.

Requisitos:
- Node.js
- HTTPS
- variables .env privadas
- disco persistente
- acceso SSH
- reinicio automático del proceso

### Dominio

Configurar:
- restaurantservicepos.com
- HTTPS
- redirección HTTP a HTTPS

En producción:
APP_BASE_URL=https://restaurantservicepos.com

### Stripe

Primera fase:
- mantener STRIPE_LIVE_CONFIRMADO=NO
- probar con claves test
- crear webhook cuando haya HTTPS

Para live:
- STRIPE_SECRET_KEY=sk_live...
- STRIPE_PRICE_ID=price_live...
- STRIPE_WEBHOOK_SECRET=whsec...
- STRIPE_LIVE_CONFIRMADO=SI

No activar live hasta hacer un test controlado.

### Email

Verificar:
- EMAIL_PROVIDER=resend
- EMAIL_FROM correcto
- EMAIL_REPLY_TO correcto
- RESEND_API_KEY configurada

### Base de datos

Primera versión:
- SQLite en servidor con disco persistente
- backup diario obligatorio
- no subir database/restaurant_service.db a GitHub

Futuro:
- migrar a PostgreSQL si crece el número de clientes

### Cliente piloto

Test real:
- crear cliente
- completar datos fiscales
- crear usuarios
- crear mesas y productos
- probar PC y móvil
- enviar comandas
- cobrar mesa
- revisar caja
- crear backup
- revisar Panel Creador

## Comandos útiles

npm install
npm start
npm run check-produccion

## Decisiones pendientes

- precio final: 7,50 € o 9,99 €/mes
- hosting definitivo
- política de soporte
- backup automático
- guía rápida para clientes
