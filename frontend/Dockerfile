# Build Stage
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm ci

# Copy source code
COPY . .

# Environment variables for build time
ARG VITE_RAZORPAY_KEY
ENV VITE_RAZORPAY_KEY=$VITE_RAZORPAY_KEY

RUN npm run build

# Production Stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
