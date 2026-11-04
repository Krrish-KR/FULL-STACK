package com.socialflow;

import java.time.OffsetDateTime;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class Seed implements CommandLineRunner {
  final Api api;
  final org.springframework.jdbc.core.JdbcTemplate db;
  final org.springframework.security.crypto.password.PasswordEncoder passwords;
  final boolean enabled;
  final String password;

  public Seed(
      Api api,
      org.springframework.jdbc.core.JdbcTemplate db,
      org.springframework.security.crypto.password.PasswordEncoder passwords,
      @Value("${app.seed}") boolean enabled,
      @Value("${app.demo-password}") String password) {
    this.api = api;
    this.db = db;
    this.passwords = passwords;
    this.enabled = enabled;
    this.password = password;
  }

  @Override
  @Transactional
  public void run(String... args) {
    if (!enabled || db.queryForObject("SELECT COUNT(*) FROM members", Integer.class) > 0) return;
    String owner = Api.id();
    db.update(
        "INSERT INTO members VALUES(?,?,?,?,?)",
        owner,
        "Krrish Kumar",
        "admin@socialflow.local",
        passwords.encode(password),
        "ADMIN");
    for (String role : new String[] {"EDITOR", "VIEWER"})
      db.update(
          "INSERT INTO members VALUES(?,?,?,?,?)",
          Api.id(),
          role.equals("EDITOR") ? "Aarav Sharma" : "Maya Kapoor",
          role.toLowerCase() + "@socialflow.local",
          passwords.encode(password),
          role);
    String[] titles = {
      "A little behind the scenes",
      "Build something worth sharing",
      "Meet the people behind the pixels",
      "Your next big idea starts here",
      "Five ways to work smarter",
      "A fresh perspective for your feed"
    };
    String[] channels = {"Instagram", "LinkedIn", "X"};
    for (int i = 0; i < 24; i++) {
      var date = OffsetDateTime.now().minusDays(24 - i);
      db.update(
          "INSERT INTO"
              + " posts(id,title,body,channel,status,created_at,published_at,author_id,impressions,engagements)"
              + " VALUES(?,?,?,?,?,?,?,?,?,?)",
          Api.id(),
          titles[i % 6],
          "Great work starts with curiosity. Here is a glimpse of what our team has been building"
              + " this week. What are you creating? #SocialFlow #BuildTogether",
          channels[i % 3],
          "PUBLISHED",
          date,
          date,
          owner,
          1200 + i * 137,
          45 + i * 9);
    }
    for (int i = 0; i < 5; i++)
      db.update(
          "INSERT INTO posts(id,title,body,channel,status,scheduled_at,created_at,author_id)"
              + " VALUES(?,?,?,?,?,?,?,?)",
          Api.id(),
          titles[i],
          "Something good is on the way. Join the conversation and share your ideas with our"
              + " community. #CreateTogether",
          channels[i % 3],
          i < 3 ? "SCHEDULED" : "DRAFT",
          i < 3 ? OffsetDateTime.now().plusDays(i + 1) : null,
          OffsetDateTime.now(),
          owner);
    api.notice("Welcome to SocialFlow. Your sandbox workspace is ready.");
  }
}
