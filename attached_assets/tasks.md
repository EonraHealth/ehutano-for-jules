# ehutano+ MVP Development Plan

This document outlines a granular, step-by-step plan for building the Minimum Viable Product (MVP) of the ehutano+ platform, based on the "ehutano+ Full Stack Architecture Blueprint". Each task is designed to be small, testable, and focus on a single concern.

## Phase 1: Backend - Core Setup

**Task ID:** BE-CORE-001
**Description:** Initialize FastAPI Project.
**Focus:** Basic project structure for the backend.
**Start Criteria:** Python and FastAPI installed.
**End Criteria/Deliverable:** A minimal FastAPI application that can run. `backend/app/main.py` created.
**Test Hint:** Run `uvicorn app.main:app --reload` and see the default FastAPI message in a browser.

**Task ID:** BE-CORE-002
**Description:** Configure Basic Logging.
**Focus:** Initial logging setup for easier debugging.
**Start Criteria:** BE-CORE-001 completed.
**End Criteria/Deliverable:** Standard Python logging configured in `app/main.py` or a dedicated logging config file.
**Test Hint:** Add a log message on app startup and verify it appears in the console.

**Task ID:** BE-CORE-003
**Description:** Setup PostgreSQL Database (manual or via Docker).
**Focus:** Ensuring a PostgreSQL instance is ready for the application.
**Start Criteria:** PostgreSQL installed or Docker available.
**End Criteria/Deliverable:** A running PostgreSQL server with a dedicated database created for ehutano+.
**Test Hint:** Connect to the database using a tool like `psql` or pgAdmin.

**Task ID:** BE-CORE-004
**Description:** Implement SQLAlchemy Core Setup (`app/db/session.py`, `app/core/config.py`).
**Focus:** Establishing database connection from FastAPI.
**Start Criteria:** BE-CORE-003 completed. FastAPI project initialized.
**End Criteria/Deliverable:** SQLAlchemy engine and sessionmaker configured. Database URL managed via `app/core/config.py` (reading from environment variables).
**Test Hint:** Write a small script or test within FastAPI to attempt a connection.

**Task ID:** BE-CORE-005
**Description:** Define Base SQLAlchemy Model (`app/db/base.py`).
**Focus:** Creating a base class for all ORM models, potentially including common columns like `id`, `created_at`, `updated_at`.
**Start Criteria:** BE-CORE-004 completed.
**End Criteria/Deliverable:** `Base` class defined in `app/db/base.py`.
**Test Hint:** This is a foundational step, direct test might be part of model creation.

**Task ID:** BE-CORE-006
**Description:** Create `.env` for Configuration & Load in FastAPI.
**Focus:** Managing environment variables for sensitive data and configurations.
**Start Criteria:** BE-CORE-001 completed.
**End Criteria/Deliverable:** A `.env` file at the root of the `backend/` directory. FastAPI settings (e.g., `DATABASE_URL`) loaded from this file using Pydantic's `Settings` or `python-dotenv`.
**Test Hint:** Print a config value on app startup to ensure it's loaded correctly from `.env`.

**Task ID:** BE-CORE-007
**Description:** Implement Basic Health Check Endpoint (`/health`).
**Focus:** A simple endpoint to verify the backend application is running.
**Start Criteria:** BE-CORE-001 completed.
**End Criteria/Deliverable:** A `GET /health` endpoint in `app/main.py` or a dedicated router that returns a 200 OK response.
**Test Hint:** Access `/health` via a browser or `curl` and check for a success response.

**Task ID:** BE-CORE-008
**Description:** Dockerize Backend Application (FastAPI).
**Focus:** Creating a Dockerfile for the backend.
**Start Criteria:** BE-CORE-001 completed. Docker installed.
**End Criteria/Deliverable:** A `Dockerfile` in the `backend/` directory that can build and run the FastAPI application.
**Test Hint:** Build the Docker image and run the container. Access the health check endpoint.

