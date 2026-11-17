
# ==========================================
# STAGE 1: BUILD THE APPLICATION
# ==========================================

# Use Maven and Java 21 to build the app
FROM maven:3.9-eclipse-temurin-21 AS builder

# Set the folder where we will work
WORKDIR /home/app

# Copy the pom.xml file into the container
COPY ./pom.xml .

# Copy the source code into the container
COPY ./src ./src

# Build the app and create a JAR file
RUN mvn clean package


# ==========================================
# STAGE 2: RUN THE APPLICATION
# ==========================================

# Use Java 21 to run the app (no Maven needed)
FROM eclipse-temurin:21-jre

# Set the folder where the app will run
WORKDIR /app

# Copy the JAR from stage 1 and name it app.jar
# This assumes there is only one matching JAR
COPY --from=builder /home/app/target/*.jar ./app.jar

# Create a non-root user and group. Also change ownership of files and subdirectories inside /app, but not /app itself
RUN groupadd -g 10001 javagroup \
    && useradd -u 10001 -g javagroup javauser \
    && chown -R javauser:javagroup /app/*

# Switch from root to non-root user
USER javauser

# The app uses port 8080
EXPOSE 8080

# Start the application
CMD ["java", "-jar", "app.jar"]
