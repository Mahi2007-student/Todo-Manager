package com.todo.manager.controller;

import com.todo.manager.model.Task;
import com.todo.manager.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskService taskService;

    @PostMapping("/user/{userId}")
    public ResponseEntity<?> createTask(@PathVariable Integer userId, @RequestBody Task task) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(taskService.createTask(userId, task));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public List<Task> getTasks(@PathVariable Integer userId) {
        return taskService.getTasksForUser(userId);
    }

    @GetMapping("/user/{userId}/date/{date}")
    public List<Task> getTasksForDate(@PathVariable Integer userId,
                                       @PathVariable @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate date) {
        return taskService.getTasksForDate(userId, date);
    }

    @GetMapping("/user/{userId}/stats")
    public Map<String, Object> getStats(@PathVariable Integer userId) {
        return taskService.getStats(userId);
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<?> updateTask(@PathVariable Integer taskId, @RequestBody Task task) {
        try {
            return ResponseEntity.ok(taskService.updateTask(taskId, task));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{taskId}/toggle")
    public ResponseEntity<?> toggleStatus(@PathVariable Integer taskId) {
        try {
            return ResponseEntity.ok(taskService.toggleStatus(taskId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    @DeleteMapping("/{taskId}")
    public ResponseEntity<?> deleteTask(@PathVariable Integer taskId) {
        try {
            taskService.deleteTask(taskId);
            return ResponseEntity.ok(Map.of("message", "Task deleted."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Could not delete task: " + e.getMessage()));
        }
    }
}
