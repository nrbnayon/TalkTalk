# Todo Frontend

This is a responsive and visually accurate frontend application for Todo, built using the latest Next.js framework. The application is styled with Tailwind CSS, and state management is handled using Redux RTK. The design components leverage Shadcn UI for a modern and cohesive user interface.


## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Usage](#usage)
- [API Integration](#api-integration)
- [Folder Structure](#folder-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Pixel-perfect design** based on Figma specifications.
- **Responsive layout** for all major devices and browsers.
- **Dynamic filtering and product display** with interactive UI.
- **Redux RTK** for efficient state management.
- **API Integration** for dynamic data fetching.
- Optimized for **performance** and **SEO**.

---

## Technology Stack

- **Framework**: [Next.js (latest)](https://nextjs.org)
- **CSS Framework**: [Tailwind CSS](https://tailwindcss.com)
- **State Management**: [Redux Toolkit (RTK)](https://redux-toolkit.js.org)
- **UI Components**: [Shadcn UI](https://shadcn.dev)
- **Language**: JavaScript (ES6+)

---

## Installation

To get started with this project locally, follow these steps:

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/Todo.git
   Navigate into the project directory:
   ```

cd Todo
Install dependencies using your preferred package manager:

npm install

# or

yarn install

# or

pnpm install
Create a .env.local file in the root directory and add the following environment variables:

env

API_URL="192.168.10.56:3000"
Run the development server:

npm run dev

# or

yarn dev

# or

pnpm dev
Open http://localhost:3000 in your browser to see the result.

Usage
Run Locally
Start the development server:

npm run dev
Build for Production
Generate a production build:

npm run build
Start Production Server
Start the production server:

npm run start
API Integration
The application integrates APIs documented in the provided Postman collection. Ensure the backend server is running, and the API_URL environment variable is correctly set.

Key Features:
Authentication: Uses JWT tokens for secure API requests.
Dynamic Data Fetching: Fetches product and category data dynamically.
Error Handling: Displays user-friendly messages on errors.

        # Dependencies and scripts

Contributing
We welcome contributions to improve this project! To contribute:

Fork the repository.
Create a new branch for your feature:

git checkout -b feature-name
Commit your changes:

git commit -m "Add new feature"
Push your branch and submit a pull request.
License
This project is licensed under the MIT License. See the LICENSE file for details.

For any queries or suggestions, feel free to contact us or create an issue in the repository.
