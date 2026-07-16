package com.todo.manager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "rewards")
public class Reward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reward_id")
    private Integer rewardId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"password", "email", "phone", "country", "gender", "dob"})
    private User user;

    @Column(name = "reward_name", length = 100)
    private String rewardName;

    @Column(name = "points")
    private Integer points;

    @Column(name = "earned_date", updatable = false, insertable = false)
    private LocalDateTime earnedDate;

    public Integer getRewardId() { return rewardId; }
    public void setRewardId(Integer rewardId) { this.rewardId = rewardId; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getRewardName() { return rewardName; }
    public void setRewardName(String rewardName) { this.rewardName = rewardName; }

    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }

    public LocalDateTime getEarnedDate() { return earnedDate; }
}
