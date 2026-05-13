package com.adnan.sohokari_backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import jakarta.annotation.PostConstruct;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Configuration
@ConditionalOnProperty(prefix = "app.firebase", name = "enabled", havingValue = "true")
public class FirebaseConfig {

    @Value("${app.firebase.credentials-path:}")
    private String credentialsPath;

    @Value("${app.firebase.credentials-json:}")
    private String credentialsJson;

    private final ResourceLoader resourceLoader;

    public FirebaseConfig(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    @PostConstruct
    public void initialize() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {

            InputStream serviceAccount;

            // Render: use JSON string from environment variable
            if (credentialsJson != null && !credentialsJson.isBlank()) {
                serviceAccount = new ByteArrayInputStream(
                        credentialsJson.getBytes(StandardCharsets.UTF_8)
                );
            }
            // Local: use file path from classpath or filesystem
            else if (credentialsPath != null && !credentialsPath.isBlank()) {
                Resource resource;
                if (credentialsPath.startsWith("classpath:") || credentialsPath.startsWith("file:")) {
                    resource = resourceLoader.getResource(credentialsPath);
                } else {
                    Resource classpathCandidate = resourceLoader.getResource("classpath:" + credentialsPath);
                    resource = classpathCandidate.exists()
                            ? classpathCandidate
                            : resourceLoader.getResource("file:" + credentialsPath);
                }
                serviceAccount = resource.getInputStream();
            } else {
                throw new IllegalStateException(
                        "Firebase credentials are missing. Set app.firebase.credentials-json or app.firebase.credentials-path."
                );
            }

            try (InputStream account = serviceAccount) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(account))
                        .build();

                FirebaseApp.initializeApp(options);
            }
        }
    }
}