**Task ID:** BE-CORE-009
**Description:** Setup `docker-compose.yml` for Backend & DB.
**Focus:** Orchestrating backend and database services for local development.
**Start Criteria:** BE-CORE-003, BE-CORE-008 completed.
**End Criteria/Deliverable:** A `docker-compose.yml` file at the project root that starts the FastAPI backend container and a PostgreSQL container, with networking.
**Test Hint:** Run `docker-compose up`. Verify both services start and the backend can connect to the DB (test via health check or a temporary DB connection test endpoint).

## Phase 2: Backend - User Model & Schemas (Patient Focus)

**Task ID:** BE-AUTH-001
**Description:** Define `User` SQLAlchemy Model (`app/models/user.py`).
**Focus:** Database representation for users.
**Start Criteria:** BE-CORE-005 completed.
**End Criteria/Deliverable:** `User` model class in `app/models/user.py` with fields: `id` (PK), `email` (unique), `hashed_password`, `full_name`, `role` (e.g., String or Enum), `is_active` (Boolean). Import `Base` from `app.db.base`.
**Test Hint:** This is a schema definition; testing occurs with migrations and CRUD.

**Task ID:** BE-AUTH-002
**Description:** Define Pydantic Schema for User Creation (`UserCreate` in `app/schemas/user.py`).
**Focus:** Data validation for user registration payload.
**Start Criteria:** Basic understanding of Pydantic.
**End Criteria/Deliverable:** `UserCreate` schema in `app/schemas/user.py` with fields: `email`, `password`, `full_name`.
**Test Hint:** Instantiate the schema with sample data in a Python interpreter to check validation.

**Task ID:** BE-AUTH-003
**Description:** Define Pydantic Schema for User Read (`UserRead` in `app/schemas/user.py`).
**Focus:** Data shape for returning user information (excluding sensitive data like password).
**Start Criteria:** BE-AUTH-001 completed.
**End Criteria/Deliverable:** `UserRead` schema in `app/schemas/user.py` with fields: `id`, `email`, `full_name`, `role`, `is_active`.
**Test Hint:** Instantiate the schema with sample data.

**Task ID:** BE-AUTH-004
**Description:** Define Pydantic Schema for Token (`Token` and `TokenData` in `app/schemas/token.py`).
**Focus:** Data shape for JWT access token and its payload.
**Start Criteria:** Basic understanding of Pydantic.
**End Criteria/Deliverable:** `Token` schema (e.g., `access_token: str`, `token_type: str`) and `TokenData` schema (e.g., `email: Optional[str] = None` or `user_id: Optional[int] = None`) in `app/schemas/token.py`.
**Test Hint:** Instantiate schemas with sample data.

**Task ID:** BE-AUTH-005
**Description:** Setup Alembic for Database Migrations.
**Focus:** Tooling for managing database schema changes.
**Start Criteria:** BE-CORE-004 completed. SQLAlchemy models directory (`app/models`) exists.
**End Criteria/Deliverable:** Alembic initialized in the `backend/` directory (`alembic init alembic`). `alembic/env.py` configured to use SQLAlchemy base metadata.
**Test Hint:** Run `alembic revision -m "initial"` (without generating actual migration yet) to see if setup is okay.

**Task ID:** BE-AUTH-006
**Description:** Create Initial Alembic Migration for User Table.
**Focus:** Generating and applying the first database migration.
**Start Criteria:** BE-AUTH-001, BE-AUTH-005 completed. `User` model defined.
**End Criteria/Deliverable:** An Alembic migration file generated that creates the `users` table. Database schema updated after running `alembic upgrade head`.
**Test Hint:** Inspect the database (e.g., via `psql`) to confirm the `users` table exists with correct columns.

## Phase 3: Backend - Patient Registration

