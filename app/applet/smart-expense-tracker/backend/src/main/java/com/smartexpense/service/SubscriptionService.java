package com.smartexpense.service;

import com.smartexpense.entity.Subscription;
import com.smartexpense.entity.User;
import com.smartexpense.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;

    public SubscriptionService(SubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    public List<Subscription> findAll(User user) {
        return subscriptionRepository.findByUserOrderByNextPaymentDateAsc(user);
    }

    @Transactional
    public Subscription save(Subscription subscription) {
        if (subscription.getId() == null) {
            subscription.setCreatedAt(LocalDateTime.now());
        }
        return subscriptionRepository.save(subscription);
    }

    @Transactional
    public void delete(Subscription subscription) {
        subscriptionRepository.delete(subscription);
    }

    public BigDecimal getTotalMonthlyCost(User user) {
        List<Subscription> subs = subscriptionRepository.findByUserAndStatus(user, "ACTIVE");
        BigDecimal total = BigDecimal.ZERO;
        for (Subscription s : subs) {
            if ("MONTHLY".equalsIgnoreCase(s.getFrequency())) {
                total = total.add(s.getAmount());
            } else if ("ANNUALLY".equalsIgnoreCase(s.getFrequency())) {
                total = total.add(s.getAmount().divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP));
            } else if ("WEEKLY".equalsIgnoreCase(s.getFrequency())) {
                total = total.add(s.getAmount().multiply(BigDecimal.valueOf(4)));
            }
        }
        return total;
    }

    public BigDecimal getTotalAnnualCost(User user) {
        return getTotalMonthlyCost(user).multiply(BigDecimal.valueOf(12));
    }
}
