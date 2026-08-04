# College Clubs Module - Implementation Plan

This document outlines the detailed implementation stages for the new **College Clubs** module in Campus-Connect.

## Stage 1: Database Schema & Core Auth (Backend)
- **Club Schema**: Create a separate `Club` collection to store:
  - `email` (primary key for login)
  - `password`
  - `name`, `description`, `profilePhoto`, `bannerPhoto`
  - `assignedStudents` (array of student references with assigned roles)
- **Event Schema**: Create an `Event` model containing:
  - `clubId` (reference to the host club)
  - `title`, `description`, `posterImage`, `contactPerson`, `date`, `time`, `venue`
  - `status` (upcoming, ongoing, completed)
  - `registeredStudents` (array of objects: `{ studentId, attendanceStatus: 'pending'|'present'|'absent', qrCode }`)
- **Announcement Schema**: Create an `Announcement` model containing:
  - `clubId`
  - `title`, `content`, `datePublished`
- **Auth Updates**: Update login logic to allow club representatives to log in using their club email. We will manually seed a dummy club into the database for testing purposes.

## Stage 2: Club Management Portal (Frontend & Backend)
- **Dummy Club Seeding**: A backend script/route to manually seed a dummy club for testing. No UI admin panel is needed at this time.
- **Club Dashboard**: Build the private portal for logged-in clubs.
  - **Profile Customization**: Forms to upload profile photo, banner, and edit the club description.
  - **Member Management**: UI to search and assign students via their UIDs, assigning them roles (e.g., Core Committee, Member).
  - **Event Creation**: A comprehensive form to publish new events (posters, details, contact info).
  - **Announcement Creation**: A simple text editor to publish public announcements.

## Stage 3: Student Portal & Club Discoverability (Frontend)
- **Sidebar Update**: Add a "CLUBS" section to the student sidebar.
- **Clubs Feed/Home**: A main page aggregating all public club announcements and upcoming events.
- **Clubs Directory**: A list/search view to browse all registered clubs.
- **Club Profile Page**: A public-facing page for students to view a specific club's banner, description, members, announcements, and events.

## Stage 4: Event Registration & Dashboard Integration (Frontend & Backend)
- **Registration Flow**: 
  - "Register" button on event cards.
  - Confirmation modal showing event details.
  - Backend route to handle registration, ensuring a student doesn't register twice.
  - Success toast upon registration.
- **Student Dashboard**: Add an "Upcoming Events" widget showing events the student has registered for.
- **Club Event Management**: 
  - Inside the club portal, clicking an event shows a detailed view of registered students.
  - Display extracted student details (UID, Branch, Semester) fetched via population.

## Stage 5: Attendance & QR Code System (Backend & Frontend)
- **QR Code Generation & Email**:
  - Upon successful registration, generate a unique token/QR code for that specific student-event pair.
  - Integrate `nodemailer` to send the QR code via email (SMTP details to be provided).
- **Attendance Scanner**:
  - Build a QR scanner interface in the Club Portal using browser-based HTML5 camera access (e.g., `html5-qrcode`).
  - Backend route to verify the scanned QR code and update the student's status to "present".
- **Post-Event Processing**:
  - A server-side cron job will automatically mark remaining "pending" students as "absent" when the event's scheduled time expires.
  - **Excel Export**: Implement a feature (using a library like `xlsx`) to export the attendee list (Name, UID, Branch, Email, Status) to a downloadable `.xlsx` file from the club portal.