**Task ID:** BE-AUTH-007
**Description:** Implement Password Hashing Utilities (`app/core/security.py`).
**Focus:** Securely handling passwords.
**Start Criteria:** Understanding of password hashing (e.g., bcrypt or passlib).
**End Criteria/Deliverable:** Functions `verify_password(plain_password, hashed_password)` and `get_password_hash(password)` in `app/core/security.py`.
**Test Hint:** Write a standalone script or a Pytest unit test to hash a password and verify it.

**Task ID:** BE-AUTH-008
**Description:** Implement CRUD function `create_user(db: Session, user: schemas.UserCreate)` in `app/crud/crud_user.py`.
**Focus:** Logic to insert a new user into the database.
**Start Criteria:** BE-AUTH-001, BE-AUTH-002, BE-AUTH-007 completed. DB session available.
**End Criteria/Deliverable:** `create_user` function that takes user creation schema, hashes the password, creates a `models.User` instance, and saves it to the DB.
**Test Hint:** Write a Pytest unit test (can be an integration test with a test DB) to call this function and verify user creation.

**Task ID:** BE-AUTH-009
**Description:** Implement `user_service.register_patient(db: Session, user_data: schemas.UserCreate)` in `app/services/user_service.py`.
**Focus:** Business logic for patient registration, potentially setting default role.
**Start Criteria:** BE-AUTH-008 completed.
**End Criteria/Deliverable:** `register_patient` function that calls `crud_user.create_user`. It should ensure the `role` is set to "PATIENT". Handle potential duplicate email errors.
**Test Hint:** Pytest unit test for this service function, mocking the CRUD call or using a test DB.

**Task ID:** BE-AUTH-010
**Description:** Create API Endpoint `POST /api/v1/auth/register/patient` in `app/api/v1/auth.py`.
**Focus:** Exposing patient registration functionality via API.
**Start Criteria:** BE-AUTH-009 completed. FastAPI routing setup.
**End Criteria/Deliverable:** Endpoint that accepts `UserCreate` data, calls `user_service.register_patient`, and returns the created user (using `UserRead` schema) or an error.
**Test Hint:** Use `curl` or Postman to send a registration request. Check DB for new user and verify response.

**Task ID:** BE-AUTH-011
**Description:** Add Unit Test for Password Hashing Utilities.
**Focus:** Ensuring password utilities work as expected.
**Start Criteria:** BE-AUTH-007 completed. Pytest setup.
**End Criteria/Deliverable:** Pytest tests for `verify_password` and `get_password_hash`.
**Test Hint:** Run `pytest`.

**Task ID:** BE-AUTH-012
**Description:** Add Unit/Integration Test for `crud_user.create_user`.
**Focus:** Verifying database interaction for user creation.
**Start Criteria:** BE-AUTH-008 completed. Pytest setup, potentially with test DB fixture.
**End Criteria/Deliverable:** Pytest tests for `crud_user.create_user`.
**Test Hint:** Run `pytest`.

**Task ID:** BE-AUTH-013
**Description:** Add Integration Test for Patient Registration Endpoint.
**Focus:** End-to-end testing of the registration flow.
**Start Criteria:** BE-AUTH-010 completed. FastAPI test client setup in Pytest.
**End Criteria/Deliverable:** Pytest integration test that sends a POST request to the registration endpoint and verifies the response and database state.
**Test Hint:** Run `pytest`.

## Phase 4: Backend - Patient Login

**Task ID:** BE-AUTH-014
**Description:** Implement JWT Token Creation Utility (`create_access_token` in `app/core/security.py`).
**Focus:** Generating JWTs for authenticated users.
**Start Criteria:** BE-AUTH-004 (TokenData schema), understanding of JWTs (e.g., `python-jose`). `SECRET_KEY` and `ALGORITHM` in config.
**End Criteria/Deliverable:** `create_access_token(data: dict, expires_delta: Optional[timedelta] = None)` function.
**Test Hint:** Unit test to create a token and decode it (locally, without full auth flow).

