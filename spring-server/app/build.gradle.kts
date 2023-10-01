plugins {
    // Apply the application plugin to add support for building a CLI application in Java.
    application
    id("org.springframework.boot") version "3.1.3"
    id("io.freefair.lombok") version "8.3"
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("com.google.guava:guava:31.1-jre")
    implementation("com.google.api-client:google-api-client:1.34.1")
    implementation("com.google.oauth-client:google-oauth-client:1.34.1")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa:3.1.3")
	implementation("org.springframework.boot:spring-boot-starter-web:3.1.3")
    implementation("org.springframework.boot:spring-boot-starter-security:3.1.3")

    implementation("org.postgresql:postgresql:42.6.0")
    implementation("org.flywaydb:flyway-core:9.22.1")

    testImplementation("org.junit.jupiter:junit-jupiter:5.9.1")
    testImplementation("org.springframework.boot:spring-boot-starter-test:3.1.3")
}

application {
    // Define the main class for the application.
    mainClass.set("tournament.app.App")
}

tasks.named<Test>("test") {
    // Use JUnit Platform for unit tests.
    useJUnitPlatform()
}
