# Coding Platform

An interactive environment where mentors guide students through coding challenges step by step. Students and mentors collaborate live on code, learning problem‑solving logic in real time.

## Features

* **Code snapshot saving and history:** Every submission automatically creates a timestamped snapshot, enabling review and rollback to previous attempts.
* **Automated semicolon-check and live feedback:** Submissions undergo a semicolon enforcement check and are executed against official solutions to provide instant pass/fail feedback.

## Tech Stack

* **Frontend:** React, Vite, Socket.IO client
* **Backend:** Node.js, Express, Socket.IO server
* **Database:** MongoDB (hosted on Railway)
* **Deployment:** Railway

## Prerequisites

* Node.js v18+
* npm or yarn
* A Railway account (for deployment)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Eilonasraf/Coding-Platform.git
   cd Coding-Platform
   ```

2. Install dependencies in both server and client:

   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

3. Create a `.env` in `server/`:

   ```env
   MONGODB_URI=<your MongoDB connection string>
   CLIENT_ORIGIN=http://localhost:5173
   PORT=4000
   ```

4. Create a `.env` in `client/src`:

   ```env
   VITE_API_URL=http://localhost:4000
   VITE_SOCKET_URL=http://localhost:4000
   ```

## Seeding the Database

In the `server/` folder, run:

```bash
node db/seed.js
```

This populates the `codeblocks` collection with sample exercises.

## Running Locally

1. Start the server:

   ```bash
   cd server
   npm run dev
   ```

2. Start the client:

   ```bash
   cd client
   npm run dev
   ```

3. Open your browser at [http://localhost:5173](http://localhost:5173)

## Deployment

This project is deployed on Railway:

* **App URL:** [https://client-production-7386.up.railway.app](https://client-production-7386.up.railway.app)
* **API URL:** [https://server-production-654c.up.railway.app](https://server-production-654c.up.railway.app)

Set your Railway environment variables under each service:

**Server**

```
MONGODB_URI=...(Railway internal URI)
CLIENT_ORIGIN=https://client-production-7386.up.railway.app
PORT=8080
```

**Client**

```
VITE_API_URL=https://server-production-654c.up.railway.app
VITE_SOCKET_URL=https://server-production-654c.up.railway.app
```

## Usage

* Open the app URL, select an exercise.
* The first user in a room becomes the mentor; subsequent users are students.
* Mentor edits code in read-only mode for students; students can type and submit snapshots.
* When mentor leaves, all students are notified and returned to the lobby.

## Contributing

Contributions are welcome! Please open issues or pull requests on GitHub.

## License

MIT © Eilon Asraf