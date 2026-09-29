package com.smartexpense.repository;

import com.smartexpense.entity.Bill;
import com.smartexpense.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {
    List<Bill> findByUserOrderByDueDateAsc(User user);
    List<Bill> findByUserAndStatus(User user, String status);
}
