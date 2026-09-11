package com.example.postapi.controller;

import com.example.postapi.dto.ApiResponse;
import com.example.postapi.dto.PostRequestDTO;
import com.example.postapi.dto.PostResponseDTO;
import com.example.postapi.service.PostService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PostResponseDTO>> create(@Valid @RequestBody PostRequestDTO request) {
        PostResponseDTO created = postService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Post created successfully", created));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponseDTO>> getById(@PathVariable Long id) {
        PostResponseDTO post = postService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Post retrieved successfully", post));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PostResponseDTO>>> getAll() {
        List<PostResponseDTO> posts = postService.getAll();
        return ResponseEntity.ok(ApiResponse.success("Posts retrieved successfully", posts));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponseDTO>> update(@PathVariable Long id,
                                                                 @Valid @RequestBody PostRequestDTO request) {
        PostResponseDTO updated = postService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Post updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        postService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Post deleted successfully", null));
    }
}
