package com.example.postapi.exception;

public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public static ResourceNotFoundException forId(String resource, Long id) {
        return new ResourceNotFoundException(resource + " not found with id: " + id);
    }
}
