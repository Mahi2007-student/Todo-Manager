package com.todo.manager.service;

import com.todo.manager.model.Reward;
import com.todo.manager.repository.RewardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class RewardService {

    @Autowired
    private RewardRepository rewardRepository;

    public List<Reward> getRewardsForUser(Integer userId) {
        return rewardRepository.findByUser_UserIdOrderByEarnedDateDesc(userId);
    }

    public Map<String, Object> getSummary(Integer userId) {
        List<Reward> rewards = getRewardsForUser(userId);
        int totalPoints = rewards.stream().mapToInt(r -> r.getPoints() == null ? 0 : r.getPoints()).sum();
        long badgeCount = rewards.stream().filter(r -> r.getRewardName() != null && r.getRewardName().contains("Milestone")).count();
        long stickerCount = rewards.stream().filter(r -> r.getRewardName() != null && r.getRewardName().contains("Sticker")).count();
        return Map.of(
                "totalPoints", totalPoints,
                "badgeCount", badgeCount,
                "stickerCount", stickerCount,
                "rewards", rewards
        );
    }
}
