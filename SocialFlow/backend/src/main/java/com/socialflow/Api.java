package com.socialflow;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class Api {
  final JdbcTemplate db;
  final PasswordEncoder passwords;
  final JwtEncoder encoder;

  public Api(JdbcTemplate db, PasswordEncoder passwords, JwtEncoder encoder) {
    this.db = db;
    this.passwords = passwords;
    this.encoder = encoder;
  }

  static String id() {
    return UUID.randomUUID().toString();
  }

  static void require(boolean ok, int code, String message) {
    if (!ok) throw new ResponseStatusException(HttpStatus.valueOf(code), message);
  }

  Map<String, Object> one(String sql, Object... args) {
    var rows = db.queryForList(sql, args);
    require(!rows.isEmpty(), 404, "Record not found");
    return rows.get(0);
  }

  Map<String, Object> member(Jwt jwt) {
    return one("SELECT id,name,email,role FROM members WHERE id=?", jwt.getSubject());
  }

  Map<String, Object> write(Jwt jwt) {
    var m = member(jwt);
    require(!m.get("role").equals("VIEWER"), 403, "Editor or administrator access required");
    return m;
  }

  void admin(Jwt jwt) {
    require(member(jwt).get("role").equals("ADMIN"), 403, "Administrator access required");
  }

  void notice(String text) {
    db.update(
        "INSERT INTO notifications(id,message,created_at) VALUES(?,?,?)",
        id(),
        text,
        OffsetDateTime.now());
  }

  public record Login(@NotBlank @Email String email, @NotBlank @Size(max = 72) String password) {}

  public record Person(
      @NotBlank @Size(max = 80) String name,
      @Email @NotBlank @Size(max = 160) String email,
      @Size(min = 10, max = 72) @NotBlank String password,
      @Pattern(regexp = "ADMIN|EDITOR|VIEWER") @NotNull String role) {}

  public record Role(@NotNull @Pattern(regexp = "ADMIN|EDITOR|VIEWER") String role) {}

  public record Post(
      @NotBlank @Size(max = 140) String title,
      @NotBlank @Size(max = 2200) String body,
      @NotNull @Pattern(regexp = "Instagram|LinkedIn|X") String channel,
      @NotNull @Pattern(regexp = "DRAFT|SCHEDULED|QUEUED") String status,
      OffsetDateTime scheduledAt) {}

  public record Comment(@NotBlank @Size(max = 1000) String body) {}

  @GetMapping("/health")
  Map<String, String> health() {
    return Map.of("status", "UP", "publishing", "SANDBOX");
  }

  @PostMapping("/auth/login")
  Map<String, Object> login(@Valid @RequestBody Login input) {
    var rows =
        db.queryForList(
            "SELECT * FROM members WHERE email=?", input.email().toLowerCase(Locale.ROOT));
    require(
        !rows.isEmpty()
            && passwords.matches(input.password(), rows.get(0).get("password").toString()),
        401,
        "Invalid email or password");
    var m = rows.get(0);
    var now = Instant.now();
    String token =
        encoder
            .encode(
                JwtEncoderParameters.from(
                    JwsHeader.with(MacAlgorithm.HS256).build(),
                    JwtClaimsSet.builder()
                        .issuer("socialflow")
                        .subject(m.get("id").toString())
                        .issuedAt(now)
                        .expiresAt(now.plusSeconds(3600))
                        .build()))
            .getTokenValue();
    m.remove("password");
    return Map.of("token", token, "user", m);
  }

  @GetMapping("/me")
  Map<String, Object> me(@AuthenticationPrincipal Jwt j) {
    return member(j);
  }

  @GetMapping("/team")
  List<Map<String, Object>> team() {
    return db.queryForList("SELECT id,name,email,role FROM members ORDER BY name");
  }

  @PostMapping("/team")
  @Transactional
  Map<String, String> addMember(@AuthenticationPrincipal Jwt j, @Valid @RequestBody Person p) {
    admin(j);
    String id = id();
    db.update(
        "INSERT INTO members VALUES(?,?,?,?,?)",
        id,
        p.name(),
        p.email().toLowerCase(Locale.ROOT),
        passwords.encode(p.password()),
        p.role());
    notice(p.name() + " joined the team");
    return Map.of("id", id);
  }

  @PatchMapping("/team/{id}")
  void role(@AuthenticationPrincipal Jwt j, @PathVariable String id, @Valid @RequestBody Role r) {
    admin(j);
    require(!j.getSubject().equals(id), 400, "You cannot change your own role");
    require(
        db.update("UPDATE members SET role=? WHERE id=?", r.role(), id) > 0,
        404,
        "Member not found");
  }

  @GetMapping("/posts")
  List<Map<String, Object>> posts() {
    return db.queryForList(
        "SELECT p.*,m.name AS author FROM posts p JOIN members m ON m.id=p.author_id ORDER BY"
            + " p.created_at DESC");
  }

  void validate(Post p) {
    require(
        !p.status().equals("SCHEDULED")
            || (p.scheduledAt() != null && p.scheduledAt().isAfter(OffsetDateTime.now())),
        400,
        "Choose a future schedule time");
  }

  @PostMapping("/posts")
  @Transactional
  Map<String, String> create(@AuthenticationPrincipal Jwt j, @Valid @RequestBody Post p) {
    write(j);
    validate(p);
    String id = id();
    db.update(
        "INSERT INTO posts(id,title,body,channel,status,scheduled_at,created_at,author_id)"
            + " VALUES(?,?,?,?,?,?,?,?)",
        id,
        p.title(),
        p.body(),
        p.channel(),
        p.status(),
        p.status().equals("SCHEDULED") ? p.scheduledAt() : null,
        OffsetDateTime.now(),
        j.getSubject());
    notice("New post: " + p.title());
    return Map.of("id", id);
  }

  @PutMapping("/posts/{id}")
  @Transactional
  void update(@AuthenticationPrincipal Jwt j, @PathVariable String id, @Valid @RequestBody Post p) {
    write(j);
    validate(p);
    var old = one("SELECT * FROM posts WHERE id=? FOR UPDATE", id);
    require(
        List.of("DRAFT", "SCHEDULED").contains(old.get("status")),
        409,
        "Queued or published posts cannot be edited");
    db.update(
        "UPDATE posts SET title=?,body=?,channel=?,status=?,scheduled_at=? WHERE id=?",
        p.title(),
        p.body(),
        p.channel(),
        p.status(),
        p.status().equals("SCHEDULED") ? p.scheduledAt() : null,
        id);
  }

  @DeleteMapping("/posts/{id}")
  @Transactional
  void delete(@AuthenticationPrincipal Jwt j, @PathVariable String id) {
    write(j);
    var old = one("SELECT * FROM posts WHERE id=? FOR UPDATE", id);
    require(!old.get("status").equals("QUEUED"), 409, "Wait for publishing before deleting");
    db.update("DELETE FROM posts WHERE id=?", id);
  }

  @GetMapping("/posts/{id}/comments")
  List<Map<String, Object>> comments(@PathVariable String id) {
    one("SELECT id FROM posts WHERE id=?", id);
    return db.queryForList(
        "SELECT c.*,m.name AS author FROM comments c JOIN members m ON m.id=c.author_id WHERE"
            + " post_id=? ORDER BY created_at",
        id);
  }

  @PostMapping("/posts/{id}/comments")
  @Transactional
  void comment(
      @AuthenticationPrincipal Jwt j, @PathVariable String id, @Valid @RequestBody Comment c) {
    write(j);
    one("SELECT id FROM posts WHERE id=?", id);
    db.update(
        "INSERT INTO comments VALUES(?,?,?,?,?)",
        id(),
        id,
        j.getSubject(),
        c.body(),
        OffsetDateTime.now());
    notice(member(j).get("name") + " commented on a post");
  }

  @GetMapping("/notifications")
  List<Map<String, Object>> notifications(@AuthenticationPrincipal Jwt j) {
    return db.queryForList(
        "SELECT n.*,CASE WHEN r.member_id IS NULL THEN FALSE ELSE TRUE END AS seen FROM"
            + " notifications n LEFT JOIN notification_reads r ON n.id=r.notification_id AND"
            + " r.member_id=? ORDER BY n.created_at DESC LIMIT 50",
        j.getSubject());
  }

  @PostMapping("/notifications/read")
  void read(@AuthenticationPrincipal Jwt j) {
    db.update(
        "INSERT INTO notification_reads(notification_id,member_id) SELECT id,? FROM notifications"
            + " WHERE id NOT IN (SELECT notification_id FROM notification_reads WHERE member_id=?)"
            + " ON CONFLICT DO NOTHING",
        j.getSubject(),
        j.getSubject());
  }

  @GetMapping("/analytics")
  Map<String, Object> analytics(@RequestParam(defaultValue = "30") int days) {
    require(days >= 1 && days <= 365, 400, "Days must be between 1 and 365");
    var since = OffsetDateTime.now().minusDays(days);
    return Map.of(
        "summary",
        one(
            "SELECT COUNT(*) AS posts,COALESCE(SUM(impressions),0) AS"
                + " impressions,COALESCE(SUM(engagements),0) AS engagements FROM posts WHERE"
                + " status='PUBLISHED' AND published_at>=?",
            since),
        "daily",
        db.queryForList(
            "SELECT CAST(published_at AS DATE) AS \"day\",SUM(impressions) AS"
                + " impressions,SUM(engagements) AS engagements FROM posts WHERE published_at>=?"
                + " GROUP BY CAST(published_at AS DATE) ORDER BY \"day\"",
            since),
        "channels",
        db.queryForList(
            "SELECT channel,SUM(impressions) AS impressions,SUM(engagements) AS engagements FROM"
                + " posts WHERE published_at>=? GROUP BY channel",
            since));
  }
}