**Task ID:** BE-AUTH-015
**Description:** Implement `user_service.authenticate_user(db: Session, email: str, password: str)` in `app/services/user_service.py`.
**Focus:** Business logic for authenticating a user.
**Start Criteria:** `crud_user.get_user_by_email` (to be created), `security.verify_password` completed.
**End Criteria/Deliverable:** `authenticate_user` function that fetches user by email, verifies password, and returns `models.User` or `None`. (Helper: `crud_user.get_user_by_email(db, email)` to be created first).
**Test Hint:** Pytest unit test for this service, mocking CRUD or using test DB.

**Task ID:** BE-AUTH-016
**Description:** Create API Endpoint `POST /api/v1/auth/login` in `app/api/v1/auth.py`.
**Focus:** Exposing login functionality.
**Start Criteria:** BE-AUTH-014, BE-AUTH-015 completed. FastAPI `OAuth2PasswordRequestForm` for form data.
**End Criteria/Deliverable:** Endpoint that accepts email/password (form data), calls `user_service.authenticate_user`, and if successful, returns a JWT using `Token` schema.
**Test Hint:** Use `curl` or Postman with form data. Verify JWT is returned for valid credentials.

**Task ID:** BE-AUTH-017
**Description:** Add Unit Test for `user_service.authenticate_user`.
**Focus:** Testing authentication logic.
**Start Criteria:** BE-AUTH-015 completed. Need `crud_user.get_user_by_email` first.
**End Criteria/Deliverable:** Pytest tests for `authenticate_user` (valid and invalid credentials).
**Test Hint:** Run `pytest`. (Remember to implement `crud_user.get_user_by_email` and its test).

**Task ID:** BE-AUTH-018
**Description:** Add Integration Test for Login Endpoint.
**Focus:** End-to-end testing of login.
**Start Criteria:** BE-AUTH-016 completed. A test user registered in the test DB.
**End Criteria/Deliverable:** Pytest integration test for the login endpoint.
**Test Hint:** Run `pytest`.

## Phase 5: Backend - Protected Route & Current User

**Task ID:** BE-AUTH-019
**Description:** Implement JWT Token Decoding and User Retrieval Dependency (`get_current_user` in `app/core/security.py` or `app/api/dependencies.py`).
**Focus:** Authenticating requests using JWT and providing current user object.
**Start Criteria:** BE-AUTH-014 (token creation), `TokenData` schema, `crud_user.get_user_by_email` (or by ID) completed. `OAuth2PasswordBearer`.
**End Criteria/Deliverable:** A FastAPI dependency that extracts token from header, decodes it, validates, and fetches the user from DB. Raises HTTPExceptions for errors.
**Test Hint:** Test as part of the `/me` endpoint integration test.

**Task ID:** BE-AUTH-020
**Description:** Create API Endpoint `GET /api/v1/auth/me` in `app/api/v1/auth.py`.
**Focus:** Allowing authenticated users to fetch their own details.
**Start Criteria:** BE-AUTH-019 completed. `UserRead` schema.
**End Criteria/Deliverable:** Endpoint protected by `get_current_user` dependency, returns the current user's details.
**Test Hint:** Integration test: call with valid token, invalid token, and no token.

**Task ID:** BE-AUTH-021
**Description:** Add Integration Test for `/me` Endpoint.
**Focus:** Testing the protected route and user retrieval.
**Start Criteria:** BE-AUTH-020 completed.
**End Criteria/Deliverable:** Pytest integration tests for `/me`.
**Test Hint:** Run `pytest`.

## Phase 6: Backend - Medicine Listing (Patient Portal MVP Feature)

**Task ID:** BE-MED-001
**Description:** Define `Medicine` SQLAlchemy Model (`app/models/medicine.py`).
**Focus:** Database representation for medicines.
**Start Criteria:** BE-CORE-005 completed.
**End Criteria/Deliverable:** `Medicine` model with fields like `id`, `name`, `generic_name`, `category`, `description`, `requires_prescription`, `default_image_url`.
**Test Hint:** Schema definition, tested with migration.

