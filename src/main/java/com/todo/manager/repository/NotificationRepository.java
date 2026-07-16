package com.todo.manager.repository;

import com.todo.manager.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findByUser_UserIdOrderByNotificationTimeDesc(Integer userId);
    List<Notification> findByUser_UserIdAndStatus(Integer userId, Notification.Status status);
    List<Notification> findByTask_TaskId(Integer taskId);
}
