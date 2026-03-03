FROM ubuntu:22.04

# تثبيت المكتبات الأساسية
RUN apt-get update && \
    apt-get install -y libatomic1 curl build-essential

# تثبيت Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# نسخ المشروع
WORKDIR /app
COPY . .

# تثبيت حزم npm
RUN npm install

# أمر تشغيل المشروع
CMD ["npm", "start"]