**Task ID:** BE-MED-002
**Description:** Define Pydantic Schema for Medicine Read (`MedicineRead` in `app/schemas/medicine.py`).
**Focus:** Data shape for returning medicine information.
**Start Criteria:** BE-MED-001 completed.
**End Criteria/Deliverable:** `MedicineRead` schema reflecting model fields.
**Test Hint:** Instantiate schema with sample data.

**Task ID:** BE-MED-003
**Description:** Create Alembic Migration for Medicine Table.
**Focus:** Updating database schema to include medicines.
**Start Criteria:** BE-MED-001, BE-AUTH-005 completed.
**End Criteria/Deliverable:** Alembic migration file for `medicines` table. DB schema updated via `alembic upgrade head`.
**Test Hint:** Inspect DB for `medicines` table.

**Task ID:** BE-MED-004
**Description:** Implement CRUD function `get_medicines(db: Session, skip: int = 0, limit: int = 100)` in `app/crud/crud_medicine.py`.
**Focus:** Logic to retrieve a list of medicines from the database with pagination.
**Start Criteria:** BE-MED-001 completed.
**End Criteria/Deliverable:** `get_medicines` function.
**Test Hint:** Unit/integration test for this CRUD function.

**Task ID:** BE-MED-005
**Description:** Implement `medicine_service.list_medicines(db: Session, skip: int, limit: int)` in `app/services/medicine_service.py`.
**Focus:** Business logic for listing medicines.
**Start Criteria:** BE-MED-004 completed.
**End Criteria/Deliverable:** `list_medicines` service function calling the CRUD function.
**Test Hint:** Unit test for this service.

**Task ID:** BE-MED-006
**Description:** Create API Endpoint `GET /api/v1/patient/medicines` in `app/api/v1/patient_portal.py`.
**Focus:** Publicly accessible API to list medicines.
**Start Criteria:** BE-MED-005 completed.
**End Criteria/Deliverable:** Endpoint that calls `medicine_service.list_medicines` and returns a list of medicines.
**Test Hint:** Integration test. Call via `curl` or Postman.

**Task ID:** BE-MED-007
**Description:** Add Seed Data for Medicines.
**Focus:** Populating the database with initial medicine data for testing and MVP.
**Start Criteria:** BE-MED-003 completed (medicine table exists).
**End Criteria/Deliverable:** A script (e.g., using SQLAlchemy directly, or an Alembic data migration) to insert sample medicines.
**Test Hint:** Query the API or DB to see the seeded medicines.

**Task ID:** BE-MED-008
**Description:** Add Unit/Integration Test for `crud_medicine.get_medicines`.
**Focus:** Verifying medicine data retrieval.
**Start Criteria:** BE-MED-004 completed.
**End Criteria/Deliverable:** Pytest tests.
**Test Hint:** Run `pytest`.

**Task ID:** BE-MED-009
**Description:** Add Integration Test for Medicine Listing Endpoint.
**Focus:** End-to-end testing of medicine listing.
**Start Criteria:** BE-MED-006, BE-MED-007 completed.
**End Criteria/Deliverable:** Pytest integration test.
**Test Hint:** Run `pytest`.

## Phase 7: Frontend - Core Setup (React)

**Task ID:** FE-CORE-001
**Description:** Initialize React Project (e.g., using Vite: `npm create vite@latest frontend -- --template react`).
**Focus:** Basic React application structure.
**Start Criteria:** Node.js and npm/yarn installed.
**End Criteria/Deliverable:** A runnable React application in the `frontend/` directory.
**Test Hint:** Run `npm run dev` (or `yarn dev`) and see the default React page.

**Task ID:** FE-CORE-002
**Description:** Setup Basic Folder Structure (as per architecture doc).
**Focus:** Organizing frontend code.
**Start Criteria:** FE-CORE-001 completed.
**End Criteria/Deliverable:** Directories like `src/components`, `src/pages`, `src/services`, `src/contexts`, `src/assets`, `src/hooks`, `src/routes`, `src/utils` created.
**Test Hint:** Verify folder structure.

