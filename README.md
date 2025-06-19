# 📝 Notes App - A Secure, Minimalistic Note-Taking Platform

![GitHub last commit](https://img.shields.io/github/last-commit/soumya813/Notes-App)
![Issues](https://img.shields.io/github/issues/soumya813/Notes-App)
![Pull Requests](https://img.shields.io/github/issues-pr/soumya813/Notes-App)
![SSoC'25](https://img.shields.io/badge/Selected%20for-SSoC'25-orange)
![License](https://img.shields.io/github/license/soumya813/Notes-App)

Welcome to **Notes App**, a simple and intuitive web-based note-taking platform built with **Node.js, Express, MongoDB**, and **EJS templating**. The app allows users to **sign up, log in, create, view, search, and delete notes** — all with a clean UI and user-friendly dashboard.

> 🚀 Proudly selected for **SSoC'25**  
> 📌 Maintained by **Soumya Srivastav** (Project Admin)

---

## 📸 Demo

![Notes App UI Screenshot](public/img/Notes-App-ui.png)

> 💡 Want to try it live? Deploying soon on Vercel/Render – Stay tuned!

---

## 📖 Features

- 👤 **User Authentication** (Register/Login with secure sessions)  
- ✏️ **Create, Edit & Delete Notes**  
- 🔍 **Search Notes** by title/content  
- 🧾 Clean & Responsive UI with EJS Templates  
- 🧠 MVC Architecture with Controllers, Routes, and Middleware  
- 📁 Well-structured codebase for scalability  
- ✅ Protected routes using middleware (`checkAuth.js`)  
- ⚙️ MongoDB integration with Mongoose schemas  

---

## 🛠️ Tech Stack

| Tech               | Description            |
|--------------------|------------------------|
| **Node.js**        | JavaScript runtime     |
| **Express.js**     | Web framework          |
| **MongoDB**        | NoSQL Database         |
| **Mongoose**       | ODM for MongoDB        |
| **EJS**            | Embedded JavaScript    |
| **Bootstrap**      | Frontend Styling       |
| **express-session**| Session management     |

---

## 🔗 Project Structure

```plaintext
Notes-App/
├── app.js
├── package.json
├── .env
├── public/
│   ├── css/
│   │   └── main.css
│   └── img/
├── server/
│   ├── controllers/
│   │   ├── mainController.js
│   │   └── dashboardController.js
│   ├── middleware/
│   │   └── checkAuth.js
│   ├── models/
│   │   ├── User.js
│   │   └── Notes.js
│   └── routes/
│       ├── auth.js
│       ├── dashboard.js
│       └── index.js
├── views/
│   ├── index.ejs
│   ├── about.ejs
│   ├── 404.ejs
│   ├── layouts/
│   │   ├── front-page.ejs
│   │   ├── main.ejs
│   │   └── dashboard.ejs
│   ├── partials/
│   │   ├── header.ejs
│   │   ├── footer.ejs
│   │   └── header_dashboard.ejs
│   └── dashboard/
│       ├── add.ejs
│       ├── index.ejs
│       ├── search.ejs
│       └── view-notes.ejs
````

---

## 🚀 Getting Started

1. **Clone the repository**

```bash
git clone https://github.com/soumya813/Notes-App.git
cd Notes-App
```

2. **Install Dependencies**

```bash
npm install
```

3. **Set Up Environment Variables**

Create a `.env` file in the root directory and add:

```env
MONGODB_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/google/callback
PORT=5000
```

4. **Run the App**

```bash
npm start
```

The app will run at [http://localhost:5000](http://localhost:5000)

---

## 🌟 SSoC’25 Spotlight

📢 This project is officially part of **SSoC'25 (Social Summer of Code 2025)!**

---

## 🤝 Contributing

We ❤️ contributions!

* Fork the repo
* Create a new branch: `git checkout -b feature-name`
* Make your changes and commit
* Push and submit a PR
* Wait for review 🙌

Please follow our Code of Conduct and Contributing Guidelines (coming soon).

---

## 👤 Project Admin

| Name             | GitHub                                     | Role          |
| ---------------- | ------------------------------------------ | ------------- |
| Soumya Srivastav | [@soumya813](https://github.com/soumya813) | Project Admin |

---

## 🧑‍💻 Contributors

<a href="https://github.com/soumya813/Notes-App/graphs/contributors">  
  <img src="https://contrib.rocks/image?repo=soumya813/Notes-App" />  
</a>

---

## 📃 License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

```

