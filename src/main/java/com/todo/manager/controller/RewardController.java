package com.todo.manager.controller;

import com.todo.manager.service.RewardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/rewards")
public class RewardController {

    @Autowired
    private RewardService rewardService;

    @GetMapping("/user/{userId}")
    public Map<String, Object> getSummary(@PathVariable Integer userId) {
        return rewardService.getSummary(userId);
    }
}
