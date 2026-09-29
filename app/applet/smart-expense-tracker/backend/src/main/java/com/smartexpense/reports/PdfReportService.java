package com.smartexpense.reports;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.smartexpense.entity.*;
import com.smartexpense.service.*;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class PdfReportService {

    private final TransactionService transactionService;
    private final BudgetService budgetService;
    private final GoalService goalService;
    private final AnalyticsService analyticsService;

    // Palette: Holst Theme Colors
    private static final Color PRIMARY_NAVY = new Color(0x22, 0x3A, 0x5E);
    private static final Color SLATE_BLUE = new Color(0x35, 0x59, 0x82);
    private static final Color STEEL_BLUE = new Color(0x4D, 0x79, 0xA8);
    private static final Color LIGHT_BG = new Color(0xF3, 0xF8, 0xFD);
    private static final Color ACCENT_GREEN = new Color(0x2E, 0x7D, 0x32);
    private static final Color ACCENT_RED = new Color(0xC6, 0x28, 0x28);

    public PdfReportService(TransactionService transactionService,
                            BudgetService budgetService,
                            GoalService goalService,
                            AnalyticsService analyticsService) {
        this.transactionService = transactionService;
        this.budgetService = budgetService;
        this.goalService = goalService;
        this.analyticsService = analyticsService;
    }

    public ByteArrayInputStream generateFinancialStatement(User user) {
        Document document = new Document(PageSize.A4, 36, 36, 40, 40);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, PRIMARY_NAVY);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.WHITE);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, PRIMARY_NAVY);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);
            Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.GRAY);

            // Document Header Banner
            Paragraph title = new Paragraph("SMART EXPENSE TRACKER - FINANCIAL STATEMENT", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(4);
            document.add(title);

            Paragraph subtitle = new Paragraph("Personal Finance & Spending Intelligence Statement | College Edition", smallFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(15);
            document.add(subtitle);

            // User Info Meta Table
            PdfPTable metaTable = new PdfPTable(2);
            metaTable.setWidthPercentage(100);
            metaTable.setSpacingAfter(15);

            PdfPCell c1 = new PdfPCell(new Phrase("Account Holder: " + user.getName() + " (" + user.getEmail() + ")", normalFont));
            c1.setBorder(Rectangle.NO_BORDER);
            metaTable.addCell(c1);

            PdfPCell c2 = new PdfPCell(new Phrase("Generated on: " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd MMMM yyyy")), normalFont));
            c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
            c2.setBorder(Rectangle.NO_BORDER);
            metaTable.addCell(c2);

            document.add(metaTable);

            // Key Metrics Summary Grid
            BigDecimal totalIncome = transactionService.getTotalIncome(user);
            BigDecimal totalExpense = transactionService.getTotalExpenses(user);
            BigDecimal netSavings = totalIncome.subtract(totalExpense);

            PdfPTable metricsTable = new PdfPTable(3);
            metricsTable.setWidthPercentage(100);
            metricsTable.setSpacingAfter(20);

            addMetricCell(metricsTable, "TOTAL INFLOW", "₹" + totalIncome, ACCENT_GREEN, normalFont, boldFont);
            addMetricCell(metricsTable, "TOTAL OUTFLOW", "₹" + totalExpense, ACCENT_RED, normalFont, boldFont);
            addMetricCell(metricsTable, "NET SAVINGS", "₹" + netSavings, PRIMARY_NAVY, normalFont, boldFont);

            document.add(metricsTable);

            // Section: Recent Transactions
            Paragraph txHeader = new Paragraph("Recent Transactions", boldFont);
            txHeader.setSpacingAfter(6);
            document.add(txHeader);

            PdfPTable txTable = new PdfPTable(5);
            txTable.setWidthPercentage(100);
            txTable.setWidths(new float[]{18, 15, 22, 30, 15});
            txTable.setSpacingAfter(20);

            String[] headers = {"Date", "Type", "Category", "Description", "Amount"};
            for (String h : headers) {
                PdfPCell th = new PdfPCell(new Phrase(h, headerFont));
                th.setBackgroundColor(SLATE_BLUE);
                th.setPadding(6);
                txTable.addCell(th);
            }

            List<Transaction> transactions = transactionService.findAll(user);
            int count = 0;
            for (Transaction t : transactions) {
                if (count++ >= 15) break; // top 15 in statement
                txTable.addCell(createCell(t.getDate().toString(), normalFont));
                txTable.addCell(createCell(t.getType(), normalFont));
                txTable.addCell(createCell(t.getCategory(), normalFont));
                txTable.addCell(createCell(t.getDescription() != null ? t.getDescription() : "-", normalFont));
                
                PdfPCell amtCell = createCell("₹" + t.getAmount(), normalFont);
                amtCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                txTable.addCell(amtCell);
            }
            document.add(txTable);

            // Section: Active Budgets
            List<Budget> budgets = budgetService.findByUserAndCurrentMonth(user);
            if (!budgets.isEmpty()) {
                Paragraph bHeader = new Paragraph("Current Month Budget Performance", boldFont);
                bHeader.setSpacingAfter(6);
                document.add(bHeader);

                PdfPTable bTable = new PdfPTable(4);
                bTable.setWidthPercentage(100);
                bTable.setWidths(new float[]{30, 25, 25, 20});
                bTable.setSpacingAfter(20);

                String[] bHeaders = {"Category", "Budget Limit", "Spent", "Usage %"};
                for (String h : bHeaders) {
                    PdfPCell th = new PdfPCell(new Phrase(h, headerFont));
                    th.setBackgroundColor(STEEL_BLUE);
                    th.setPadding(6);
                    bTable.addCell(th);
                }

                for (Budget b : budgets) {
                    bTable.addCell(createCell(b.getCategory(), normalFont));
                    bTable.addCell(createCell("₹" + b.getAmount(), normalFont));
                    bTable.addCell(createCell("₹" + budgetService.getActualExpenseForBudget(b), normalFont));
                    bTable.addCell(createCell(String.format("%.1f%%", budgetService.getUsagePercentage(b)), normalFont));
                }
                document.add(bTable);
            }

            // Document Footer
            Paragraph footer = new Paragraph("Statement securely generated by Smart Expense Tracker with Python Machine Learning Integration.", smallFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.setSpacingBefore(15);
            document.add(footer);

            document.close();

        } catch (DocumentException e) {
            e.printStackTrace();
        }

        return new ByteArrayInputStream(out.toByteArray());
    }

    private void addMetricCell(PdfPTable table, String label, String value, Color color, Font labelFont, Font valFont) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(LIGHT_BG);
        cell.setPadding(10);
        cell.setBorderColor(new Color(0xD0, 0xE1, 0xF2));

        Paragraph pLabel = new Paragraph(label, labelFont);
        pLabel.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(pLabel);

        Font customValFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, color);
        Paragraph pVal = new Paragraph(value, customValFont);
        pVal.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(pVal);

        table.addCell(cell);
    }

    private PdfPCell createCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(5);
        cell.setBorderColor(new Color(0xE0, 0xE0, 0xE0));
        return cell;
    }
}
