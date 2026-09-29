package com.smartexpense.repository;

import com.smartexpense.entity.Subscription;
import com.smartexpense.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    List<Subscription> findByUserOrderByNextPaymentDateAsc(User user);
    List<Subscription> findByUserAndStatus(User user, String status);
}
