package com.socialflow;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.*;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class WorkflowTest {
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired org.springframework.jdbc.core.JdbcTemplate db;
  @Autowired Publishing publishing;
  @Autowired Seed seed;
  @MockitoBean KafkaTemplate<String, String> kafka;

  String token(String role) throws Exception {
    return json.readTree(
            mvc.perform(
                    post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(
                            json.writeValueAsString(
                                Map.of(
                                    "email",
                                    role + "@socialflow.local",
                                    "password",
                                    "SocialFlow123!"))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString())
        .get("token")
        .asText();
  }

  ResultActions request(String method, String path, String token, Object body) throws Exception {
    var r =
        org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request(
                org.springframework.http.HttpMethod.valueOf(method), "/api" + path)
            .contentType(MediaType.APPLICATION_JSON);
    if (token != null) r.header("Authorization", "Bearer " + token);
    if (body != null) r.content(json.writeValueAsString(body));
    return mvc.perform(r);
  }

  Map<String, Object> postBody(String status) {
    var b = new HashMap<String, Object>();
    b.put("title", "Integration story");
    b.put("body", "A real API workflow");
    b.put("channel", "LinkedIn");
    b.put("status", status);
    b.put("scheduledAt", OffsetDateTime.now().plusDays(1).toString());
    return b;
  }

  String create(String token, String state) throws Exception {
    return json.readTree(
            request("POST", "/posts", token, postBody(state))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString())
        .get("id")
        .asText();
  }

  @Test
  @Order(1)
  void loginAndReadWorkflows() throws Exception {
    request("GET", "/health", null, null).andExpect(status().isOk());
    request("GET", "/posts", null, null).andExpect(status().isUnauthorized());
    request(
            "POST",
            "/auth/login",
            null,
            Map.of("email", "admin@socialflow.local", "password", "wrong"))
        .andExpect(status().isUnauthorized());
    request(
            "POST",
            "/auth/login",
            null,
            Map.of("email", "missing@example.com", "password", "wrong"))
        .andExpect(status().isUnauthorized());
    String t = token("admin");
    for (String path : List.of("/me", "/team", "/posts", "/notifications", "/analytics?days=30"))
      request("GET", path, t, null).andExpect(status().isOk());
    request("GET", "/analytics?days=0", t, null).andExpect(status().isBadRequest());
    request("GET", "/analytics?days=366", t, null).andExpect(status().isBadRequest());
    request("POST", "/notifications/read", t, null).andExpect(status().isOk());
    request("POST", "/notifications/read", t, null).andExpect(status().isOk());
    request("GET", "/notifications", t, null).andExpect(jsonPath("$[0].seen").value(true));
    request("GET", "/notifications", token("viewer"), null)
        .andExpect(jsonPath("$[0].seen").value(false));
    seed.run();
    assertThrows(IllegalArgumentException.class, () -> new Security().key("short"));
    assertEquals(3, new Publishing.Scheduling().topic().numPartitions());
  }

  @Test
  @Order(2)
  void createEditCommentAndDelete() throws Exception {
    String t = token("editor"), id = create(t, "DRAFT");
    var body = postBody("SCHEDULED");
    request("PUT", "/posts/" + id, t, body).andExpect(status().isOk());
    request("GET", "/posts/" + id + "/comments", t, null)
        .andExpect(jsonPath("$.length()").value(0));
    request("POST", "/posts/" + id + "/comments", t, Map.of("body", "Looks great!"))
        .andExpect(status().isOk());
    request("GET", "/posts/" + id + "/comments", t, null)
        .andExpect(jsonPath("$[0].body").value("Looks great!"));
    request("PUT", "/posts/" + id, t, postBody("DRAFT")).andExpect(status().isOk());
    request("DELETE", "/posts/" + id, t, null).andExpect(status().isOk());
    request("DELETE", "/posts/" + id, t, null).andExpect(status().isNotFound());
    request("GET", "/posts/missing/comments", t, null).andExpect(status().isNotFound());
  }

  @Test
  @Order(3)
  void permissionsAndMemberLifecycle() throws Exception {
    String a = token("admin"), v = token("viewer"), e = token("editor");
    String id = create(a, "DRAFT");
    request("POST", "/posts", v, postBody("DRAFT")).andExpect(status().isForbidden());
    request("PUT", "/posts/" + id, v, postBody("DRAFT")).andExpect(status().isForbidden());
    request("DELETE", "/posts/" + id, v, null).andExpect(status().isForbidden());
    request("POST", "/posts/" + id + "/comments", v, Map.of("body", "no"))
        .andExpect(status().isForbidden());
    var p =
        Map.of(
            "name",
            "New Teammate",
            "email",
            "new@example.com",
            "password",
            "StrongPass123!",
            "role",
            "EDITOR");
    request("POST", "/team", e, p).andExpect(status().isForbidden());
    String newId =
        json.readTree(
                request("POST", "/team", a, p)
                    .andExpect(status().isOk())
                    .andReturn()
                    .getResponse()
                    .getContentAsString())
            .get("id")
            .asText();
    request("POST", "/team", a, p).andExpect(status().isConflict());
    request("PATCH", "/team/" + newId, a, Map.of("role", "VIEWER")).andExpect(status().isOk());
    request("PATCH", "/team/" + newId, e, Map.of("role", "ADMIN"))
        .andExpect(status().isForbidden());
    String own = db.queryForObject("SELECT id FROM members WHERE role='ADMIN'", String.class);
    request("PATCH", "/team/" + own, a, Map.of("role", "VIEWER"))
        .andExpect(status().isBadRequest());
    request("PATCH", "/team/missing", a, Map.of("role", "VIEWER")).andExpect(status().isNotFound());
    request("PATCH", "/team/" + newId, a, Map.of("role", "ROOT"))
        .andExpect(status().isBadRequest());
  }

  @Test
  @Order(4)
  void validationAndQueueSemantics() throws Exception {
    String t = token("admin");
    var b = postBody("SCHEDULED");
    b.put("scheduledAt", OffsetDateTime.now().minusDays(1).toString());
    request("POST", "/posts", t, b).andExpect(status().isBadRequest());
    b.put("scheduledAt", null);
    request("POST", "/posts", t, b).andExpect(status().isBadRequest());
    b = postBody("DRAFT");
    b.put("title", "");
    request("POST", "/posts", t, b).andExpect(status().isBadRequest());
    b.put("title", "ok");
    b.put("channel", "Unknown");
    request("POST", "/posts", t, b).andExpect(status().isBadRequest());
    mvc.perform(
            post("/api/posts")
                .header("Authorization", "Bearer " + t)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{broken"))
        .andExpect(status().isBadRequest());
    String id = create(t, "QUEUED");
    request("PUT", "/posts/" + id, t, postBody("DRAFT")).andExpect(status().isConflict());
    request("DELETE", "/posts/" + id, t, null).andExpect(status().isConflict());
    publishing.publish(id);
    publishing.publish(id);
    publishing.publish("missing");
    assertEquals(
        "PUBLISHED", db.queryForObject("SELECT status FROM posts WHERE id=?", String.class, id));
    assertEquals(
        1,
        db.queryForObject(
            "SELECT COUNT(*) FROM notifications WHERE message='Published in sandbox: Integration"
                + " story'",
            Integer.class));
  }

  @Test
  @Order(5)
  void schedulerRetriesAndConsumerIsIdempotent() throws Exception {
    String t = token("admin"), id = create(t, "SCHEDULED");
    db.update(
        "UPDATE posts SET scheduled_at=? WHERE id=?", OffsetDateTime.now().minusMinutes(1), id);
    when(kafka.send(anyString(), anyString(), anyString()))
        .thenReturn(CompletableFuture.failedFuture(new RuntimeException("Broker unavailable")));
    publishing.dispatch();
    assertEquals(
        "QUEUED", db.queryForObject("SELECT status FROM posts WHERE id=?", String.class, id));
    when(kafka.send(anyString(), anyString(), anyString()))
        .thenReturn(CompletableFuture.completedFuture(null));
    publishing.dispatch();
    verify(kafka, atLeastOnce()).send("socialflow.publish", id, id);
    publishing.publish(id);
    int notices = db.queryForObject("SELECT COUNT(*) FROM notifications", Integer.class);
    publishing.publish(id);
    assertEquals(notices, db.queryForObject("SELECT COUNT(*) FROM notifications", Integer.class));
    assertEquals(
        "PUBLISHED", db.queryForObject("SELECT status FROM posts WHERE id=?", String.class, id));
  }
}
