FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html
RUN apk add --no-cache nodejs && node --check /usr/share/nginx/html/cmnt-platform.js && node --check /usr/share/nginx/html/cmnt-scientific.js && node --check /usr/share/nginx/html/cmnt-observatory.js && node --check /usr/share/nginx/html/cmnt-inline-validation.js && apk del nodejs
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1
