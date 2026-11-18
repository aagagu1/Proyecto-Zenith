FROM php:8.3.13-apache
RUN apt-get update && apt-get install -y libssl-dev \
    && docker-php-ext-install pdo_mysql \
    && pecl install mongodb-1.19.3 \
    && docker-php-ext-enable mongodb \
    && a2enmod rewrite
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf