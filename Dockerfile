FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html
RUN apk add --no-cache nodejs && node --check /usr/share/nginx/html/cmnt-platform.js && node --check /usr/share/nginx/html/cmnt-scientific.js && node --check /usr/share/nginx/html/cmnt-observatory.js && awk '/^<script>$/{n++; if(n==1) p=1; next} /^<\\/script>$/{if(p) exit} p{print}' /usr/share/nginx/html/index.html > /tmp/cmnt-inline.js && node --check /tmp/cmnt-inline.js && apk del nodejs
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1
