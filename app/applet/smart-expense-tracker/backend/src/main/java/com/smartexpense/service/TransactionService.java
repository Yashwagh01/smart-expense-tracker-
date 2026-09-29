package com.smartexpense.service;

import com.smartexpense.entity.Transaction;
import com.smartexpense.entity.User;
import com.smartexpense.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final NotificationService notificationService;

    public TransactionService(TransactionRepository transactionRepository, NotificationService notificationService) {
        this.transactionRepository = transactionRepository;
        this.notificationService = notificationService;
    }

    public List<Transaction> findAll(User user) {
        return transactionRepository.findByUserOrderByDateDesc(user);
    }

    public List<Transaction> findExpenses(User user) {
        return transactionRepository.findByUserAndTypeOrderByDateDesc(user, "EXPENSE");
    }

    public List<Transaction> findIncomes(User user) {
        return transactionRepository.findByUserAndTypeOrderByDateDesc(user, "INCOME");
    }

    @Transactional
    public Transaction save(Transaction transaction) {
        if (transaction.getId() == null) {
            transaction.setCreatedAt(LocalDateTime.now());
        }
        transaction.setUpdatedAt(LocalDateTime.now());
        Transaction saved = transactionRepository.save(transaction);

        // Check for potential duplicate transactions
        if ("EXPENSE".equalsIgnoreCase(saved.getType())) {
            checkDuplicate(saved);
        }
        return saved;
    }

    @Transactional
    public void delete(Transaction transaction) {
        transactionRepository.delete(transaction);
    }

    public BigDecimal getTotalIncome(User user) {
        BigDecimal sum = transactionRepository.sumAmountByUserAndType(user, "INCOME");
        return sum != null ? sum : BigDecimal.ZERO;
    }

    public BigDecimal getTotalExpenses(User user) {
        BigDecimal sum = transactionRepository.sumAmountByUserAndType(user, "EXPENSE");
        return sum != null ? sum : BigDecimal.ZERO;
    }

    public BigDecimal getBalance(User user) {
        return getTotalIncome(user).subtract(getTotalExpenses(user));
    }

    public BigDecimal getMonthlyExpenses(User user, int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.plusMonths(1).minusDays(1);
        BigDecimal sum = transactionRepository.sumAmountByUserAndTypeAndDateBetween(user, "EXPENSE", start, end);
        return sum != null ? sum : BigDecimal.ZERO;
    }

    public BigDecimal getMonthlyIncome(User user, int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.plusMonths(1).minusDays(1);
        BigDecimal sum = transactionRepository.sumAmountByUserAndTypeAndDateBetween(user, "INCOME", start, end);
        return sum != null ? sum : BigDecimal.ZERO;
    }

    public List<Transaction> filter(User user, String searchTerm, String type, String category,
                                   LocalDate startDate, LocalDate endDate, String paymentMethod) {
        return findAll(user).stream()
                .filter(t -> type == null || type.equalsIgnoreCase("ALL") || t.getType().equalsIgnoreCase(type))
                .filter(t -> category == null || category.equalsIgnoreCase("ALL") || t.getCategory().equalsIgnoreCase(category))
                .filter(t -> paymentMethod == null || paymentMethod.equalsIgnoreCase("ALL") || (t.getPaymentMethod() != null && t.getPaymentMethod().equalsIgnoreCase(paymentMethod)))
                .filter(t -> startDate == null || !t.getDate().isBefore(startDate))
                .filter(t -> endDate == null || !t.getDate().isAfter(endDate))
                .filter(t -> {
                    if (searchTerm == null || searchTerm.trim().isEmpty()) return true;
                    String term = searchTerm.toLowerCase();
                    return (t.getDescription() != null && t.getDescription().toLowerCase().contains(term))
                            || (t.getCategory() != null && t.getCategory().toLowerCase().contains(term))
                            || (t.getTags() != null && t.getTags().toLowerCase().contains(term))
                            || t.getAmount().toString().contains(term);
                })
                .collect(Collectors.toList());
    }

    private void checkDuplicate(Transaction current) {
        List<Transaction> sameUser = transactionRepository.findByUserOrderByDateDesc(current.getUser());
        for (Transaction other : sameUser) {
            if (!other.getId().equals(current.getId())
                    && other.getAmount().compareTo(current.getAmount()) == 0
                    && other.getDate().equals(current.getDate())
                    && other.getCategory().equalsIgnoreCase(current.getCategory())
                    && (other.getDescription() != null && other.getDescription().equalsIgnoreCase(current.getDescription()))) {
                notificationService.createNotification(
                        current.getUser(),
                        "Potential Duplicate Transaction Detected",
                        String.format("You recorded two identical expenses of ₹%s for '%s' on %s.",
                                current.getAmount(), current.getDescription(), current.getDate()),
                        "ANOMALY"
                );
                break;
            }
        }
    }
}
