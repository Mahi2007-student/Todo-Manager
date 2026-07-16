package com.todo.manager.controller;

import com.todo.manager.model.User;
import com.todo.manager.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @GetMapping("/{userId}")
    public ResponseEntity<?> getUser(@PathVariable Integer userId) {
        try {
            return ResponseEntity.ok(userService.getById(userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{userId}")
    public ResponseEntity<?> updateProfile(@PathVariable Integer userId, @RequestBody User user) {
        try {
            return ResponseEntity.ok(userService.updateProfile(userId, user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{userId}/theme")
    public ResponseEntity<?> updateTheme(@PathVariable Integer userId, @RequestBody Map<String, String> body) {
        try {
            User.Theme theme = User.Theme.valueOf(body.get("theme"));
            return ResponseEntity.ok(userService.updateTheme(userId, theme));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid theme value."));
        }
    }

    @PutMapping("/{userId}/password")
    public ResponseEntity<?> changePassword(@PathVariable Integer userId, @RequestBody Map<String, String> body) {
        try {
            userService.changePassword(userId, body.get("currentPassword"), body.get("newPassword"));
            return ResponseEntity.ok(Map.of("message", "Password updated successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{userId}/profile-picture")
    public ResponseEntity<?> uploadProfilePicture(@PathVariable Integer userId,
                                                    @RequestParam("file") MultipartFile file) {
        try {
            Path dirPath = Paths.get(uploadDir);
            Files.createDirectories(dirPath);

            String original = file.getOriginalFilename();
            String ext = (original != null && original.contains("."))
                    ? original.substring(original.lastIndexOf('.')) : ".jpg";
            String fileName = "user_" + userId + "_" + UUID.randomUUID() + ext;

            Path target = dirPath.resolve(fileName);
            Files.copy(file.getInputStream(), target);

            String publicPath = "/uploads/profile-pictures/" + fileName;
            User updated = userService.updateProfilePicture(userId, publicPath);
            return ResponseEntity.ok(updated);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload image: " + e.getMessage()));
        }
    }
}
