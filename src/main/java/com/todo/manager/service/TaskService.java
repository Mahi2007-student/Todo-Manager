package com.todo.manager.service;

import com.todo.manager.model.Reward;
import com.todo.manager.model.Task;
import com.todo.manager.model.User;
import com.todo.manager.repository.NotificationRepository;
import com.todo.manager.repository.RewardRepository;
import com.todo.manager.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private RewardRepository rewardRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserService userService;

    public Task createTask(Integer userId, Task task) {
        User user = userService.getById(userId);
        task.setUser(user);
        if (task.getPriority() == null) task.setPriority(Task.Priority.Medium);
        if (task.getReminderMinutes() == null) task.setReminderMinutes(15);
        if (task.getRewardPoints() == null) task.setRewardPoints(10);
        task.setStatus(Task.Status.Pending);
        return taskRepository.save(task);
    }

    public List<Task> getTasksForUser(Integer userId) {
        return taskRepository.findByUser_UserIdOrderByDueDateAscDueTimeAsc(userId);
    }

    public List<Task> getTasksForDate(Integer userId, LocalDate date) {
        return taskRepository.findByUser_UserIdAndDueDate(userId, date);
    }

    public Task getTask(Integer taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found."));
    }

    public Task updateTask(Integer taskId, Task updated) {
        Task existing = getTask(taskId);
        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());
        existing.setCategory(updated.getCategory());
        existing.setPriority(updated.getPriority());
        existing.setDueDate(updated.getDueDate());
        existing.setDueTime(updated.getDueTime());
        existing.setReminderMinutes(updated.getReminderMinutes());
        return taskRepository.save(existing);
    }

    @Transactional
    public void deleteTask(Integer taskId) {
        // Remove dependent notifications first — Hibernate's auto-generated
        // foreign key (from ddl-auto=update) doesn't cascade deletes the way
        // the hand-written SQL schema does, so this avoids a constraint error.
        notificationRepository.deleteAll(notificationRepository.findByTask_TaskId(taskId));
        taskRepository.deleteById(taskId);
    }

    /**
     * Marks a task complete/pending. When newly completed, awards points
     * and, every 5th completed task, a bonus "sticker" reward.
     * Returns the updated task plus how many points/badges were just earned,
     * so the UI can show clear confirmation.
     */
    public Map<String, Object> toggleStatus(Integer taskId) {
        Task task = getTask(taskId);
        boolean becomingCompleted = task.getStatus() == Task.Status.Pending;
        task.setStatus(becomingCompleted ? Task.Status.Completed : Task.Status.Pending);
        Task saved = taskRepository.save(task);

        int pointsEarned = 0;
        boolean milestone = false;

        if (becomingCompleted) {
            int points = task.getRewardPoints() == null ? 10 : task.getRewardPoints();
            Reward reward = new Reward();
            reward.setUser(task.getUser());
            reward.setRewardName("Task Completed: " + task.getTitle());
            reward.setPoints(points);
            rewardRepository.save(reward);
            pointsEarned = points;

            long completedCount = taskRepository.countByUser_UserIdAndStatus(task.getUser().getUserId(), Task.Status.Completed);
            if (completedCount % 5 == 0) {
                Reward sticker = new Reward();
                sticker.setUser(task.getUser());
                sticker.setRewardName("🏅 Sticker: " + completedCount + " Tasks Milestone");
                sticker.setPoints(25);
                rewardRepository.save(sticker);
                pointsEarned += 25;
                milestone = true;
            }
        }

        return Map.of(
                "task", saved,
                "pointsEarned", pointsEarned,
                "milestone", milestone
        );
    }

    public Map<String, Object> getStats(Integer userId) {
        long total = taskRepository.countByUser_UserId(userId);
        long completed = taskRepository.countByUser_UserIdAndStatus(userId, Task.Status.Completed);
        long pending = taskRepository.countByUser_UserIdAndStatus(userId, Task.Status.Pending);
        int progress = total == 0 ? 0 : (int) Math.round((completed * 100.0) / total);
        return Map.of(
                "totalTasks", total,
                "completed", completed,
                "pending", pending,
                "progressPercent", progress
        );
    }
}