**Task ID:** FE-CORE-003
**Description:** Implement Basic Routing Setup (`react-router-dom`).
**Focus:** Enabling navigation between different pages.
**Start Criteria:** FE-CORE-001 completed. `react-router-dom` installed.
**End Criteria/Deliverable:** `BrowserRouter` setup in `src/index.js` or `src/App.js`. Define routes for a Home Page, Medicines Page, Login Page, Registration Page (placeholders initially).
**Test Hint:** Navigate between the placeholder pages in the browser.

**Task ID:** FE-CORE-004
**Description:** Create Basic Layout Components (`Navbar`, `Footer` placeholders).
**Focus:** Common UI structure for pages.
**Start Criteria:** FE-CORE-002 completed.
**End Criteria/Deliverable:** Simple `Navbar.js` and `Footer.js` components in `src/components/layout/`. `App.js` uses them to wrap routed content.
**Test Hint:** See Navbar and Footer on all pages.

**Task ID:** FE-CORE-005
**Description:** Setup API Service Module (`src/services/api.js`).
**Focus:** Centralized API communication setup.
**Start Criteria:** `axios` installed (optional, can use `fetch`).
**End Criteria/Deliverable:** `api.js` exporting a configured Axios instance (or fetch wrapper) with `baseURL` set to backend URL (e.g., `http://localhost:8000/api/v1` from an environment variable like `VITE_API_BASE_URL`).
**Test Hint:** Make a test call to the backend's `/health` endpoint from a component.

## Phase 8: Frontend - Medicine Listing

**Task ID:** FE-MED-001
**Description:** Create `MedicineListPage.js` component in `src/pages/`.
**Focus:** Page to display the list of medicines.
**Start Criteria:** FE-CORE-003 (routing to this page).
**End Criteria/Deliverable:** A basic functional component.
**Test Hint:** Navigate to the medicines page and see placeholder content.

**Task ID:** FE-MED-002
**Description:** Create `MedicineCard.js` component in `src/components/features/patient-portal/` (or `src/components/medicines/`).
**Focus:** Reusable component to display individual medicine information.
**Start Criteria:** Basic React component knowledge.
**End Criteria/Deliverable:** Component that accepts medicine data as props and displays it.
**Test Hint:** Render it with mock data in `MedicineListPage` or Storybook.

**Task ID:** FE-MED-003
**Description:** Implement `medicineService.js` in `src/services/` to fetch medicines.
**Focus:** Frontend logic to call the backend medicine listing API.
**Start Criteria:** FE-CORE-005 (api.js setup), BE-MED-006 (backend endpoint ready).
**End Criteria/Deliverable:** A function `getMedicines()` in `medicineService.js` that calls `GET /patient/medicines` using the api instance.
**Test Hint:** Call this function from `MedicineListPage` and log the result.

**Task ID:** FE-MED-004
**Description:** `MedicineListPage` calls `medicineService` and displays medicines using `MedicineCard`.
**Focus:** Integrating API data with UI components.
**Start Criteria:** FE-MED-001, FE-MED-002, FE-MED-003 completed.
**End Criteria/Deliverable:** Medicines fetched from backend are displayed on the page.
**Test Hint:** Verify medicines (seeded in backend) appear on the page.

**Task ID:** FE-MED-005
**Description:** Add basic loading and error state handling for medicine list.
**Focus:** Improving UX for API calls.
**Start Criteria:** FE-MED-004 completed.
**End Criteria/Deliverable:** `MedicineListPage` shows a loading indicator while fetching and an error message if the API call fails.
**Test Hint:** Simulate loading (e.g., delay) and API error to check UI.

**Task ID:** FE-MED-006
**Description:** Style Medicine List Page and Card (basic styling).
**Focus:** Basic visual presentation.
**Start Criteria:** FE-MED-004 completed. CSS or a utility library like Tailwind CSS setup.
**End Criteria/Deliverable:** A presentable, though not final, layout for the medicine list.
**Test Hint:** Visual inspection.

