package com.lab.reliability;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class DlqRegistry {
    public static final DlqRegistry INSTANCE = new DlqRegistry();
    private final Map<String, PostEvent> parked = new ConcurrentHashMap<>();
    public void put(PostEvent e) { parked.put(e.eventId(), e); }
    public PostEvent remove(String id) { return parked.remove(id); }
    public List<PostEvent> all() { return new ArrayList<>(parked.values()); }
    public void clear() { parked.clear(); }
}
