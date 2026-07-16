package com.todo.manager.repository;

import com.todo.manager.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Integer> {
    List<Task> findByUser_UserIdOrderByDueDateAscDueTimeAsc(Integer userId);
    List<Task> findByUser_UserIdAndStatus(Integer userId, Task.Status status);
    List<Task> findByUser_UserIdAndDueDate(Integer userId, LocalDate dueDate);
    long countByUser_UserId(Integer userId);
    long countByUser_UserIdAndStatus(Integer userId, Task.Status status);
}
