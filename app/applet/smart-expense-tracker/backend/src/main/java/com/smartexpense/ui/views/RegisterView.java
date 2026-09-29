package com.smartexpense.ui.views;

import com.smartexpense.service.UserService;
import com.smartexpense.ui.theme.ThemeManager;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.button.ButtonVariant;
import com.vaadin.flow.component.formlayout.FormLayout;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.html.Paragraph;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.icon.Icon;
import com.vaadin.flow.component.icon.VaadinIcon;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.notification.NotificationVariant;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.textfield.EmailField;
import com.vaadin.flow.component.textfield.PasswordField;
import com.vaadin.flow.component.textfield.TextField;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.router.RouterLink;
import com.vaadin.flow.server.auth.AnonymousAllowed;

@Route("register")
@PageTitle("Create Account | Smart Expense Tracker")
@AnonymousAllowed
public class RegisterView extends VerticalLayout {

    private final UserService userService;

    public RegisterView(UserService userService, ThemeManager themeManager) {
        this.userService = userService;

        setSizeFull();
        setAlignItems(Alignment.CENTER);
        setJustifyContentMode(JustifyContentMode.CENTER);

        H1 title = new H1("Create Account");
        title.getStyle().set("margin-bottom", "0px").set("font-size", "1.7rem").set("font-weight", "700");

        Paragraph tagline = new Paragraph("Join Smart Expense Tracker with Spending Prediction");
        tagline.getStyle().set("opacity", "0.75").set("margin-top", "4px").set("font-size", "0.9rem");

        TextField nameField = new TextField("Full Name");
        nameField.setRequired(true);
        nameField.setPlaceholder("e.g. Rahul Sharma");
        nameField.setWidthFull();

        EmailField emailField = new EmailField("Email Address");
        emailField.setRequiredIndicatorVisible(true);
        emailField.setPlaceholder("rahul@example.com");
        emailField.setWidthFull();

        PasswordField passwordField = new PasswordField("Password");
        passwordField.setRequired(true);
        passwordField.setWidthFull();
        passwordField.setHelperText("Must be at least 6 characters");

        PasswordField confirmPasswordField = new PasswordField("Confirm Password");
        confirmPasswordField.setRequired(true);
        confirmPasswordField.setWidthFull();

        Button registerBtn = new Button("Register", new Icon(VaadinIcon.USER_CHECK));
        registerBtn.addThemeVariants(ButtonVariant.LUMO_PRIMARY);
        registerBtn.setWidthFull();

        registerBtn.addClickListener(e -> {
            String name = nameField.getValue().trim();
            String email = emailField.getValue().trim();
            String pass = passwordField.getValue();
            String confirm = confirmPasswordField.getValue();

            if (name.isEmpty() || email.isEmpty() || pass.isEmpty()) {
                Notification.show("Please fill in all required fields.", 3000, Notification.Position.MIDDLE)
                        .addThemeVariants(NotificationVariant.LUMO_ERROR);
                return;
            }

            if (emailField.isInvalid()) {
                Notification.show("Please enter a valid email address.", 3000, Notification.Position.MIDDLE)
                        .addThemeVariants(NotificationVariant.LUMO_ERROR);
                return;
            }

            if (pass.length() < 6) {
                Notification.show("Password must have at least 6 characters.", 3000, Notification.Position.MIDDLE)
                        .addThemeVariants(NotificationVariant.LUMO_ERROR);
                return;
            }

            if (!pass.equals(confirm)) {
                Notification.show("Passwords do not match.", 3000, Notification.Position.MIDDLE)
                        .addThemeVariants(NotificationVariant.LUMO_ERROR);
                return;
            }

            if (userService.emailExists(email)) {
                Notification.show("An account with this email already exists.", 3000, Notification.Position.MIDDLE)
                        .addThemeVariants(NotificationVariant.LUMO_ERROR);
                return;
            }

            try {
                userService.registerUser(name, email, pass);
                Notification.show("Registration successful! You can now log in.", 4000, Notification.Position.MIDDLE)
                        .addThemeVariants(NotificationVariant.LUMO_SUCCESS);
                UI.getCurrent().navigate(LoginView.class);
            } catch (Exception ex) {
                Notification.show("Registration failed: " + ex.getMessage(), 3000, Notification.Position.MIDDLE)
                        .addThemeVariants(NotificationVariant.LUMO_ERROR);
            }
        });

        HorizontalLayout loginPrompt = new HorizontalLayout(
                new Span("Already have an account?"),
                new RouterLink("Log in here", LoginView.class)
        );
        loginPrompt.setAlignItems(Alignment.CENTER);
        loginPrompt.getStyle().set("font-size", "0.9rem").set("margin-top", "12px");

        FormLayout form = new FormLayout(nameField, emailField, passwordField, confirmPasswordField, registerBtn);
        form.setWidthFull();

        VerticalLayout card = new VerticalLayout(title, tagline, form, loginPrompt);
        card.setWidth("440px");
        card.setPadding(true);
        card.getStyle()
                .set("background-color", "var(--lumo-base-color)")
                .set("border-radius", "16px")
                .set("box-shadow", "var(--lumo-box-shadow-m)")
                .set("border", "1px solid var(--lumo-contrast-10pct)");

        add(card);
    }
}
