package com.smartexpense.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "predictions")
public class Prediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String predictionType; // "monthly_spending", "category_spending", "future_balance", "savings_prediction"

    private String predictionPeriod;

    @Column(precision = 12, scale = 2)
    private BigDecimal predictedAmount;

    private String modelName;

    @Column(length = 2000)
    private String detailsJson;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Prediction() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getPredictionType() { return predictionType; }
    public void setPredictionType(String predictionType) { this.predictionType = predictionType; }

    public String getPredictionPeriod() { return predictionPeriod; }
    public void setPredictionPeriod(String predictionPeriod) { this.predictionPeriod = predictionPeriod; }

    public BigDecimal getPredictedAmount() { return predictedAmount; }
    public void setPredictedAmount(BigDecimal predictedAmount) { this.predictedAmount = predictedAmount; }

    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }

    public String getDetailsJson() { return detailsJson; }
    public void setDetailsJson(String detailsJson) { this.detailsJson = detailsJson; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
