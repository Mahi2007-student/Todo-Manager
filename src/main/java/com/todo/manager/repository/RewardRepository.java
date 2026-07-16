package com.todo.manager.repository;

import com.todo.manager.model.Reward;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RewardRepository extends JpaRepository<Reward, Integer> {
    List<Reward> findByUser_UserIdOrderByEarnedDateDesc(Integer userId);
}
