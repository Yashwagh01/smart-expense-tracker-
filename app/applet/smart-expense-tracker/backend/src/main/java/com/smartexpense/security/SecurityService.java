package com.smartexpense.security;

import com.smartexpense.entity.User;
import com.smartexpense.repository.UserRepository;
import com.vaadin.flow.spring.security.AuthenticationContext;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class SecurityService {

    private final AuthenticationContext authenticationContext;
    private final UserRepository userRepository;

    public SecurityService(AuthenticationContext authenticationContext, UserRepository userRepository) {
        this.authenticationContext = authenticationContext;
        this.userRepository = userRepository;
    }

    public Optional<UserDetails> getAuthenticatedUserDetails() {
        return authenticationContext.getAuthenticatedUser(UserDetails.class);
    }

    public Optional<User> getAuthenticatedUser() {
        return getAuthenticatedUserDetails()
                .flatMap(userDetails -> userRepository.findByEmail(userDetails.getUsername()));
    }

    public void logout() {
        authenticationContext.logout();
    }
}
