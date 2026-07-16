package com.todo.manager.service;

import com.todo.manager.model.User;
import com.todo.manager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User register(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email is already registered.");
        }
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new IllegalArgumentException("Username is already taken.");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public Optional<User> login(String email, String rawPassword) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent() && passwordEncoder.matches(rawPassword, userOpt.get().getPassword())) {
            return userOpt;
        }
        return Optional.empty();
    }

    public User getById(Integer userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
    }

    public User updateProfile(Integer userId, User updated) {
        User existing = getById(userId);
        existing.setFullName(updated.getFullName());
        existing.setPhone(updated.getPhone());
        existing.setCountry(updated.getCountry());
        existing.setGender(updated.getGender());
        existing.setDob(updated.getDob());
        // Email/username changes are allowed but must stay unique
        if (updated.getEmail() != null && !updated.getEmail().equals(existing.getEmail())) {
            if (userRepository.existsByEmail(updated.getEmail())) {
                throw new IllegalArgumentException("Email is already in use.");
            }
            existing.setEmail(updated.getEmail());
        }
        if (updated.getUsername() != null && !updated.getUsername().equals(existing.getUsername())) {
            if (userRepository.existsByUsername(updated.getUsername())) {
                throw new IllegalArgumentException("Username is already in use.");
            }
            existing.setUsername(updated.getUsername());
        }
        return userRepository.save(existing);
    }

    public User updateProfilePicture(Integer userId, String fileName) {
        User existing = getById(userId);
        existing.setProfilePicture(fileName);
        return userRepository.save(existing);
    }

    public User updateTheme(Integer userId, User.Theme theme) {
        User existing = getById(userId);
        existing.setTheme(theme);
        return userRepository.save(existing);
    }

    public User changePassword(Integer userId, String currentPassword, String newPassword) {
        User existing = getById(userId);
        if (!passwordEncoder.matches(currentPassword, existing.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }
        existing.setPassword(passwordEncoder.encode(newPassword));
        return userRepository.save(existing);
    }
}
