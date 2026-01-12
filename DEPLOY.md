# 🚀 How to Deploy on Render

This project is configured for easy deployment on [Render](https://render.com).

## 1. Push to GitHub
First, make sure your code is pushed to a GitHub repository.
If you haven't initialized git yet:

```bash
git init
git add .
git commit -m "Ready for deploy"
# git remote add origin <your-repo-url>
# git push -u origin main
```

## 2. Deploy via Render Dashboard (Recommended)

1.  Log in to [dashboard.render.com](https://dashboard.render.com/).
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub repository.
4.  Render will automatically detect the settings:
    *   **Runtime**: Python 3
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `gunicorn -c gunicorn_config.py app:app`
5.  Click **Create Web Service**.

## 3. Deploy via Blueprint (Infrastructure as Code)

1.  In Render Dashboard, click **New +** and select **Blueprint**.
2.  Connect your repo.
3.  Render will read the `render.yaml` file valid in this project and auto-configure everything.
4.  Click **Apply**.

## ✅ Verification
Once deployed, Render will verify:
- Dependencies are installed (`requirements.txt`)
- Gunicorn starts the Flask app (`app:app`)
- The site will be live at `https://<your-service-name>.onrender.com`.

## ⚠️ Important Note about Master Data
This app reads from `assets/product_cost_master.xlsx`.
Make sure this file is committed to your Git repository so Render can access it.
