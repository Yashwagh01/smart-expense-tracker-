package com.smartexpense.service;

import com.smartexpense.entity.User;
import com.smartexpense.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public boolean emailExists(String email) {
        return userRepository.existsByEmail(email);
    }

    @Transactional
    public User registerUser(String name, String email, String password) {
        if (emailExists(email)) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }
        String encodedPassword = passwordEncoder.encode(password);
        User user = new User(name, email, encodedPassword);
        return userRepository.save(user);
    }

    @Transactional
    public void updateThemePreference(User user, String themePreference) {
        user.setThemePreference(themePreference);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Transactional
    public void updatePassword(User user, String newPassword) {
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Transactional
    public void updateName(User user, String name) {
        user.setName(name);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
}