## Phase 9: Frontend - Patient Registration

**Task ID:** FE-AUTH-001
**Description:** Create `RegistrationPage.js` component in `src/pages/auth/` with a form.
**Focus:** UI for user registration.
**Start Criteria:** FE-CORE-003 (routing).
**End Criteria/Deliverable:** Form with fields for full name, email, and password. State to manage form inputs.
**Test Hint:** View the page and interact with form fields.

**Task ID:** FE-AUTH-002
**Description:** Implement `authService.js` in `src/services/` function for patient registration.
**Focus:** Frontend logic to call backend registration API.
**Start Criteria:** FE-CORE-005 (api.js), BE-AUTH-010 (backend endpoint ready).
**End Criteria/Deliverable:** `registerPatient(userData)` function in `authService.js` calling `POST /auth/register/patient`.
**Test Hint:** Call from `RegistrationPage` and check network request/backend logs.

**Task ID:** FE-AUTH-003
**Description:** `RegistrationPage` calls `authService.registerPatient` on form submission.
**Focus:** Connecting UI form to API call.
**Start Criteria:** FE-AUTH-001, FE-AUTH-002 completed.
**End Criteria/Deliverable:** Form submission triggers the API call.
**Test Hint:** Attempt registration and check backend for new user.

**Task ID:** FE-AUTH-004
**Description:** Handle success (e.g., redirect to login, show message) and error responses from registration API.
**Focus:** User feedback for registration.
**Start Criteria:** FE-AUTH-003 completed.
**End Criteria/Deliverable:** User sees appropriate messages or redirection.
**Test Hint:** Test successful registration and error cases (e.g., duplicate email).

**Task ID:** FE-AUTH-005
**Description:** Add basic form validation (e.g., required fields, email format).
**Focus:** Client-side input validation.
**Start Criteria:** FE-AUTH-001 completed.
**End Criteria/Deliverable:** Visual feedback for invalid inputs before submission.
**Test Hint:** Try submitting empty form or invalid email.

## Phase 10: Frontend - Patient Login & Auth State

**Task ID:** FE-AUTH-006
**Description:** Create `LoginPage.js` component in `src/pages/auth/` with a form.
**Focus:** UI for user login.
**Start Criteria:** FE-CORE-003 (routing).
**End Criteria/Deliverable:** Form with email and password fields. State to manage inputs.
**Test Hint:** View page and interact with form.

**Task ID:** FE-AUTH-007
**Description:** `authService.js` - implement login function.
**Focus:** Frontend logic for backend login API call.
**Start Criteria:** FE-CORE-005 (api.js), BE-AUTH-016 (backend endpoint ready).
**End Criteria/Deliverable:** `login(credentials)` function in `authService.js` calling `POST /auth/login`.
**Test Hint:** Call from `LoginPage` and check network request/backend logs.

**Task ID:** FE-AUTH-008
**Description:** `LoginPage` calls `authService.login` on form submission.
**Focus:** Connecting UI form to login API call.
**Start Criteria:** FE-AUTH-006, FE-AUTH-007 completed.
**End Criteria/Deliverable:** Form submission triggers login API call.
**Test Hint:** Attempt login with valid/invalid credentials.

**Task ID:** FE-AUTH-009
**Description:** On successful login, store JWT (e.g., in `localStorage` or `sessionStorage`).
**Focus:** Persisting authentication token.
**Start Criteria:** FE-AUTH-008 completed.
**End Criteria/Deliverable:** JWT from login response is stored.
**Test Hint:** Check browser's `localStorage` after successful login.

