package com.smartexpense.repository;

import com.smartexpense.entity.Prediction;
import com.smartexpense.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PredictionRepository extends JpaRepository<Prediction, Long> {
    List<Prediction> findByUserOrderByCreatedAtDesc(User user);
    List<Prediction> findByUserAndPredictionTypeOrderByCreatedAtDesc(User user, String predictionType);
}
