package com.smartexpense.ui.views;

import com.smartexpense.ui.theme.ThemeManager;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.button.ButtonVariant;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.html.Paragraph;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.icon.Icon;
import com.vaadin.flow.component.icon.VaadinIcon;
import com.vaadin.flow.component.login.LoginForm;
import com.vaadin.flow.component.orderedlayout.FlexComponent;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.BeforeEnterEvent;
import com.vaadin.flow.router.BeforeEnterObserver;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.router.RouterLink;
import com.vaadin.flow.server.auth.AnonymousAllowed;

@Route("login")
@PageTitle("Login | Smart Expense Tracker")
@AnonymousAllowed
public class LoginView extends VerticalLayout implements BeforeEnterObserver {

    private final LoginForm loginForm = new LoginForm();

    public LoginView(ThemeManager themeManager) {
        addClassName("login-view");
        setSizeFull();
        setAlignItems(Alignment.CENTER);
        setJustifyContentMode(JustifyContentMode.CENTER);

        loginForm.setAction("login");

        H1 title = new H1("Smart Expense Tracker");
        title.getStyle().set("margin-bottom", "0px").set("font-size", "1.8rem").set("font-weight", "700");

        Paragraph tagline = new Paragraph("Track · Control · Analyze · Predict · Understand");
        tagline.getStyle().set("opacity", "0.75").set("margin-top", "4px").set("font-size", "0.9rem");

        // Theme toggle on login screen
        Button themeBtn = new Button("Toggle Theme", new Icon(VaadinIcon.ADJUST), e -> {
            themeManager.toggleTheme(UI.getCurrent(), null);
        });
        themeBtn.addThemeVariants(ButtonVariant.LUMO_TERTIARY, ButtonVariant.LUMO_SMALL);

        HorizontalLayout registerPrompt = new HorizontalLayout(
                new Span("Don't have an account?"),
                new RouterLink("Register here", RegisterView.class)
        );
        registerPrompt.setAlignItems(Alignment.CENTER);
        registerPrompt.getStyle().set("font-size", "0.9rem").set("margin-top", "12px");

        VerticalLayout card = new VerticalLayout(title, tagline, themeBtn, loginForm, registerPrompt);
        card.setWidth("440px");
        card.setAlignItems(Alignment.CENTER);
        card.setPadding(true);
        card.getStyle()
                .set("background-color", "var(--lumo-base-color)")
                .set("border-radius", "16px")
                .set("box-shadow", "var(--lumo-box-shadow-m)")
                .set("border", "1px solid var(--lumo-contrast-10pct)");

        add(card);
    }

    @Override
    public void beforeEnter(BeforeEnterEvent beforeEnterEvent) {
        if (beforeEnterEvent.getLocation().getQueryParameters().getParameters().containsKey("error")) {
            loginForm.setError(true);
        }
    }
}
