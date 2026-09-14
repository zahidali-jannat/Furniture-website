1. What is this project

This is a website for a furniture brand. It is built to feel like a high-end design magazine rather than a normal online shop.

It has two main parts.

The home page tells the brand's story as you scroll. It uses short video clips of furnished rooms, large photographs, and big serif headings. Some of the videos play on their own; others move forward and backward as you scroll, so you control the camera.

The Collections pages are the catalogue. They work in four levels, and you can always tell where you are:

Collections           everything the brand makes, read as one long page
    ↓
Lighting              a group of related types
    ↓
Chandeliers           one type of furniture
    ↓
Chandelier No. 02     one piece



What	Why it is here
Next.js 16	The website framework. Builds every page ahead of time so pages open instantly.
React 19	Builds the parts of the page.
TypeScript	Catches mistakes while writing code instead of after.
Tailwind CSS 4	All the styling.
GSAP + ScrollTrigger	The scroll animations, including the scroll-controlled videos.
Lenis	Makes scrolling smooth instead of jumpy.
Nodemailer	Sends the confirmation email. Works with any email provider.
sharp	Resizes photographs when preparing them for the web.
ffmpeg-static	Cuts and compresses the video clips.
puppeteer-core	Used only for testing — takes screenshots and measures the pages.


3. How to run it on your laptop
What you need first
Node.js version 20 or newer. Check by opening a terminal and typing:

node -v
If you see something like v22.19.0, you are fine. If you get an error, install it from nodejs.org and try again.

Step 1 — Open the project folder
cd path/to/CLAUDE_WEBSITE
Step 2 — Install the packages
Do this once. It downloads everything the project needs and takes a few minutes.

npm install
Step 3 — Start the site
npm run dev
Then open http://localhost:3000 in your browser.

Leave the terminal open while you work. The site reloads by itself whenever you change a file. Press Ctrl + C in the terminal to stop it.

Step 4 — (Only if you change pictures or videos)
Skip this unless you add, remove or replace files in image/ or media/.

npm run catalogue
npm run prep:assets
Use catalogue after changing pictures — it takes a few seconds. Use prep:assets after changing videos, or to redo everything; it also re-cuts the video and can take several minutes.

Step 5 — (Optional) Make the contact email work
The form works without this, but no email is sent.

Open the file .env.local
Fill in SMTP_USER and SMTP_PASS. The file has instructions at the top for Brevo and for Gmail.
Test it before trusting it:
npm run mail:check -- your@email.com
This tells you in plain words whether it worked, and what is wrong if not.

Stop the site (Ctrl + C) and start it again, because settings are only read at startup.
To see what the email looks like without setting anything up:

npm run mail:demo
Running the finished version
npm run dev is for working on the site. To run the fast, finished version:

npm run build
npm run start
