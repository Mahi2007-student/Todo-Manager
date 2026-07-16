package com.todo.manager.controller;

import com.todo.manager.model.Notification;
import com.todo.manager.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/user/{userId}")
    public List<Notification> getNotifications(@PathVariable Integer userId) {
        return notificationService.getForUser(userId);
    }

    // Frontend polls this every ~60s to detect newly-due tasks
    @GetMapping("/user/{userId}/check")
    public List<Notification> checkReminders(@PathVariable Integer userId) {
        return notificationService.checkAndGenerateReminders(userId);
    }

    @PatchMapping("/{notificationId}/read")
    public Notification markRead(@PathVariable Integer notificationId) {
        return notificationService.markRead(notificationId);
    }
}
