package com.smartexpense.reports;

import com.smartexpense.entity.Transaction;
import com.smartexpense.entity.User;
import com.smartexpense.service.TransactionService;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class CsvExportService {

    private final TransactionService transactionService;

    public CsvExportService(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    public ByteArrayInputStream exportTransactionsToCsv(User user) {
        List<Transaction> transactions = transactionService.findAll(user);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(out, true, StandardCharsets.UTF_8)) {
            // CSV Header
            writer.println("ID,Date,Type,Category,Description,Payment Method,Amount,Recurring");

            for (Transaction t : transactions) {
                writer.printf("%d,%s,%s,\"%s\",\"%s\",\"%s\",%.2f,%s%n",
                        t.getId(),
                        t.getDate(),
                        t.getType(),
                        escapeCsv(t.getCategory()),
                        escapeCsv(t.getDescription() != null ? t.getDescription() : ""),
                        escapeCsv(t.getPaymentMethod() != null ? t.getPaymentMethod() : ""),
                        t.getAmount().doubleValue(),
                        t.isRecurring() ? "Yes" : "No"
                );
            }
            writer.flush();
        }

        return new ByteArrayInputStream(out.toByteArray());
    }

    private String escapeCsv(String val) {
        return val.replace("\"", "\"\"");
    }
}
