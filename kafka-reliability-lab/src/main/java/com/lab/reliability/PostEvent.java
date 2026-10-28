package com.lab.reliability;

/** failMode: NONE (always succeeds), TRANSIENT (fails twice, then succeeds), ALWAYS (poison message). */
public record PostEvent(String eventId, String postId, String content, String failMode) {}
