package com.smartexpense.ui.views;

import com.fasterxml.jackson.databind.JsonNode;
import com.smartexpense.entity.User;
import com.smartexpense.security.SecurityService;
import com.smartexpense.service.AiService;
import com.smartexpense.ui.layout.MainLayout;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.button.ButtonVariant;
import com.vaadin.flow.component.html.*;
import com.vaadin.flow.component.icon.Icon;
import com.vaadin.flow.component.icon.VaadinIcon;
import com.vaadin.flow.component.orderedlayout.FlexComponent;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.progressbar.ProgressBar;
import com.vaadin.flow.component.tabs.Tab;
import com.vaadin.flow.component.tabs.Tabs;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;
import jakarta.annotation.security.PermitAll;

import java.util.Iterator;
import java.util.Map;
import java.util.Optional;

@Route(value = "predictions", layout = MainLayout.class)
@PageTitle("AI Predictions & Forecasts | Smart Expense Tracker")
@PermitAll
public class PredictionView extends VerticalLayout {

    private final SecurityService securityService;
    private final AiService aiService;
    private User currentUser;

    private final VerticalLayout contentArea = new VerticalLayout();

    public PredictionView(SecurityService securityService, AiService aiService) {
        this.securityService = securityService;
        this.aiService = aiService;

        setSizeFull();
        setPadding(true);
        setSpacing(true);

        Optional<User> userOpt = securityService.getAuthenticatedUser();
        if (userOpt.isEmpty()) return;
        this.currentUser = userOpt.get();

        H2 header = new H2("AI Spending Predictions & Forecasts");
        header.getStyle().set("margin", "0");

        Paragraph sub = new Paragraph("Powered by Python & Scikit-learn Machine Learning models operating over your authenticated financial activity.");
        sub.getStyle().set("opacity", "0.75").set("margin-top", "4px");

        add(header, sub);

        // Tab Navigation for different prediction models
        Tab tabSpending = new Tab("Future Spending");
        Tab tabCategory = new Tab("Category Forecast");
        Tab tabBalance = new Tab("Future Balance");
        Tab tabSavings = new Tab("Savings Trajectory");
        Tab tabCashflow = new Tab("30-60-90d Cash Flow");

        Tabs tabs = new Tabs(tabSpending, tabCategory, tabBalance, tabSavings, tabCashflow);
        tabs.setWidthFull();

        contentArea.setSizeFull();
        contentArea.setPadding(false);

        tabs.addSelectedChangeListener(event -> {
            contentArea.removeAll();
            Tab selected = event.getSelectedTab();
            if (selected.equals(tabSpending)) {
                renderSpendingPrediction();
            } else if (selected.equals(tabCategory)) {
                renderCategoryPrediction();
            } else if (selected.equals(tabBalance)) {
                renderBalancePrediction();
            } else if (selected.equals(tabSavings)) {
                renderSavingsPrediction();
            } else if (selected.equals(tabCashflow)) {
                renderCashflowForecast();
            }
        });

        add(tabs, contentArea);
        renderSpendingPrediction(); // default tab
    }

    private void renderSpendingPrediction() {
        VerticalLayout panel = createPanel("Monthly Spending Forecast (Scikit-learn Regressor)");

        ProgressBar spinner = new ProgressBar();
        spinner.setIndeterminate(true);
        panel.add(spinner);

        Button runBtn = new Button("Re-compute Model", new Icon(VaadinIcon.REFRESH), e -> renderSpendingPrediction());
        runBtn.addThemeVariants(ButtonVariant.LUMO_PRIMARY, ButtonVariant.LUMO_SMALL);

        // Execute Python
        JsonNode result = aiService.getSpendingPrediction(currentUser);
        panel.remove(spinner);

        if (result != null && result.path("success").asBoolean(false)) {
            double amt = result.path("predicted_amount").asDouble();
            String model = result.path("model").asText();
            int pts = result.path("data_points").asInt();
            double r2 = result.path("r_squared").asDouble();

            H3 predDisplay = new H3("₹" + String.format("%,.2f", amt));
            predDisplay.getStyle().set("font-size", "2.2rem").set("color", "var(--lumo-primary-text-color)").set("margin", "12px 0 4px 0");

            Span badge = new Span("Algorithm: " + model + " | Historical Samples: " + pts + " | R² Fit: " + r2);
            badge.getElement().getThemeList().add("badge success");

            Paragraph note = new Paragraph(result.path("message").asText());
            note.getStyle().set("margin-top", "12px");

            panel.add(runBtn, predDisplay, badge, note);
        } else {
            String msg = result != null ? result.path("message").asText("Not enough data") : "AI Service unavailable.";
            panel.add(new Paragraph("⚠️ " + msg), runBtn);
        }
        contentArea.add(panel);
    }

