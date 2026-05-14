# ── Stage 1: Build ────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-21 AS builder

WORKDIR /app

# Copy pom first — caches dependencies layer
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build jar
COPY src ./src
RUN mvn clean package -DskipTests -B

# ── Stage 2: Run ──────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Non-root user for security
RUN addgroup -S sohokari && adduser -S sohokari -G sohokari

COPY --from=builder /app/target/*.jar app.jar

RUN chown -R sohokari:sohokari /app
USER sohokari

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]