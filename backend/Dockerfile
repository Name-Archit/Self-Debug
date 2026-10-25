FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN mkdir -p logs
# Render cannot mount a Docker socket. Local Docker Compose explicitly overrides
# this to docker mode, while hosted deployments get the safe demo control plane.
ENV CHAOS_MODE=simulated
EXPOSE 5000
CMD ["node", "server.js"]
