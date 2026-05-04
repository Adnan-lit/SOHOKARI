package com.adnan.sohokari_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class SohokariBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(SohokariBackendApplication.class, args);
    }

}
