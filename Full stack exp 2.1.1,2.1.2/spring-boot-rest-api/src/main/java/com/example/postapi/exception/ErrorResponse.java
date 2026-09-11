package com.example.postapi.exception;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Standardized structure returned for every error, so failures are
 * just as predictable for API consumers as successful responses.
 */
public class ErrorResponse {

    private boolean success = false;
    private int status;
    private String error;
    private String message;
    private String path;
    private String correlationId;
    private LocalDateTime timestamp = LocalDateTime.now();
    private List<String> details;

    public ErrorResponse() {
    }

    public ErrorResponse(int status, String error, String message, String path, String correlationId) {
        this.status = status;
        this.error = error;
        this.message = message;
        this.path = path;
        this.correlationId = correlationId;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getCorrelationId() {
        return correlationId;
    }

    public void setCorrelationId(String correlationId) {
        this.correlationId = correlationId;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public List<String> getDetails() {
        return details;
    }

    public void setDetails(List<String> details) {
        this.details = details;
    }
}
