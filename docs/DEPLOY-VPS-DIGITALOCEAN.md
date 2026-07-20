# Restaurant Service POS — Deploy VPS paso a paso

## Objetivo

Publicar Restaurant Service POS online con:

- VPS Ubuntu
- Node.js
- SQLite con disco persistente
- PM2 para mantener la app encendida
- Nginx como proxy
- HTTPS con Certbot / Let's Encrypt
- Dominio: restaurantservicepos.com

## Arquitectura

Cliente navegador
↓
https://restaurantservicepos.com
↓
Nginx
↓
Node.js en puerto 3000
↓
SQLite database/restaurant_service.db

## Fase 1 — Crear servidor

Proveedor recomendado para primera versión:

DigitalOcean Droplet básico.

Configuración inicial recomendada:

- Ubuntu LTS
- Región cercana a España o Europa
- Plan básico económico
- Acceso SSH
- Disco persistente

## Fase 2 — Preparar servidor

Conectarse por SSH al servidor y ejecutar:

apt update
apt upgrade -y
apt install -y git curl nginx ufw sqlite3

Instalar Node.js LTS:

curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

Instalar PM2:

npm install -g pm2

## Fase 3 — Descargar proyecto

cd /var/www
git clone git@github.com:alessio84force/restaurant-service-pos.git
cd restaurant-service-pos
npm install

## Fase 4 — Crear .env producción

cp .env.production.example .env
nano .env

Valores importantes:

NODE_ENV=production
PORT=3000
APP_BASE_URL=https://restaurantservicepos.com

STRIPE_LIVE_CONFIRMADO=NO

No activar Stripe LIVE hasta tener HTTPS y webhook funcionando.

## Fase 5 — Preparar database

En primera versión se puede usar SQLite.

Nunca subir database/restaurant_service.db a GitHub.

Antes de cliente real:

npm run check-produccion

## Fase 6 — Arrancar con PM2

cd /var/www/restaurant-service-pos
pm2 start server/server.js --name restaurant-service-pos
pm2 save
pm2 startup

Después de pm2 startup, copiar y ejecutar el comando que PM2 muestre.

## Fase 7 — Configurar Nginx

Crear archivo:

nano /etc/nginx/sites-available/restaurantservicepos.com

Contenido base:

server {
    listen 80;
    server_name restaurantservicepos.com www.restaurantservicepos.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

Activar:

ln -s /etc/nginx/sites-available/restaurantservicepos.com /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

## Fase 8 — Dominio

Crear registros DNS:

A restaurantservicepos.com -> IP del VPS
A www.restaurantservicepos.com -> IP del VPS

Esperar propagación DNS.

## Fase 9 — HTTPS

Cuando el dominio apunte al VPS:

apt install -y certbot python3-certbot-nginx
certbot --nginx -d restaurantservicepos.com -d www.restaurantservicepos.com

Comprobar renovación:

certbot renew --dry-run

## Fase 10 — Stripe webhook

Cuando HTTPS funcione:

1. Entrar en Stripe.
2. Crear webhook endpoint:
   https://restaurantservicepos.com/stripe/webhook
3. Copiar STRIPE_WEBHOOK_SECRET.
4. Pegar en .env.
5. Reiniciar PM2:

pm2 restart restaurant-service-pos

## Fase 11 — Test final

Abrir:

https://restaurantservicepos.com/login
https://restaurantservicepos.com/registro
https://restaurantservicepos.com/configuracion
https://restaurantservicepos.com/creador

Probar:

- crear cliente trial
- configurar restaurante
- crear mesas
- crear productos
- abrir mesa
- enviar comandas
- cobrar
- revisar caja
- crear backup
- revisar Panel Creador

## Fase 12 — Comandos útiles

Ver estado:

pm2 status

Ver logs:

pm2 logs restaurant-service-pos

Reiniciar:

pm2 restart restaurant-service-pos

Actualizar desde GitHub:

cd /var/www/restaurant-service-pos
git pull origin master
npm install
pm2 restart restaurant-service-pos

Backup rápido:

cp database/restaurant_service.db database/restaurant_service_backup_$(date +%Y%m%d-%H%M%S).db
