package com.example.postapi.service;

import com.example.postapi.dto.PostRequestDTO;
import com.example.postapi.dto.PostResponseDTO;

import java.util.List;

public interface PostService {

    PostResponseDTO create(PostRequestDTO request);

    PostResponseDTO getById(Long id);

    List<PostResponseDTO> getAll();

    PostResponseDTO update(Long id, PostRequestDTO request);

    void delete(Long id);
}
