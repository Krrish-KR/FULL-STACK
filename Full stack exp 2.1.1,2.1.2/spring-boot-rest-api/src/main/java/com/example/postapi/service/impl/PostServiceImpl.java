package com.example.postapi.service.impl;

import com.example.postapi.dto.PostRequestDTO;
import com.example.postapi.dto.PostResponseDTO;
import com.example.postapi.entity.Post;
import com.example.postapi.exception.ResourceNotFoundException;
import com.example.postapi.repository.PostRepository;
import com.example.postapi.service.PostService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PostServiceImpl implements PostService {

    private static final Logger log = LoggerFactory.getLogger(PostServiceImpl.class);

    private final PostRepository postRepository;

    public PostServiceImpl(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    @Override
    public PostResponseDTO create(PostRequestDTO request) {
        Post post = new Post();
        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setScheduledAt(request.getScheduledAt());
        post.setStatus(request.getStatus() != null ? request.getStatus() : Post.Status.DRAFT);

        Post saved = postRepository.save(post);
        log.info("Created post with id={}", saved.getId());
        return PostResponseDTO.fromEntity(saved);
    }

    @Override
    public PostResponseDTO getById(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.forId("Post", id));
        return PostResponseDTO.fromEntity(post);
    }

    @Override
    public List<PostResponseDTO> getAll() {
        return postRepository.findAll().stream()
                .map(PostResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public PostResponseDTO update(Long id, PostRequestDTO request) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.forId("Post", id));

        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setScheduledAt(request.getScheduledAt());
        if (request.getStatus() != null) {
            post.setStatus(request.getStatus());
        }

        Post updated = postRepository.save(post);
        log.info("Updated post with id={}", updated.getId());
        return PostResponseDTO.fromEntity(updated);
    }

    @Override
    public void delete(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.forId("Post", id));
        postRepository.delete(post);
        log.info("Deleted post with id={}", id);
    }
}
