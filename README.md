# 🌾 KrushikaDhara — FarmerConnect

### **Good questions grow better harvests.**

FarmerConnect brings farmers and farming communities together to ask questions, share knowledge, and learn from one another. From crop concerns to practical field advice, it’s a place to turn experience into something everyone can use.

> **Ask. Share. Grow.**

---

## 🌱 What you can do

- **Ask the community** — post farming questions and get answers.
- **Share what you know** — help other farmers with your experience.
- **Explore farming blogs** — read and share useful articles.
- **Stay in the loop** — receive notifications about community activity.
- **Report issues** — flag content that needs attention.
- **Share images** — attach photos to help explain what’s happening in the field.

---

## 🧰 Built with

### Backend
- Node.js
- Express
- MongoDB
- Cloudinary for image hosting

### Frontend
- Add your frontend framework and tools here

---

## 📁 Project structure

```text
FarmerConnect/
├── Backend/
│   ├── config/         # Database and Cloudinary setup
│   ├── controllers/    # Application logic
│   ├── middleware/     # Authentication and image handling
│   ├── models/         # MongoDB models
│   ├── routes/         # API routes
│   └── server.js       # Backend entry point
└── farmerconnect-frontend/
    └── ...             # Frontend application
```

---

## 🚀 Run it locally

### 1. Clone the project

```bash
git clone https://github.com/MohnishKrish/KrushikaDhara_Major_FarmerConnect.git
cd KrushikaDhara_Major_FarmerConnect
```

### 2. Start the backend

```bash
cd Backend
npm install
```

Create a `.env` file in `Backend/` and add the environment variables your configuration expects. Common examples include:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Start the server using the script defined in `Backend/package.json`:

```bash
npm run dev
```

If the project doesn’t define a `dev` script, check `Backend/package.json` for the available start command.

### 3. Start the frontend

Open a new terminal:

```bash
cd farmerconnect-frontend
npm install
npm run dev
```

Use the frontend’s configured development command if it differs.

---

## 🔐 Before you launch

- Keep `.env` files and credentials out of Git.
- Set the frontend’s API URL to your backend address.
- Configure your MongoDB and Cloudinary credentials.
- Update this README with the exact frontend framework, commands, and deployed links.

---

## 🧑‍🌾 The idea

Farming knowledge is strongest when it’s shared. **FarmerConnect** is built to make that sharing easier—one question, one answer, and one growing community at a time.

---

### 🌾 Built for the people who grow our future.