**Task ID:** FE-AUTH-010
**Description:** Create Auth Context (`AuthContext.js` in `src/contexts/`).
**Focus:** Global state management for authentication.
**Start Criteria:** Understanding of React Context API.
**End Criteria/Deliverable:** `AuthContext` providing `isAuthenticated`, `user`, `token`, and functions like `loginUser`, `logoutUser`.
**Test Hint:** Wrap `App` with `AuthProvider`.

**Task ID:** FE-AUTH-011
**Description:** Update `App.js` to use `AuthProvider`.
**Focus:** Making auth state available globally.
**Start Criteria:** FE-AUTH-010 completed.
**End Criteria/Deliverable:** `App` component is wrapped by `AuthProvider`.
**Test Hint:** Access context values in a test component.

**Task ID:** FE-AUTH-012
**Description:** On login success, update `AuthContext` with user data (if returned) and token. Redirect to a protected page (e.g., a simple Dashboard placeholder).
**Focus:** Updating global auth state and navigating user.
**Start Criteria:** FE-AUTH-008, FE-AUTH-010 completed. `react-router-dom` `useNavigate`.
**End Criteria/Deliverable:** AuthContext reflects logged-in state. User is redirected.
**Test Hint:** Login and check redirection and context state (e.g., via React DevTools).

**Task ID:** FE-AUTH-013
**Description:** Implement logout functionality (clears JWT, updates `AuthContext`).
**Focus:** Allowing users to sign out.
**Start Criteria:** FE-AUTH-009, FE-AUTH-010 completed.
**End Criteria/Deliverable:** A logout button/link that clears token and updates context. User is redirected to login or home.
**Test Hint:** Login, then logout. Verify token is cleared and context updated.

**Task ID:** FE-AUTH-014
**Description:** Add `authService.js` function to fetch current user (`GET /auth/me`).
**Focus:** Retrieving authenticated user details.
**Start Criteria:** BE-AUTH-020 (backend endpoint), FE-CORE-005 (api.js). Token needs to be sent in header.
**End Criteria/Deliverable:** `getCurrentUser()` function in `authService.js` that includes JWT in Authorization header.
**Test Hint:** Call this after login and verify user data.

**Task ID:** FE-AUTH-015
**Description:** On app load, if token exists, try to fetch current user and update `AuthContext`.
**Focus:** Maintaining login state across page reloads.
**Start Criteria:** FE-AUTH-009, FE-AUTH-010, FE-AUTH-014 completed.
**End Criteria/Deliverable:** In `AuthProvider` or `App.js`, check for token on mount, call `getCurrentUser`, and update context.
**Test Hint:** Login, refresh page, verify still logged in.

## Phase 11: Frontend - Protected Routes & UI Updates

**Task ID:** FE-AUTH-016
**Description:** Create a `ProtectedRoute.js` component.
**Focus:** Restricting access to certain routes based on authentication state.
**Start Criteria:** FE-AUTH-010 (AuthContext), `react-router-dom`.
**End Criteria/Deliverable:** Component that checks `AuthContext` for `isAuthenticated`. If not, redirects to `/login`. Otherwise, renders child components.
**Test Hint:** Try accessing a protected route when logged out and logged in.

**Task ID:** FE-AUTH-017
**Description:** Create a simple `DashboardPage.js` (placeholder) and protect it using `ProtectedRoute`.
**Focus:** Example of a route requiring authentication.
**Start Criteria:** FE-AUTH-016 completed.
**End Criteria/Deliverable:** `DashboardPage` accessible only to logged-in users.
**Test Hint:** Test navigation to dashboard page.

**Task ID:** FE-AUTH-018
**Description:** Update Navbar to show Login/Register or User Info/Logout based on `AuthContext`.
**Focus:** Dynamically changing UI based on auth state.
**Start Criteria:** FE-CORE-004 (Navbar), FE-AUTH-010 (AuthContext).
**End Criteria/Deliverable:** Navbar content adapts to user's authentication status.
**Test Hint:** Observe Navbar changes after login/logout.

This plan provides a detailed roadmap for the MVP. Each step builds upon the previous ones, ensuring a testable and incremental development process.
