# 🤝 Contributing to Notes App

Thank you for considering contributing to **Notes App** 🎉  
We welcome all kinds of contributions — whether it’s fixing a bug, improving documentation, designing UI, or adding new features.

---

## 🛠 Project Setup

Follow these steps to set up the project locally:

1. **Fork & Clone the repository**
   ```bash
   git clone https://github.com/<your-username>/Notes-App.git
   cd Notes-App
   ```
2. **Install dependencies**

```bash
npm install
```

### 3. Set Up Environment Variables

You’ll need a **MongoDB connection URI** and **Google OAuth credentials**.

---

#### MongoDB Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free cluster.  
2. In **Database Access**, create a database user (e.g., `notesapp`).  
3. In **Network Access**, allow your IP (`0.0.0.0/0` for testing).  
4. Go to your cluster → **Connect** → choose *Connect your application*.  
5. Copy the connection string (example):  

   ```bash
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/notesApp?retryWrites=true&w=majority
   ```
6. Replace <username> and <password> with your credentials, then add it to .env:

  ```env
  MONGODB_URI=mongodb+srv://notesapp:yourpassword@cluster0.xxxxx.mongodb.net/notesApp
  ```

#### Google OAuth Setup

1. Go to Google Cloud Console.
2. Create a new project (e.g., Notes App).
3. Enable APIs & Services → Credentials → OAuth consent screen (choose External for testing).
4. Create OAuth Client ID → Application type: Web application.
5. Add this Authorized redirect URI:
```bash
http://localhost:5000/google/callback
```
This URL is already given in the final env snippet.
6. Copy the Client ID and Client Secret.
7. Add them to your .env file:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/google/callback
```

4. **Run the development server**

```bash
npm start
```
- The app will be available at http://localhost:5000.

---

## 🐛 How to Raise an Issue

- Search the [issue tracker](https://github.com/soumya813/Notes-App/issues) to make sure the issue doesn’t already exist.  
- Use a **clear, descriptive title**.  
- Describe the problem clearly:
  - Steps to reproduce
  - Expected vs. actual behavior
  - Screenshots (if applicable)
  - Environment details (OS, browser, Node.js version)

---

## 💬 Commenting on Issues

- Be respectful and constructive.  
- Add extra context, screenshots, or logs if you’ve faced the same issue.  
- If you’re interested in working on the issue, comment:  
  `I would like to work on this issue.`
- and wait for the project admin/maintainer to assign it to you.

---

## 🔀 Submitting a Pull Request (PR)

1. **Create a new branch**
 ```bash
 git checkout -b feature/your-feature-name
 ```
2. **Make your changes**
3. **Commit your changes**
   - Use a meaningful commit message format:
   - Examples:
   ```bash
   fix(auth): resolve session timeout issue
   feat(notes): add search by content feature
   docs(readme): update setup instructions
   ```
4. **Push to your fork**
```bash
git push origin feature/your-feature-name
```
5. **Open a Pull Request**
- Go to your fork on GitHub → New Pull Request
- Link the issue (e.g., Closes #12)
- Add a meaningful title & description

## 🌟 Areas You Can Contribute

- 🧑‍💻 **Code**: Features, bug fixes, optimizations  
- 🎨 **Design**: UI/UX improvements, styling updates  
- 📖 **Docs**: README, tutorials, translations  
- ✅ **Testing**: Unit tests, bug reports  
- 💡 **Ideas**: Feature suggestions, workflow improvements  

---

## 📜 Code of Conduct

We follow simple community guidelines:

- Be kind, respectful, and inclusive.  
- Provide constructive feedback.  
- No harassment, trolling, or hate speech.  
- Help make this project a welcoming space for everyone.  

Violations may result in being banned from contributing.

---

## 🔒 Security Policy

If you discover a **security vulnerability**:

- **Do NOT** create a public GitHub issue.  
- Instead, email the project admin at: **soumyasrivastav813@gmail.com**  
- We’ll review and respond promptly.  

---
