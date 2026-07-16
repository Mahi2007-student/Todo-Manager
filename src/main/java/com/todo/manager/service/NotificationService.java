package com.todo.manager.service;

import com.todo.manager.model.Notification;
import com.todo.manager.model.Task;
import com.todo.manager.repository.NotificationRepository;
import com.todo.manager.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private TaskRepository taskRepository;

    public List<Notification> getForUser(Integer userId) {
        return notificationRepository.findByUser_UserIdOrderByNotificationTimeDesc(userId);
    }

    public Notification markRead(Integer notificationId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found."));
        n.setStatus(Notification.Status.Read);
        return notificationRepository.save(n);
    }

    /**
     * Called by the frontend on a polling interval. Scans the user's pending
     * tasks; any task due within its reminder window (and not already
     * notified) gets a fresh notification row.
     */
    public List<Notification> checkAndGenerateReminders(Integer userId) {
        List<Task> pending = taskRepository.findByUser_UserIdAndStatus(userId, Task.Status.Pending);
        LocalDateTime now = LocalDateTime.now();

        for (Task task : pending) {
            if (task.getDueDate() == null) continue;
            LocalTime time = task.getDueTime() != null ? task.getDueTime() : LocalTime.of(23, 59);
            LocalDateTime due = LocalDateTime.of(task.getDueDate(), time);
            int reminderMin = task.getReminderMinutes() == null ? 15 : task.getReminderMinutes();
            LocalDateTime reminderStart = due.minusMinutes(reminderMin);

            boolean withinWindow = !now.isBefore(reminderStart) && now.isBefore(due);
            boolean overdue = now.isAfter(due);

            boolean alreadyNotified = notificationRepository.findByUser_UserIdOrderByNotificationTimeDesc(userId)
                    .stream()
                    .anyMatch(n -> n.getTask() != null && n.getTask().getTaskId().equals(task.getTaskId())
                            && n.getMessage() != null
                            && (overdue ? n.getMessage().contains("overdue") : n.getMessage().contains("due soon")));

            if (!alreadyNotified && (withinWindow || overdue)) {
                Notification n = new Notification();
                n.setUser(task.getUser());
                n.setTask(task);
                n.setMessage(overdue
                        ? "\u23F0 Task \"" + task.getTitle() + "\" is overdue!"
                        : "\u23F0 Task \"" + task.getTitle() + "\" is due soon (" + task.getDueDate() + " " + time + ")");
                n.setNotificationTime(now);
                n.setStatus(Notification.Status.Unread);
                notificationRepository.save(n);
            }
        }
        return getForUser(userId);
    }
}
