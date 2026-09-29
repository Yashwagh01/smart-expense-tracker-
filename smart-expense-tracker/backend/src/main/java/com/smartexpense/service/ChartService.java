package com.smartexpense.service;

import com.vaadin.flow.server.StreamResource;
import org.jfree.chart.ChartFactory;
import org.jfree.chart.ChartUtils;
import org.jfree.chart.JFreeChart;
import org.jfree.chart.axis.CategoryAxis;
import org.jfree.chart.axis.NumberAxis;
import org.jfree.chart.plot.CategoryPlot;
import org.jfree.chart.plot.PiePlot;
import org.jfree.chart.plot.PlotOrientation;
import org.jfree.chart.renderer.category.BarRenderer;
import org.jfree.chart.renderer.category.LineAndShapeRenderer;
import org.jfree.data.category.DefaultCategoryDataset;
import org.jfree.data.general.DefaultPieDataset;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.util.Map;

@Service
public class ChartService {

    // Holst Palette definition (matching user uploaded reference)
    private static final Color HOLST_DEEP_NAVY = new Color(0x22, 0x3A, 0x5E);
    private static final Color HOLST_SLATE_BLUE = new Color(0x35, 0x59, 0x82);
    private static final Color HOLST_STEEL_BLUE = new Color(0x4D, 0x79, 0xA8);
    private static final Color HOLST_CORNFLOWER = new Color(0x6E, 0x9E, 0xCC);
    private static final Color HOLST_FROST_BLUE = new Color(0x9F, 0xC0, 0xE3);
    private static final Color HOLST_ICE_BLUE   = new Color(0xD0, 0xE1, 0xF2);
    private static final Color HOLST_LIGHT_BG   = new Color(0xF3, 0xF8, 0xFD);

    private static final Color DARK_BG = new Color(0x1A, 0x22, 0x2D);
    private static final Color DARK_PLOT_BG = new Color(0x20, 0x2A, 0x37);
    private static final Color DARK_TEXT = new Color(0xE2, 0xE8, 0xF0);
    private static final Color LIGHT_TEXT = new Color(0x1E, 0x29, 0x3B);

    public StreamResource createCategoryPieChart(Map<String, BigDecimal> data, boolean isDark, int width, int height) {
        DefaultPieDataset<String> dataset = new DefaultPieDataset<>();
        data.forEach((k, v) -> {
            if (v.compareTo(BigDecimal.ZERO) > 0) {
                dataset.setValue(k, v);
            }
        });

        JFreeChart chart = ChartFactory.createPieChart("Category Breakdown", dataset, true, true, false);
        stylePieChart(chart, isDark);

        return toStreamResource(chart, width, height, "category-pie.png");
    }

    public StreamResource createIncomeExpenseBarChart(BigDecimal income, BigDecimal expense, boolean isDark, int width, int height) {
        DefaultCategoryDataset dataset = new DefaultCategoryDataset();
        dataset.addValue(income != null ? income : 0, "Cash Flow", "Income");
        dataset.addValue(expense != null ? expense : 0, "Cash Flow", "Expenses");

        JFreeChart chart = ChartFactory.createBarChart("Cash Flow: Income vs Expenses",
                "Stream", "Amount (₹)", dataset, PlotOrientation.VERTICAL, false, true, false);

        styleBarChart(chart, isDark);
        return toStreamResource(chart, width, height, "income-expense-bar.png");
    }

    public StreamResource createMonthlyTrendLineChart(Map<String, BigDecimal> monthlyData, boolean isDark, int width, int height) {
        DefaultCategoryDataset dataset = new DefaultCategoryDataset();
        monthlyData.forEach((month, amount) -> dataset.addValue(amount, "Spending", month));

        JFreeChart chart = ChartFactory.createLineChart("Monthly Spending Trend",
                "Month", "Amount (₹)", dataset, PlotOrientation.VERTICAL, true, true, false);

        styleLineChart(chart, isDark);
        return toStreamResource(chart, width, height, "monthly-trend.png");
    }

