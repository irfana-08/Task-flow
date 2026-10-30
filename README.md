# TaskFlow - Modern To-Do List with Google Auth & Urgency Highlighting

A responsive To-Do List web application built with **HTML5**, **CSS3**, and **Modern JavaScript (ES6+)**.

##  Key Features

1. **Google Authentication**:
   - Each user has their own isolated To-Do list.
   - **Real Google Sign-In**: Powered by official Firebase Authentication (`GoogleAuthProvider`).
   - User profile displays real Google avatar, display name, and email with a clean Sign Out button.

2. **Required Deadline with Visual Urgency Highlighting**:
   - Every task requires a mandatory deadline (`datetime-local`).
   - Dynamic urgency color-coding:
     - 🚨 **< 3 Days**: Highlighted in **Red** (`--color-urgent-red`) with an `Urgent (< 3 days)` badge.
     - 📅 **> 3 Days (3 to 10 Days)**: Highlighted in **Blue** (`--color-medium-blue`) with an `Upcoming (3-10 days)` badge.
     - ⏳ **> 10 Days**: Highlighted in **Yellow/Amber** (`--color-later-yellow`) with a `Later (> 10 days)` badge.
     - ✅ **Completed**: Green highlight with checkmark and strike-through.

3. **Subtext Metadata Display (Placeholder below each task)**:
   - 📅 **Created:** Shows the date & time the work was added to the web app.
   - ⏰ **Deadline:** Shows the exact due date & time, plus humanized remaining time (e.g. `in 2 days`, `due in 5 hours`).

4. **Web Themes (Light & Dark)**:
   - Seamless toggle between **Light Mode** ☀️ and **Dark Mode** 🌙.
   - Automatically detects system preference (`prefers-color-scheme`).
   - High contrast color schemes compliant with WCAG accessibility guidelines.
   - Remembers user's theme choice in `localStorage`.

5. **📊 Excel as a Database (.xlsx / .xls / .csv)**:
   - **Multi-Sheet Export**: Saves your tasks as a structured Excel workbook with:
     - 📑 *Sheet 1: All Tasks* (ID, Title, Status, Deadline, Urgency, Created Date, Completed Date, Notes).
     - 📑 *Sheet 2: Completed Archive* (Archive of finished tasks with completion date and adherence status).
     - 📑 *Sheet 3: Database Overview* (User metadata, counts, export timestamp).
   - **Intelligent Import**: Load/restore tasks from any Excel spreadsheet (.xlsx, .xls, .csv). Intelligently maps columns (Title, Deadline, Notes, Status, etc.).
   - **Merge & Replace Options**: Choose to safely merge and update existing tasks or replace the entire database.
   - **Direct Disk Save**: Uses the modern File System Access API to save or sync directly to a file on disk (when supported).
   - **Quick Toolbar Buttons**: 1-click "Export to Excel" and "Import from Excel" right on the main toolbar.

6. ** Dedicated Completed Tasks Viewing & Archive**:
   - **Interactive Completed Stat Card**: Click the `✅ Completed` card at the top to instantly view finished works.
   - **Completed Tasks Archive Modal**: Click `✅ Completed` in the header to open an archive drawer showing:
     - Completion statistics (Total completed, on-time vs overdue).
     - Search bar to search through completed deliverables.
     - Completion timestamp and original deadline for every completed item.
     - `↩️ Reopen` button to restore any completed task back to active.
     - `🗑️ Clear All Completed` with a safety confirmation dialog.
     - Dedicated `📊 Export Completed to Excel` button.
   - **Completed Tasks View Banner**: Displays when filtering by completed tasks with quick actions.

7. **Power Features**:
   - Quick date buttons: `+1 Day`, `+2 Days`, `+5 Days`, `+14 Days`.
   - Real-time statistics counters (Total, Urgent, Upcoming, Later, Completed).
   - Search bar: instantly filter tasks by keywords.
   - Sort dropdown: Sort by deadline (soonest/latest), date created (newest/oldest), or alphabetical title.
   - Filter chips: All, Urgent (<3d), 3-10 Days, >10 Days, Active, Completed.
   - Edit task modal and delete task with toast notifications.

---

## 🚀 How to Run

### Method 1: Directly in Browser
Double-click `index.html` or open it in Google Chrome, Microsoft Edge, Firefox, or Safari.

### Method 2: Using Python Local Server (Recommended for OAuth)
In your terminal:
```bash
# Navigate to the project directory
cd "c:\Users\SULTHAN IBRAHAM\OneDrive\Desktop\To do list"

# Start a local web server on port 8000
python -m http.server 8000
```
Then open: [http://localhost:8000](http://localhost:8000)

---

## ⚙️ Connecting Your Own Firebase Project for Live Google OAuth

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Enable **Authentication** -> **Sign-in method** -> **Google**.
3. In Project Settings -> General, add a Web App to get your `firebaseConfig` JSON object.
4. Open the website, click the **⚙️ Settings** icon in the top header, and paste your JSON config.
5. Click **Save & Connect**. Real Google account popups will now be active!