    private void renderCategoryPrediction() {
        VerticalLayout panel = createPanel("Category-Wise Spending Forecast");

        JsonNode result = aiService.getCategoryPrediction(currentUser);
        if (result != null && result.path("success").asBoolean(false)) {
            JsonNode cats = result.path("predicted_categories");
            double total = result.path("total_predicted_spending").asDouble();

            H4 sumTitle = new H4("Total Forecasted Discretionary Volume: ₹" + String.format("%,.2f", total));
            sumTitle.getStyle().set("color", "var(--lumo-primary-text-color)");
            panel.add(sumTitle);

            VerticalLayout catList = new VerticalLayout();
            catList.setPadding(false);

            Iterator<Map.Entry<String, JsonNode>> fields = cats.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> entry = fields.next();
                double amt = entry.getValue().asDouble();
                double pct = total > 0 ? (amt / total) * 100 : 0;

                HorizontalLayout row = new HorizontalLayout(
                        new Span(entry.getKey()),
                        new Span("₹" + String.format("%,.2f", amt) + " (" + String.format("%.1f%%", pct) + ")")
                );
                row.setWidthFull();
                row.setJustifyContentMode(FlexComponent.JustifyContentMode.BETWEEN);

                ProgressBar pb = new ProgressBar();
                pb.setValue(Math.min(1.0, pct / 100.0));

                catList.add(row, pb);
            }
            panel.add(catList);
        } else {
            String msg = result != null ? result.path("message").asText("Not enough data") : "AI Service unavailable.";
            panel.add(new Paragraph("⚠️ " + msg));
        }
        contentArea.add(panel);
    }

    private void renderBalancePrediction() {
        VerticalLayout panel = createPanel("Future Balance Projection");

        JsonNode res = aiService.getBalancePrediction(currentUser);
        if (res != null && res.path("success").asBoolean(false)) {
            double cur = res.path("current_balance").asDouble();
            double inc = res.path("predicted_income").asDouble();
            double exp = res.path("predicted_expense").asDouble();
            double bal = res.path("predicted_balance").asDouble();

            HorizontalLayout kpis = new HorizontalLayout(
                    createMiniCard("Current Balance", "₹" + String.format("%,.2f", cur)),
                    createMiniCard("Projected Inflow", "+ ₹" + String.format("%,.2f", inc)),
                    createMiniCard("Projected Outflow", "- ₹" + String.format("%,.2f", exp)),
                    createMiniCard("Estimated Closing Balance", "₹" + String.format("%,.2f", bal))
            );
            kpis.setWidthFull();
            panel.add(kpis, new Paragraph(res.path("message").asText()));
        } else {
            String msg = res != null ? res.path("message").asText("Not enough data") : "AI Service unavailable.";
            panel.add(new Paragraph("⚠️ " + msg));
        }
        contentArea.add(panel);
    }

    private void renderSavingsPrediction() {
        VerticalLayout panel = createPanel("Savings Velocity & Rate Forecast");

        JsonNode res = aiService.getSavingsPrediction(currentUser);
        if (res != null && res.path("success").asBoolean(false)) {
            double sav = res.path("predicted_savings").asDouble();
            double rate = res.path("predicted_savings_rate_pct").asDouble();
            String trend = res.path("trend").asText("STABLE");

            H3 savVal = new H3("₹" + String.format("%,.2f", sav));
            savVal.getStyle().set("color", "var(--lumo-success-text-color)");

            Span badge = new Span("Projected Savings Rate: " + rate + "% | Trend: " + trend);
            badge.getElement().getThemeList().add("badge success");

            panel.add(savVal, badge, new Paragraph(res.path("message").asText()));
        } else {
            String msg = res != null ? res.path("message").asText("Not enough data") : "AI Service unavailable.";
            panel.add(new Paragraph("⚠️ " + msg));
        }
        contentArea.add(panel);
    }

    private void renderCashflowForecast() {
        VerticalLayout panel = createPanel("Multi-Period Cash-Flow Forecast (30 · 60 · 90 Days)");

        JsonNode res = aiService.getCashflowForecast(currentUser);
        if (res != null && res.path("success").asBoolean(false)) {
            JsonNode timeline = res.path("forecast_timeline");

            HorizontalLayout periodsRow = new HorizontalLayout();
            periodsRow.setWidthFull();

            for (JsonNode period : timeline) {
                String lbl = period.path("period_label").asText();
                double net = period.path("net_cash_flow").asDouble();
                double closing = period.path("projected_closing_balance").asDouble();

                VerticalLayout box = new VerticalLayout();
                box.setPadding(true);
                box.getStyle()
                        .set("background-color", "var(--lumo-contrast-5pct)")
                        .set("border-radius", "8px")
                        .set("border", "1px solid var(--lumo-contrast-10pct)");

                box.add(
                        new H4(lbl),
                        new Span("Expected Net: " + (net >= 0 ? "+" : "") + "₹" + String.format("%,.2f", net)),
                        new H3("₹" + String.format("%,.2f", closing))
                );
                periodsRow.add(box);
            }
            panel.add(periodsRow, new Paragraph(res.path("message").asText()));
        } else {
            String msg = res != null ? res.path("message").asText("Not enough data") : "AI Service unavailable.";
            panel.add(new Paragraph("⚠️ " + msg));
        }
        contentArea.add(panel);
    }

    private VerticalLayout createPanel(String title) {
        VerticalLayout p = new VerticalLayout();
        p.setPadding(true);
        p.getStyle()
                .set("background-color", "var(--lumo-base-color)")
                .set("border-radius", "12px")
                .set("border", "1px solid var(--lumo-contrast-10pct)")
                .set("box-shadow", "var(--lumo-box-shadow-xs)");

        H3 t = new H3(title);
        t.getStyle().set("margin-top", "0");
        p.add(t);
        return p;
    }

    private VerticalLayout createMiniCard(String label, String value) {
        VerticalLayout box = new VerticalLayout();
        box.setPadding(true);
        box.getStyle().set("background-color", "var(--lumo-contrast-5pct)").set("border-radius", "8px");
        Span l = new Span(label);
        l.getStyle().set("font-size", "0.8rem").set("opacity", "0.7");
        H4 v = new H4(value);
        v.getStyle().set("margin", "4px 0 0 0");
        box.add(l, v);
        return box;
    }
}