    private void stylePieChart(JFreeChart chart, boolean isDark) {
        Color bg = isDark ? DARK_BG : HOLST_LIGHT_BG;
        Color text = isDark ? DARK_TEXT : LIGHT_TEXT;

        chart.setBackgroundPaint(bg);
        if (chart.getTitle() != null) {
            chart.getTitle().setPaint(text);
            chart.getTitle().setFont(new Font("SansSerif", Font.BOLD, 14));
        }

        PiePlot<?> plot = (PiePlot<?>) chart.getPlot();
        plot.setBackgroundPaint(isDark ? DARK_PLOT_BG : Color.WHITE);
        plot.setOutlinePaint(null);
        plot.setLabelBackgroundPaint(isDark ? DARK_BG : Color.WHITE);
        plot.setLabelPaint(text);
        plot.setLabelOutlinePaint(null);

        // Assign Holst palette slices
        Color[] sliceColors = {
                HOLST_DEEP_NAVY, HOLST_SLATE_BLUE, HOLST_STEEL_BLUE,
                HOLST_CORNFLOWER, HOLST_FROST_BLUE, HOLST_ICE_BLUE
        };
        for (int i = 0; i < plot.getDataset().getItemCount(); i++) {
            Comparable<?> key = plot.getDataset().getKey(i);
            plot.setSectionPaint(key, sliceColors[i % sliceColors.length]);
        }

        if (chart.getLegend() != null) {
            chart.getLegend().setBackgroundPaint(bg);
            chart.getLegend().setItemPaint(text);
        }
    }

    private void styleBarChart(JFreeChart chart, boolean isDark) {
        Color bg = isDark ? DARK_BG : HOLST_LIGHT_BG;
        Color text = isDark ? DARK_TEXT : LIGHT_TEXT;

        chart.setBackgroundPaint(bg);
        if (chart.getTitle() != null) {
            chart.getTitle().setPaint(text);
            chart.getTitle().setFont(new Font("SansSerif", Font.BOLD, 14));
        }

        CategoryPlot plot = chart.getCategoryPlot();
        plot.setBackgroundPaint(isDark ? DARK_PLOT_BG : Color.WHITE);
        plot.setDomainGridlinePaint(isDark ? new Color(0x37, 0x41, 0x51) : new Color(0xEE, 0xEE, 0xEE));
        plot.setRangeGridlinePaint(isDark ? new Color(0x37, 0x41, 0x51) : new Color(0xEE, 0xEE, 0xEE));
        plot.setOutlinePaint(null);

        CategoryAxis domainAxis = plot.getDomainAxis();
        domainAxis.setLabelPaint(text);
        domainAxis.setTickLabelPaint(text);

        NumberAxis rangeAxis = (NumberAxis) plot.getRangeAxis();
        rangeAxis.setLabelPaint(text);
        rangeAxis.setTickLabelPaint(text);

        BarRenderer renderer = (BarRenderer) plot.getRenderer();
        renderer.setSeriesPaint(0, HOLST_STEEL_BLUE);
    }

    private void styleLineChart(JFreeChart chart, boolean isDark) {
        Color bg = isDark ? DARK_BG : HOLST_LIGHT_BG;
        Color text = isDark ? DARK_TEXT : LIGHT_TEXT;

        chart.setBackgroundPaint(bg);
        if (chart.getTitle() != null) {
            chart.getTitle().setPaint(text);
            chart.getTitle().setFont(new Font("SansSerif", Font.BOLD, 14));
        }

        CategoryPlot plot = chart.getCategoryPlot();
        plot.setBackgroundPaint(isDark ? DARK_PLOT_BG : Color.WHITE);
        plot.setDomainGridlinePaint(isDark ? new Color(0x37, 0x41, 0x51) : new Color(0xEE, 0xEE, 0xEE));
        plot.setRangeGridlinePaint(isDark ? new Color(0x37, 0x41, 0x51) : new Color(0xEE, 0xEE, 0xEE));
        plot.setOutlinePaint(null);

        CategoryAxis domainAxis = plot.getDomainAxis();
        domainAxis.setLabelPaint(text);
        domainAxis.setTickLabelPaint(text);

        NumberAxis rangeAxis = (NumberAxis) plot.getRangeAxis();
        rangeAxis.setLabelPaint(text);
        rangeAxis.setTickLabelPaint(text);

        LineAndShapeRenderer renderer = (LineAndShapeRenderer) plot.getRenderer();
        renderer.setSeriesPaint(0, HOLST_CORNFLOWER);
        renderer.setSeriesStroke(0, new BasicStroke(2.5f));
    }

    private StreamResource toStreamResource(JFreeChart chart, int width, int height, String filename) {
        return new StreamResource(filename, () -> {
            try {
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                ChartUtils.writeChartAsPNG(out, chart, width, height);
                return new ByteArrayInputStream(out.toByteArray());
            } catch (Exception e) {
                return new ByteArrayInputStream(new byte[0]);
            }
        });
    }
}
