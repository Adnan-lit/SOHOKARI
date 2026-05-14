package com.adnan.sohokari_backend.config;


import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.IndexOptions;
import com.mongodb.client.model.Indexes;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@Configuration
@EnableMongoAuditing
@RequiredArgsConstructor
public class MongoConfig {

    private final MongoClient mongoClient;

    @Value("${spring.data.mongodb.database:sohokari}")
    private String dbName;

    @PostConstruct
    public void createIndexes() {
        MongoDatabase db = mongoClient.getDatabase(dbName);

        // ── providers collection ──────────────────────────────────────────
        MongoCollection<Document> providers = db.getCollection("providers");

        // 2dsphere index for location queries (nearby search)
        providers.createIndex(
                Indexes.geo2dsphere("location"),
                new IndexOptions().name("location_2dsphere")
        );

        // Text index for smart search (search by name, skills, bio, category)
        providers.createIndex(
                Indexes.compoundIndex(
                        new Document("serviceCategory", "text"),
                        new Document("skills",          "text"),
                        new Document("bio",             "text"),
                        new Document("serviceArea",     "text")
                ),
                new IndexOptions().name("provider_text_search")
        );

        // ── users collection ──────────────────────────────────────────────
        MongoCollection<Document> users = db.getCollection("users");
        providers.createIndex(
                Indexes.ascending("userId"),
                new IndexOptions().unique(true).name("userId_unique")
        );


        // ── bookings collection ───────────────────────────────────────────────
        MongoCollection<Document> bookings = db.getCollection("bookings");

        // Index for customer's booking history
        bookings.createIndex(
                Indexes.ascending("customerId"),
                new IndexOptions().name("booking_customerId")
        );

        // Index for provider's booking history
        bookings.createIndex(
                Indexes.ascending("providerId"),
                new IndexOptions().name("booking_providerId")
        );

        // Compound index to prevent double booking
        bookings.createIndex(
                Indexes.compoundIndex(
                        Indexes.ascending("providerId"),
                        Indexes.ascending("scheduledDate"),
                        Indexes.ascending("scheduledTime")
                ),
                new IndexOptions().name("booking_slot_index")
        );


        // ── reviews collection ────────────────────────────────────────────────
        MongoCollection<Document> reviews = db.getCollection("reviews");

        // Unique index: one review per booking
        reviews.createIndex(
                Indexes.ascending("bookingId"),
                new IndexOptions().unique(true).name("review_bookingId_unique")
        );

        // Index for fetching provider's reviews
        reviews.createIndex(
                Indexes.ascending("providerId"),
                new IndexOptions().name("review_providerId")
        );
    }
}