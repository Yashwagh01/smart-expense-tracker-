package com.smartexpense.service;

import com.smartexpense.entity.Bill;
import com.smartexpense.entity.User;
import com.smartexpense.repository.BillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class BillService {

    private final BillRepository billRepository;

    public BillService(BillRepository billRepository) {
        this.billRepository = billRepository;
    }

    public List<Bill> findAll(User user) {
        return billRepository.findByUserOrderByDueDateAsc(user);
    }

    @Transactional
    public Bill save(Bill bill) {
        if (bill.getId() == null) {
            bill.setCreatedAt(LocalDateTime.now());
        }
        return billRepository.save(bill);
    }

    @Transactional
    public void delete(Bill bill) {
        billRepository.delete(bill);
    }

    @Transactional
    public void toggleStatus(Bill bill) {
        if ("PAID".equalsIgnoreCase(bill.getStatus())) {
            bill.setStatus("UNPAID");
        } else {
            bill.setStatus("PAID");
        }
        billRepository.save(bill);
    }

    public boolean isOverdue(Bill bill) {
        return "UNPAID".equalsIgnoreCase(bill.getStatus()) 
                && bill.getDueDate() != null 
                && bill.getDueDate().isBefore(LocalDate.now());
    }
}
