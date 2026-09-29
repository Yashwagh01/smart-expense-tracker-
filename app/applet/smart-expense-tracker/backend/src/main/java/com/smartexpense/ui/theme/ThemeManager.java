package com.smartexpense.ui.theme;

import com.smartexpense.entity.User;
import com.smartexpense.service.UserService;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.theme.lumo.Lumo;
import org.springframework.stereotype.Component;

@Component
public class ThemeManager {

    private final UserService userService;

    public ThemeManager(UserService userService) {
        this.userService = userService;
    }

    public void applyTheme(UI ui, String themePreference) {
        if (ui == null) return;
        boolean isDark = "DARK".equalsIgnoreCase(themePreference);
        if (isDark) {
            ui.getElement().getThemeList().add(Lumo.DARK);
        } else {
            ui.getElement().getThemeList().remove(Lumo.DARK);
        }
    }

    public boolean toggleTheme(UI ui, User currentUser) {
        if (ui == null) return false;
        boolean nowDark = !ui.getElement().getThemeList().contains(Lumo.DARK);
        if (nowDark) {
            ui.getElement().getThemeList().add(Lumo.DARK);
        } else {
            ui.getElement().getThemeList().remove(Lumo.DARK);
        }

        if (currentUser != null) {
            String preference = nowDark ? "DARK" : "LIGHT";
            userService.updateThemePreference(currentUser, preference);
        }
        return nowDark;
    }

    public boolean isDarkTheme(UI ui) {
        return ui != null && ui.getElement().getThemeList().contains(Lumo.DARK);
    }
}
