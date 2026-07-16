# Todo List Manager

A full-stack To-Do List Manager built with **Spring Boot (Java)**, **MySQL**, and a **plain HTML/CSS/JavaScript** frontend. It matches the blue login screen + card dashboard design you shared, and covers registration, login, task CRUD, a real calendar with reminders, rewards/badges/stickers, and an editable profile with dark/light theme.

---

## 1. Tech Stack

| Layer      | Technology                                   |
|------------|-----------------------------------------------|
| Frontend   | HTML5, CSS3 (CSS variables for theming), vanilla JavaScript (fetch API) |
| Backend    | Java 17, Spring Boot 3.3 (Web, Data JPA, Validation) |
| Database   | MySQL 8                                       |
| Auth       | Custom (BCrypt password hashing), no session framework — the logged-in user is kept in `localStorage` on the frontend and passed as a path variable to the API |

---

## 2. Project Structure

```
todo-list-manager/
├── pom.xml
├── src/main/java/com/todo/manager/
│   ├── TodoManagerApplication.java
│   ├── config/WebConfig.java          # CORS + static file serving + BCrypt bean
│   ├── model/                         # User, Task, Reward, Notification (JPA entities)
│   ├── repository/                    # Spring Data JPA repositories
│   ├── service/                       # Business logic (registration, tasks, rewards, reminders)
│   └── controller/                    # REST endpoints (/api/...)
└── src/main/resources/
    ├── application.properties         # DB connection — EDIT THIS FIRST
    └── static/                        # Frontend — served directly by Spring Boot
        ├── index.html                 # Redirects to login or dashboard
        ├── login.html
        ├── register.html
        ├── dashboard.html
        ├── calendar.html
        ├── profile.html
        ├── css/style.css
        ├── js/ (common.js, dashboard.js, calendar.js, profile.js)
        └── img/default-profile.png
```

---

## 3. Database Setup

Open MySQL Workbench / CLI and run **exactly the SQL you already wrote**:

```sql
CREATE DATABASE todo_db;
USE todo_db;

CREATE TABLE users ( ... );        -- (your original schema)
CREATE TABLE tasks ( ... );
CREATE TABLE rewards ( ... );
CREATE TABLE notifications ( ... );
```

> You don't strictly have to run this by hand — `spring.jpa.hibernate.ddl-auto=update` in `application.properties` will create/adjust the tables automatically from the JPA entities the first time the app starts, using the same column names and types. Running your own SQL first is still a good idea for full control, and both approaches converge on the same schema.

---

## 4. Configure the Backend

Open `src/main/resources/application.properties` and set your MySQL password:

```properties
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

---

## 5. Run the Backend

From the project root (with Java 17+ and Maven installed):

```bash
mvn spring-boot:run
```

Or import the folder into **IntelliJ IDEA / Eclipse / Spring Tool Suite** as a Maven project and run `TodoManagerApplication.java` directly.

The app starts on **http://localhost:8080**.

---

## 6. Open the App

Since the frontend lives in `src/main/resources/static/`, Spring Boot serves it automatically — no separate frontend server needed.

Just visit:

```
http://localhost:8080
```

You'll land on the login page (blue hero design). Click **Register** to create an account, or log in if you already have one.

---

## 7. How Each Feature Maps to the Code

| Feature (from your spec)                         | Where it lives |
|----------------------------------------------------|----------------|
| Register → Login → Dashboard flow                 | `register.html`, `login.html`, `AuthController` |
| Add / Edit / Delete / Complete tasks               | `dashboard.html` + `js/dashboard.js` → `TaskController` / `TaskService` |
| Total / Completed / Pending stats + progress bar   | `GET /api/tasks/user/{id}/stats` |
| Dark / Light theme (persisted to DB, applies app-wide) | `profile.html` toggle → `PUT /api/users/{id}/theme`, stored in `users.theme`, applied via `data-theme` attribute + CSS variables in `style.css` |
| Rewards, badges, stickers                          | Awarded automatically in `TaskService.toggleStatus()` — 10 pts per completed task, bonus "sticker" badge every 5 completions. Shown via `RewardController` |
| Calendar with reminders + notifications             | `calendar.html` (month grid, click a day to see/add tasks) + `NotificationService.checkAndGenerateReminders()`, polled every 60s from the dashboard bell icon |
| Profile edit (name, pic, age/DOB, country, email, phone) | `profile.html` + `UserController` (`PUT /api/users/{id}`, photo upload via `POST /api/users/{id}/profile-picture`) |
| MySQL storage (`todo_db`)                          | `application.properties` + JPA entities mirroring your exact schema |

---

## 8. Notes & Next Steps

- **Auth simplicity**: for a beginner CRUD project, the logged-in user's info is kept in the browser's `localStorage` after login and used to call the API. If you want proper session/token security later, add Spring Security + JWT — the REST endpoints are already structured to make that swap straightforward.
- **Reminders**: the browser polls `/api/notifications/user/{id}/check` every 60 seconds while the dashboard is open, which scans your pending tasks and creates a notification once a task enters its reminder window (or becomes overdue). For real push notifications (even when the tab is closed), you'd add the browser Notifications API or a backend scheduler + email/SMS service — good stretch goal once the core CRUD is solid.
- **Profile pictures** are saved to an `uploads/profile-pictures/` folder next to wherever you run the app, and served back at `/uploads/profile-pictures/...`.
