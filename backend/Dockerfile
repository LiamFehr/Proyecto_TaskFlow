# Production Dockerfile (Uses pre-compiled JAR)
FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app
# Expects the JAR to be in target/ folder relative to build context
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
