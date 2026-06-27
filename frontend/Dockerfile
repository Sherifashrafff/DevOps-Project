FROM nginx:1.27-alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY public/ /usr/share/nginx/html/
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 8080
