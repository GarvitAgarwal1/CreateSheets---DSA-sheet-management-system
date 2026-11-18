package com.iqms.backend.config;

import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

@Component
public class MongoStartupVerifier implements ApplicationRunner {

  private static final Logger LOG = LoggerFactory.getLogger(MongoStartupVerifier.class);

  private final MongoTemplate mongoTemplate;
  private final boolean startupPingEnabled;

  public MongoStartupVerifier(
      MongoTemplate mongoTemplate,
      @Value("${app.mongo.startup-ping-enabled:true}") boolean startupPingEnabled) {
    this.mongoTemplate = mongoTemplate;
    this.startupPingEnabled = startupPingEnabled;
  }

  @Override
  public void run(ApplicationArguments args) {
    if (!startupPingEnabled) {
      LOG.info("MongoDB startup ping is disabled (app.mongo.startup-ping-enabled=false).");
      return;
    }

    Document pingResult =
        mongoTemplate.getDb().runCommand(new Document("ping", 1));

    Object okValue = pingResult.get("ok");
    String dbName = mongoTemplate.getDb().getName();
    LOG.info("MongoDB startup ping succeeded for database '{}' (ok={}).", dbName, okValue);
  }
}
